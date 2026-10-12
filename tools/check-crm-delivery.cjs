const assert = require('node:assert/strict');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { handler } = require('./check-form-delivery.cjs');

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
const response = (body, status = 200, headers = {}) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

function fixture(options = {}) {
  const documents = new Map(),
    calls = [],
    deals = [],
    notes = [];
  let revision = 0,
    queueFailed = false,
    lostDeal = false,
    lostNote = false,
    failedCheckpoint = false;
  const serverClient = {
    async getDocument(id) {
      return clone(documents.get(id));
    },
    async create(document) {
      const stored = {
        ...clone(document),
        _id: document._id || `legacy-${documents.size}`,
        _rev: String(++revision),
      };
      documents.set(stored._id, stored);
      return clone(stored);
    },
    async createIfNotExists(document) {
      if (options.queueFails && document._type === 'enquirySubmission') {
        queueFailed = true;
        throw new Error('Queue unavailable');
      }
      if (options.archiveFails && document._type === 'lead') throw new Error('Archive unavailable');
      return clone(documents.get(document._id)) || this.create(document);
    },
    patch(id) {
      let expected, values;
      const patch = {
        ifRevisionId(rev) {
          expected = rev;
          return patch;
        },
        set(next) {
          values = next;
          return patch;
        },
        async commit() {
          const stored = documents.get(id);
          if (!stored || stored._rev !== expected) throw new Error('Revision conflict');
          if (options.checkpointFails && values['crm.dealId'] && !failedCheckpoint) {
            failedCheckpoint = true;
            throw new Error('Checkpoint unavailable');
          }
          for (const [key, value] of Object.entries(values)) {
            const parts = key.split('.');
            let target = stored;
            for (const part of parts.slice(0, -1)) target = target[part] ||= {};
            target[parts.at(-1)] = clone(value);
          }
          stored._rev = String(++revision);
          return clone(stored);
        },
      };
      return patch;
    },
    async fetch() {
      return [...documents.values()]
        .filter(
          (doc) => doc._type === 'enquirySubmission' && doc.emailId && doc.crm.status !== 'synced',
        )
        .map((doc) => ({ _id: doc._id }));
    },
  };
  const fetch = async (url, request) => {
    const target = new URL(url);
    assert.equal(target.origin, 'https://api.brevo.com');
    assert.equal(request.headers['api-key'], 'brevo-test-secret');
    assert.equal(request.cache, 'no-store');
    assert.ok(request.signal);
    const body = request.body ? JSON.parse(request.body) : undefined;
    calls.push({ path: target.pathname, query: target.searchParams, method: request.method, body });
    if (target.pathname === '/v3/contacts' && request.method === 'POST') {
      assert.equal(body.updateEnabled, true);
      assert.equal(body.forceMerge, false);
      assert.deepEqual(body.listIds, [3]);
      assert.equal('emailBlacklisted' in body, false);
      assert.equal('smsBlacklisted' in body, false);
      if (options.contactStatus)
        return response(
          {
            code: 'provider_error',
            message: 'Never log visitor@example.test or brevo-test-secret',
          },
          options.contactStatus,
          { 'Retry-After': '120' },
        );
      if (options.phoneConflict && body.attributes.SMS)
        return response({ code: 'duplicate_parameter' }, 400);
      return options.existingContact ? response(null, 204) : response({ id: 41 }, 201);
    }
    if (target.pathname.startsWith('/v3/contacts/'))
      return response({ id: 41, emailBlacklisted: true });
    if (target.pathname === '/v3/crm/deals' && request.method === 'GET') {
      const name = target.searchParams.get('filters[attributes.deal_name]');
      return response({ items: deals.filter((deal) => deal.attributes.deal_name === name) });
    }
    if (target.pathname === '/v3/crm/deals' && request.method === 'POST') {
      assert.equal(body.attributes.pipeline, '6acd18d26b19db2a45b1cef1');
      assert.equal(body.attributes.deal_stage, '0e5173b4643c420bbacdd97cc7d22450');
      assert.deepEqual(body.linkedContactsIds, [41]);
      if (options.dealStatus) return response({ code: 'invalid_parameter' }, options.dealStatus);
      if (options.dealNotReceived) throw new Error('Connection lost before acknowledgement');
      const deal = {
        id: `deal-${deals.length + 1}`,
        attributes: { ...body.attributes, deal_name: body.name },
        linkedContactsIds: body.linkedContactsIds,
      };
      deals.push(deal);
      if (options.lostDealResponse && !lostDeal) {
        lostDeal = true;
        throw new Error('Response lost after creation');
      }
      return response({ id: deal.id }, 201);
    }
    if (target.pathname === '/v3/crm/notes' && request.method === 'GET') {
      return response(
        notes.filter((note) => note.dealIds.includes(target.searchParams.get('entityIds'))),
      );
    }
    if (target.pathname === '/v3/crm/notes' && request.method === 'POST') {
      assert.ok(body.text.length <= 10000);
      assert.deepEqual(body.contactIds, [41]);
      assert.ok(body.dealIds[0]);
      assert.equal(body.text.includes('<script>'), false);
      if (options.noteStatus) return response({ code: 'provider_error' }, options.noteStatus);
      const note = { id: `note-${notes.length + 1}`, ...body };
      notes.push(note);
      if (options.lostNoteResponse && !lostNote) {
        lostNote = true;
        throw new Error('Response lost after note creation');
      }
      return response({ id: note.id });
    }
    throw new Error(`Unexpected external call: ${target.pathname}`);
  };
  const environment = {
    BREVO_ENABLED: 'true',
    BREVO_API_KEY: 'brevo-test-secret',
    CRON_SECRET: 'test-cron-secret',
    ...options.env,
  };
  const makeHandler = (kind) =>
    handler(kind, { env: environment, serverClient, fetch, idempotentMail: true, ...options.mail });
  const receipts = () => [...documents.values()].filter((doc) => doc._type === 'enquirySubmission');
  const allowRetry = () =>
    receipts().forEach((doc) => {
      doc.crm.nextAttemptAt = new Date(0).toISOString();
      doc.crm.leaseUntil = '';
    });
  return {
    documents,
    calls,
    deals,
    notes,
    serverClient,
    fetch,
    environment,
    makeHandler,
    receipts,
    allowRetry,
    queueFailed: () => queueFailed,
  };
}

async function run() {
  let checks = 0;
  const metadata = {
    submissionId: randomUUID(),
    attribution: {
      sourceUrl: 'https://tdkdb.com/en/projects/almond-suites',
      firstTouch: {
        landingPage: 'https://tdkdb.com/en?utm_source=google',
        referrer: 'https://google.com/',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'almond-launch',
        gclid: 'sample-click',
        capturedAt: new Date().toISOString(),
      },
      lastTouch: { utm_source: 'instagram', utm_medium: 'paid-social' },
    },
  };
  for (const kind of ['contact', 'interest']) {
    for (const existingContact of [false, true]) {
      const f = fixture({ existingContact });
      const h = f.makeHandler(kind);
      const submitted = {
        ...h.valid,
        ...metadata,
        submissionId: randomUUID(),
        phone: '+357 99 123 456',
      };
      assert.equal((await h.submit(submitted)).status, 200);
      assert.equal(h.emails.length, 2);
      assert.equal(f.deals.length, 1);
      assert.equal(f.receipts()[0].crm.status, 'synced');
      assert.ok(f.notes.some((note) => note.text.includes('almond-launch')));
      assert.ok(f.notes.some((note) => note.text.includes('sample-click')));
      assert.ok(f.notes.some((note) => note.text.includes('+357 99 123 456')));
      assert.equal(
        f.calls.find((call) => call.path === '/v3/contacts').body.attributes.SMS,
        '+35799123456',
      );
      assert.equal(f.receipts()[0]._id.includes('.'), true);
      for (let replay = 0; replay < 5; replay++)
        assert.equal((await h.submit(submitted)).status, 200);
      assert.equal(h.emails.length, 2);
      assert.equal(f.deals.length, 1);
      assert.equal((await h.submit({ ...submitted, message: 'An edited enquiry' })).status, 409);
      // A cold serverless instance uses the durable receipt rather than memory.
      assert.equal((await f.makeHandler(kind).submit(submitted)).status, 200);
      checks += 5;
    }
    for (const data of [{ email: 'invalid' }, { _honeypot: 'bot' }]) {
      const f = fixture(),
        h = f.makeHandler(kind);
      await h.submit({ ...h.valid, ...metadata, ...data });
      assert.equal(h.emails.length, 0);
      assert.equal(f.calls.length, 0);
      assert.equal(f.receipts().length, 0);
      checks++;
    }
    const failedMail = fixture({ mail: { notification: 'reject' } }),
      failed = failedMail.makeHandler(kind);
    assert.equal((await failed.submit({ ...failed.valid, ...metadata })).status, 500);
    assert.equal(failedMail.calls.length, 0);
    assert.equal(failedMail.receipts().length, 0);
    checks++;
    for (const status of [401, 429, 500]) {
      const f = fixture({ contactStatus: status }),
        h = f.makeHandler(kind);
      assert.equal((await h.submit({ ...h.valid, ...metadata })).status, 200);
      assert.equal(h.emails.length, 2);
      assert.equal(f.receipts()[0].crm.status, 'retry');
      assert.ok(
        h.logs.every(
          (log) => !log.includes('brevo-test-secret') && !log.includes('visitor@example.test'),
        ),
      );
      checks++;
    }
    const queue = fixture({ queueFails: true }),
      h = queue.makeHandler(kind);
    assert.equal((await h.submit({ ...h.valid, ...metadata })).status, 200);
    assert.equal(h.emails.length, 2);
    assert.equal(queue.calls.length, 0);
    assert.equal(queue.queueFailed(), true);
    checks++;
  }

  for (const options of [
    { lostDealResponse: true },
    { checkpointFails: true },
    { lostNoteResponse: true },
  ]) {
    const f = fixture(options),
      h = f.makeHandler('interest');
    assert.equal((await h.submit({ ...h.valid, ...metadata })).status, 200);
    const originalEmails = h.emails.length;
    f.allowRetry();
    const api = h.load(path.resolve('src/lib/crm/submissions.ts'));
    await api.retryPendingSubmissions();
    assert.equal(f.deals.length, 1);
    assert.equal(f.receipts()[0].crm.status, 'synced');
    assert.equal(
      f.calls.filter((call) => call.path === '/v3/crm/deals' && call.method === 'POST').length,
      1,
    );
    assert.equal(h.emails.length, originalEmails);
    const noteMarkers = f.notes.map((note) => /TDK enquiry [^<]+/.exec(note.text)[0]);
    assert.equal(new Set(noteMarkers).size, noteMarkers.length);
    checks += 2;
  }
  {
    const f = fixture({ dealNotReceived: true }),
      h = f.makeHandler('contact');
    assert.equal((await h.submit({ ...h.valid, ...metadata })).status, 200);
    f.allowRetry();
    await h.load(path.resolve('src/lib/crm/submissions.ts')).retryPendingSubmissions();
    assert.equal(f.receipts()[0].crm.status, 'review');
    assert.equal(
      f.calls.filter((call) => call.path === '/v3/crm/deals' && call.method === 'POST').length,
      1,
    );
    assert.equal(f.deals.length, 0);
    checks++;
  }
  {
    const f = fixture({ phoneConflict: true }),
      h = f.makeHandler('contact');
    assert.equal((await h.submit({ ...h.valid, ...metadata, phone: '+35799123456' })).status, 200);
    assert.equal(f.receipts()[0].crm.status, 'synced');
    assert.equal(
      f.calls.filter((call) => call.path === '/v3/contacts' && call.method === 'POST').length,
      2,
    );
    assert.ok(f.notes.some((note) => note.text.includes('+35799123456')));
    checks++;
  }
  {
    const f = fixture(),
      h = f.makeHandler('interest');
    const data = { ...h.valid, ...metadata };
    const responses = await Promise.all([h.submit(data), f.makeHandler('interest').submit(data)]);
    assert.ok(responses.every((response) => response.status === 200));
    assert.equal(f.deals.length, 1);
    assert.equal(f.receipts().length, 1);
    const h2 = f.makeHandler('interest');
    await h2.submit({
      ...h2.valid,
      ...metadata,
      submissionId: randomUUID(),
      projectSlug: 'modular',
      projectName: 'Modular',
    });
    assert.equal(f.deals.length, 2);
    assert.equal(f.deals[1].attributes.pipeline, f.deals[0].attributes.pipeline);
    assert.ok(f.deals[1].attributes.deal_name.includes('Modular'));
    checks += 2;
  }
  {
    const f = fixture({ archiveFails: true }),
      h = f.makeHandler('interest');
    assert.equal((await h.submit({ ...h.valid, ...metadata })).status, 200);
    assert.equal(f.receipts()[0].crm.status, 'synced');
    checks++;
  }
  {
    const f = fixture(),
      h = f.makeHandler('interest');
    assert.equal(
      (await h.submit({ ...h.valid, ...metadata, message: '<&"\n>'.repeat(2000) })).status,
      200,
    );
    assert.equal(f.receipts()[0].crm.status, 'synced');
    assert.ok(f.notes.length > 5);
    assert.ok(f.notes.every((note) => note.text.length <= 10000));
    assert.ok(f.notes.some((note) => note.text.includes('&lt;')));
    checks++;
  }
  {
    const f = fixture({ env: { BREVO_ENABLED: 'false' } }),
      h = f.makeHandler('contact');
    assert.equal((await h.submit({ ...h.valid, ...metadata })).status, 200);
    assert.equal(f.calls.length, 0);
    assert.equal(f.receipts().length, 0);
    checks++;
  }
  {
    const f = fixture({ env: { BREVO_API_KEY: '' } }),
      h = f.makeHandler('contact');
    assert.equal((await h.submit({ ...h.valid, ...metadata })).status, 200);
    assert.equal(f.receipts()[0].crm.status, 'pending');
    assert.equal(f.calls.length, 0);
    checks++;
  }
  {
    const f = fixture(),
      h = f.makeHandler('contact');
    const retry = h.load(path.resolve('src/app/api/crm/retry/route.ts'));
    const { NextRequest } = require('next/server');
    for (const token of ['', 'Bearer invalid'])
      assert.equal(
        (
          await retry.GET(
            new NextRequest('https://tdkdb.com/api/crm/retry', {
              headers: { authorization: token },
            }),
          )
        ).status,
        401,
      );
    assert.equal(
      (
        await retry.GET(
          new NextRequest('https://tdkdb.com/api/crm/retry', {
            headers: { authorization: 'Bearer test-cron-secret' },
          }),
        )
      ).status,
      200,
    );
    assert.equal(f.calls.length, 0);
    checks++;
  }
  {
    // Verify the installed Resend SDK's real idempotency header serialization.
    const f = fixture();
    const previousFetch = globalThis.fetch;
    const requests = [];
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.resend.com/emails');
      const key = new Headers(options.headers).get('idempotency-key');
      assert.match(key, /^tdk-enquiry\/[a-f0-9]{64}\/(notification|acknowledgement)$/);
      requests.push({ key, body: JSON.parse(options.body) });
      return response({ id: `sdk-${requests.length}` });
    };
    try {
      const real = handler('contact', {
        env: f.environment,
        serverClient: f.serverClient,
        fetch: f.fetch,
        realSdk: true,
      });
      const data = { ...real.valid, ...metadata };
      assert.equal((await real.submit(data)).status, 200);
      assert.equal((await real.submit(data)).status, 200);
      assert.equal(requests.length, 2);
      assert.notEqual(requests[0].key, requests[1].key);
      f.environment.BREVO_ENABLED = 'false';
      assert.equal(
        (
          await handler('contact', { env: f.environment, serverClient: f.serverClient }).submit(
            data,
          )
        ).status,
        200,
      );
      assert.equal(requests.length, 2);
    } finally {
      globalThis.fetch = previousFetch;
    }
    checks += 2;
  }
  {
    const f = fixture({ dealNotReceived: true }),
      h = f.makeHandler('contact');
    await h.submit({ ...h.valid, ...metadata });
    f.allowRetry();
    const retry = h.load(path.resolve('src/app/api/crm/retry/route.ts'));
    const { NextRequest } = require('next/server');
    const id = f.receipts()[0]._id;
    const post = (data) =>
      retry.POST(
        new NextRequest('https://tdkdb.com/api/crm/retry', {
          method: 'POST',
          headers: { authorization: 'Bearer test-cron-secret', 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
      );
    assert.equal((await post({ id, action: 'confirm-absent-deal' })).status, 400);
    assert.equal((await post({ id: '../other', action: 'retry' })).status, 400);
    assert.equal((await post({ id, action: 'retry' })).status, 200);
    assert.equal(
      f.calls.filter((call) => call.path === '/v3/crm/deals' && call.method === 'POST').length,
      1,
    );
    checks++;
  }
  console.log(
    `${checks} CRM checks passed. All Brevo, Resend and Sanity operations were isolated.`,
  );
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
