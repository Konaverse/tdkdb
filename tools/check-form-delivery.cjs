const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const { Resend } = require('resend');

// Execute the real handlers with an isolated provider and CMS. No credentials,
// emails or lead documents leave the test process.
function handler(kind, scenario = {}) {
  const emails = [],
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
  class MailProvider {
    constructor(key) {
      assert.equal(key, 'test-only-key');
      this.emails = {
        send: async (email) => {
          emails.push(email);
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
          return { data: { id: `test-${emails.length}` }, error: null };
        },
      };
    }
  }
  const serverClient = {
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
          return require(name);
        },
      },
      { filename: file },
    );
    return module.exports;
  }
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
  async function submit(data = valid, raw = false) {
    const request = new NextRequest(`http://localhost/api/${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.0.2.1' },
      body: raw ? data : JSON.stringify(data),
    });
    const response = await post(request);
    return { status: response.status, body: await response.json() };
  }
  return { submit, valid, emails, leads, logs };
}

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
        assert.ok(test.logs.some((log) => log.includes('validation_error') && log.includes('403')));
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
    assert.equal(test.emails[0].to, `${kind === 'contact' ? 'interest' : 'contact'}@example.test`);
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
    assert.equal(test.emails[0].to, `${kind === 'contact' ? 'contact' : 'interest'}@example.test`);
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
              ? { name: 'validation_error', statusCode: 403, message: 'Sender domain not verified' }
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
  console.log(`${cases} delivery checks passed for both form endpoints.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
