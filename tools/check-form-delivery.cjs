const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const { Resend } = require('resend');

// Execute the real handlers with an isolated provider and CMS. No credentials,
// emails or lead documents leave the test process.
function isolate(scenario = {}) {
  const emails = [],
    mailOptions = [],
    leads = [],
    logs = [],
    modules = new Map();
  const environment = {
    RESEND_API_KEY: 'test-only-key',
    RESEND_FROM_EMAIL: 'TDK <studio@example.test>',
    CONTACT_FORM_TO_EMAIL: 'contact@example.test',
    INTEREST_FORM_TO_EMAIL: 'interest@example.test',
    ...scenario.env,
  };
  const acceptedKeys = new Map();
  class MailProvider {
    constructor(key) {
      assert.equal(key, 'test-only-key');
      this.emails = {
        send: async (email, options) => {
          const key = scenario.idempotentMail && options?.idempotencyKey;
          if (key && acceptedKeys.has(key)) return acceptedKeys.get(key);
          emails.push(email);
          mailOptions.push(options || {});
          const notification = emails.length % 2 === 1;
          const result = notification ? scenario.notification : scenario.acknowledgement;
          if (result === 'throw') throw new Error('Test transport failure');
          if (result === 'reject')
            return {
              data: null,
              error: {
                name: 'validation_error',
                statusCode: 403,
                message: 'Test provider rejection',
              },
            };
          if (result === 'empty') return { data: null, error: null };
          const accepted = { data: { id: `test-${emails.length}` }, error: null };
          if (key) acceptedKeys.set(key, accepted);
          return accepted;
        },
      };
    }
  }
  const serverClient = scenario.serverClient || {
    create: async (lead) => {
      if (scenario.archiveFails) throw new Error('Test archive unavailable');
      leads.push(lead);
      return lead;
    },
  };
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    const module = { exports: {} };
    modules.set(file, module);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(
      source,
      {
        module,
        exports: module.exports,
        process: { env: environment },
        fetch: scenario.fetch || globalThis.fetch,
        URL,
        URLSearchParams,
        AbortSignal,
        Buffer,
        console: {
          error: (...args) =>
            logs.push(
              args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '),
            ),
        },
        require: (name) => {
          if (name === 'resend') return { Resend: scenario.realSdk ? Resend : MailProvider };
          if (name === '@/lib/sanity/client') return { serverClient };
          if (name.startsWith('@/')) return load(path.resolve('src', `${name.slice(2)}.ts`));
          if (name.startsWith('.')) return load(path.resolve(path.dirname(file), `${name}.ts`));
          return require(name);
        },
      },
      { filename: file },
    );
    return module.exports;
  }
  return { environment, emails, mailOptions, leads, logs, load };
}

function handler(kind, scenario = {}) {
  const { emails, leads, logs, load } = isolate(scenario);
  const route = kind === 'contact' ? 'contact' : 'project-interest';
  const post = load(path.resolve('src/app/api', route, 'route.ts')).POST;
  const valid = {
    name: '  Preview <script> & Test  ',
    email: 'preview@example.test',
    phone: '',
    message: 'First line\nSecond <line>',
    _honeypot: '',
    ...(kind === 'contact'
      ? { projectType: 'residence-enquiry' }
      : {
          projectSlug: 'almond-suites',
          projectName: 'Almond Suites',
          unitPreference: '',
        }),
  };
  async function submit(data = valid, raw = false, headers = {}) {
    const request = new NextRequest(`http://localhost/api/${route}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.0.2.1',
        'user-agent': 'TestAgent/1.0',
        ...headers,
      },
      body: raw ? data : JSON.stringify(data),
    });
    const response = await post(request);
    return { status: response.status, body: await response.json() };
  }
  return { submit, valid, emails, leads, logs, load };
}

module.exports = { handler, isolate };

if (require.main === module)
  (async () => {
    let cases = 0;
    for (const kind of ['contact', 'interest']) {
      for (const [change, status] of [
        [{ name: '  ' }, 422],
        [{ email: 'invalid' }, 422],
      ]) {
        const test = handler(kind);
        assert.equal((await test.submit({ ...test.valid, ...change })).status, status);
        assert.equal(test.emails.length, 0);
        cases++;
      }
      let test = handler(kind);
      assert.equal((await test.submit('{', true)).status, 400);
      cases++;
      test = handler(kind);
      assert.equal((await test.submit({ ...test.valid, _honeypot: 'bot' })).status, 200);
      assert.equal(test.emails.length, 0);
      assert.equal(test.leads.length, 0);
      cases++;
      for (const env of [
        { RESEND_API_KEY: '' },
        { RESEND_FROM_EMAIL: '' },
        { RESEND_API_KEY: '  ' },
        { RESEND_FROM_EMAIL: '  ' },
        {
          CONTACT_FORM_TO_EMAIL: '',
          INTEREST_FORM_TO_EMAIL: '',
        },
        {
          CONTACT_FORM_TO_EMAIL: '  ',
          INTEREST_FORM_TO_EMAIL: '  ',
        },
      ]) {
        test = handler(kind, { env });
        assert.equal((await test.submit()).status, 503);
        assert.equal(test.emails.length, 0);
        cases++;
      }
      for (const notification of ['reject', 'throw', 'empty']) {
        test = handler(kind, { notification });
        const result = await test.submit();
        assert.equal(result.status, 500);
        assert.equal(result.body.success, false);
        assert.equal(test.emails.length, 1);
        assert.equal(test.leads.length, 0);
        if (notification === 'reject') {
          assert.ok(test.logs.some((log) => log.includes('Resend notification rejected:')));
          assert.ok(
            test.logs.some((log) => log.includes('validation_error') && log.includes('403')),
          );
          assert.ok(test.logs.every((log) => !log.includes('test-only-key')));
        }
        cases++;
      }
      for (const acknowledgement of [undefined, 'reject', 'throw']) {
        test = handler(kind, { acknowledgement });
        const result = await test.submit();
        assert.equal(result.status, 200);
        assert.equal(result.body.success, true);
        assert.equal(test.emails.length, 2);
        assert.equal(test.emails[0].replyTo, test.valid.email);
        assert.equal(
          test.emails[0].to,
          `${kind === 'contact' ? 'contact' : 'interest'}@example.test`,
        );
        assert.equal(test.emails[1].to, test.valid.email);
        assert.equal(test.emails[1].replyTo, test.emails[0].to);
        assert.ok(test.emails[0].html.includes('&lt;script&gt; &amp; Test'));
        assert.ok(test.emails[0].html.includes('First line<br/>Second &lt;line&gt;'));
        if (kind === 'interest') {
          assert.equal(test.leads.length, 1);
          assert.equal(test.leads[0]._type, 'lead');
          assert.equal(test.leads[0].status, 'new');
          assert.equal(test.leads[0].name, test.valid.name.trim());
        }
        cases++;
      }
      test = handler(kind, {
        env: { [kind === 'contact' ? 'CONTACT_FORM_TO_EMAIL' : 'INTEREST_FORM_TO_EMAIL']: '' },
      });
      assert.equal((await test.submit()).status, 200);
      assert.equal(
        test.emails[0].to,
        `${kind === 'contact' ? 'interest' : 'contact'}@example.test`,
      );
      cases++;
      test = handler(kind, {
        env: {
          RESEND_API_KEY: '  test-only-key  ',
          RESEND_FROM_EMAIL: '  TDK <studio@example.test>  ',
          CONTACT_FORM_TO_EMAIL: '  contact@example.test  ',
          INTEREST_FORM_TO_EMAIL: '  interest@example.test  ',
        },
      });
      assert.equal((await test.submit()).status, 200);
      assert.equal(test.emails[0].from, 'TDK <studio@example.test>');
      assert.equal(
        test.emails[0].to,
        `${kind === 'contact' ? 'contact' : 'interest'}@example.test`,
      );
      cases++;
      // Exercise the installed SDK's request serialization without contacting Resend.
      for (const rejected of [false, true]) {
        const requests = [];
        const previousFetch = globalThis.fetch;
        globalThis.fetch = async (url, options) => {
          assert.equal(url, 'https://api.resend.com/emails');
          assert.equal(new Headers(options.headers).get('authorization'), 'Bearer test-only-key');
          requests.push(JSON.parse(options.body));
          return new Response(
            JSON.stringify(
              rejected
                ? {
                    name: 'validation_error',
                    statusCode: 403,
                    message: 'Sender domain not verified',
                  }
                : { id: `test-sdk-${requests.length}` },
            ),
            { status: rejected ? 403 : 200, headers: { 'Content-Type': 'application/json' } },
          );
        };
        try {
          test = handler(kind, { realSdk: true });
          const result = await test.submit();
          assert.equal(result.status, rejected ? 500 : 200);
          assert.equal(requests.length, rejected ? 1 : 2);
          assert.equal(requests[0].reply_to, test.valid.email);
          assert.equal(requests[0].from, 'TDK <studio@example.test>');
          if (rejected) {
            assert.ok(
              test.logs.some((log) => log.includes('validation_error') && log.includes('403')),
            );
            assert.equal(result.body.error.includes('Sender domain'), false);
          } else {
            assert.equal(requests[1].reply_to, requests[0].to);
          }
          cases++;
        } finally {
          globalThis.fetch = previousFetch;
        }
      }
      test = handler(kind);
      for (let i = 0; i < 3; i++) assert.equal((await test.submit()).status, 200);
      assert.equal((await test.submit()).status, 429);
      assert.equal(test.emails.length, 6);
      cases++;
    }
    const archive = handler('interest', { archiveFails: true });
    assert.equal((await archive.submit()).status, 200);
    assert.ok(archive.logs.some((log) => log.includes('archive failed')));
    cases++;

    // Meta Conversions API: only with consent, deduplicated by the browser's
    // submission id, hashed per Meta's spec, and never fatal to the form.
    const { createHash } = require('node:crypto');
    const sha = (value) => createHash('sha256').update(value).digest('hex');
    const capiEnv = {
      NEXT_PUBLIC_META_PIXEL_ID: '123456789',
      META_CAPI_ACCESS_TOKEN: 'test-only-token',
      META_TEST_EVENT_CODE: 'TEST1',
    };
    const submissionId = '7f1c2a8e-5d3b-4c2e-9a1f-0b2c3d4e5f60';
    const granted = {
      cookie: 'tdk_consent=granted; _fbp=fb.1.1700000000000.123; _fbc=fb.1.1700000000000.abc',
    };
    for (const kind of ['contact', 'interest']) {
      const calls = [];
      const graph = async (url, options) => {
        calls.push({ url, body: JSON.parse(options.body) });
        return new Response('{"events_received":1}', { status: 200 });
      };
      let test = handler(kind, { env: capiEnv, fetch: graph });
      let result = await test.submit(
        { ...test.valid, name: 'Maria Ioannou', phone: '99 123456', submissionId },
        false,
        granted,
      );
      assert.equal(result.status, 200);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url, 'https://graph.facebook.com/v26.0/123456789/events');
      assert.equal(calls[0].body.access_token, 'test-only-token');
      assert.equal(calls[0].body.test_event_code, 'TEST1');
      const event = calls[0].body.data[0];
      assert.equal(event.event_name, 'Lead');
      assert.equal(event.event_id, submissionId);
      assert.equal(event.action_source, 'website');
      assert.ok(Number.isInteger(event.event_time));
      assert.deepEqual(event.user_data.em, [sha('preview@example.test')]);
      assert.deepEqual(event.user_data.ph, [sha('35799123456')]);
      assert.deepEqual(event.user_data.fn, [sha('maria')]);
      assert.deepEqual(event.user_data.ln, [sha('ioannou')]);
      assert.deepEqual(event.user_data.country, [sha('cy')]);
      assert.equal(event.user_data.client_ip_address, '192.0.2.1');
      assert.equal(event.user_data.client_user_agent, 'TestAgent/1.0');
      assert.equal(event.user_data.fbp, 'fb.1.1700000000000.123');
      assert.equal(event.user_data.fbc, 'fb.1.1700000000000.abc');
      assert.deepEqual(
        event.custom_data,
        kind === 'interest'
          ? { content_name: 'Almond Suites', content_category: 'property_interest' }
          : { content_category: 'general_contact' },
      );
      assert.ok(!JSON.stringify(event).includes('preview@example.test'));
      assert.ok(!JSON.stringify(event).includes('Maria'));
      cases++;

      // Names lose punctuation and digits; international phones keep their code.
      calls.length = 0;
      test = handler(kind, { env: capiEnv, fetch: graph });
      await test.submit(
        { ...test.valid, name: "Maria-Ann O'Neil 2", phone: '+44 (0)20 7946 0958', submissionId },
        false,
        granted,
      );
      assert.deepEqual(calls[0].body.data[0].user_data.fn, [sha('mariaann')]);
      assert.deepEqual(calls[0].body.data[0].user_data.ln, [sha('oneil')]);
      assert.deepEqual(calls[0].body.data[0].user_data.ph, [sha('442079460958')]);
      cases++;

      // fbc rebuilt from the landing fbclid when the cookie is absent.
      calls.length = 0;
      test = handler(kind, { env: capiEnv, fetch: graph });
      await test.submit(
        {
          ...test.valid,
          submissionId,
          attribution: {
            firstTouch: { fbclid: 'CLICK123', capturedAt: '2026-01-02T03:04:05.000Z' },
          },
        },
        false,
        { cookie: 'tdk_consent=granted' },
      );
      assert.equal(calls.length, 1);
      assert.equal(
        calls[0].body.data[0].user_data.fbc,
        `fb.1.${Date.parse('2026-01-02T03:04:05.000Z')}.CLICK123`,
      );
      assert.equal('fbp' in calls[0].body.data[0].user_data, false);
      cases++;

      // No consent, denied consent, or no token: nothing leaves the server.
      for (const [headers, env] of [
        [{}, capiEnv],
        [{ cookie: 'tdk_consent=denied; _fbp=fb.1.1.1' }, capiEnv],
        [granted, { ...capiEnv, META_CAPI_ACCESS_TOKEN: '' }],
      ]) {
        calls.length = 0;
        test = handler(kind, { env, fetch: graph });
        assert.equal(
          (await test.submit({ ...test.valid, submissionId }, false, headers)).status,
          200,
        );
        assert.equal(calls.length, 0);
        cases++;
      }

      // A rejected or failing Graph call is logged; the form still succeeds.
      for (const failing of [
        async () =>
          new Response('{"error":{"code":190,"message":"Invalid OAuth"}}', { status: 400 }),
        async () => {
          throw new Error('Graph unreachable');
        },
      ]) {
        test = handler(kind, { env: capiEnv, fetch: failing });
        result = await test.submit({ ...test.valid, submissionId }, false, granted);
        assert.equal(result.status, 200);
        assert.equal(result.body.success, true);
        assert.equal(test.emails.length, 2);
        assert.ok(test.logs.some((log) => log.includes('Meta CAPI')));
        assert.ok(test.logs.every((log) => !log.includes('test-only-token')));
        cases++;
      }
    }
    console.log(`${cases} delivery checks passed for both form endpoints.`);
  })().catch((error) => {
    console.error(error);
    process.exit(1);
  });
