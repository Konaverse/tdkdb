const assert = require('node:assert/strict');
const path = require('node:path');
const { NextRequest } = require('next/server');
const { isolate } = require('./check-form-delivery.cjs');

// Exercise the real Brevo lead-alert webhook with an isolated Brevo and mail
// provider. Nothing leaves the process; no secret or lead detail is logged.

const ROUTE = path.resolve('src/app/api/webhooks/brevo-lead/route.ts');
const SECRET = 'hook-test-secret';
const LEAD = {
  email: 'lead@example.test',
  attributes: {
    FIRSTNAME: 'Μαρία',
    LASTNAME: 'Παπαδοπούλου',
    SMS: '35799123456',
    INTERESTED_UNIT: '2_υπνοδωμάτια_με_ιδιωτικό_roof_garden',
    PURCHASE_TIMELINE: '3_6_μήνες',
    LEAD_ROLE: 'αγοραστής',
  },
};

const response = (body, status = 200) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function fixture(options = {}) {
  const brevoCalls = [];
  const state = { contactStatus: options.contactStatus || 0, contact: options.contact || LEAD };
  const fetch = async (url, request) => {
    const target = new URL(url);
    assert.equal(target.origin, 'https://api.brevo.com');
    assert.equal(request.method, 'GET');
    assert.equal(request.headers['api-key'], 'brevo-test-secret');
    brevoCalls.push(target.pathname);
    if (state.contactStatus === 404) return response({ code: 'document_not_found' }, 404);
    if (state.contactStatus)
      return response(
        { code: 'provider_error', message: 'lead@example.test' },
        state.contactStatus,
      );
    return response(state.contact);
  };
  const box = isolate({
    fetch,
    env: {
      BREVO_API_KEY: 'brevo-test-secret',
      BREVO_WEBHOOK_SECRET: SECRET,
      LEAD_ALERT_TO_EMAIL: 'alerts@example.test',
      ...options.env,
    },
    ...options.mail,
  });
  const post = box.load(ROUTE).POST;
  const call = async (body, { secret = SECRET, header = false, raw = false } = {}) => {
    const url = new URL('https://tdkdb.com/api/webhooks/brevo-lead');
    const headers = { 'Content-Type': 'application/json' };
    if (secret !== null && !header) url.searchParams.set('secret', secret);
    if (secret !== null && header) headers['x-webhook-secret'] = secret;
    const request = new NextRequest(url, {
      method: 'POST',
      headers,
      body: raw ? body : JSON.stringify(body),
    });
    const result = await post(request);
    return { status: result.status, body: await result.json() };
  };
  return { ...box, brevoCalls, state, call };
}

const event = (overrides = {}) => ({
  id: 987654,
  event: 'list_addition',
  email: 'Lead@example.test',
  key: 'k',
  date: '2026-10-14 12:00:00',
  list_id: [4],
  ts: 1792000000,
  ...overrides,
});

async function run() {
  let checks = 0;
  {
    // Authentication: query parameter or header, constant-time, never optional.
    const f = fixture();
    assert.equal((await f.call(event(), { secret: null })).status, 401);
    assert.equal((await f.call(event(), { secret: 'wrong' })).status, 401);
    assert.equal((await f.call(event(), { secret: `${SECRET} ` })).status, 401);
    assert.equal(f.emails.length, 0);
    assert.equal(f.brevoCalls.length, 0);
    assert.equal((await f.call(event(), { header: true })).status, 200);
    assert.equal(f.emails.length, 1);
    checks++;
  }
  {
    const f = fixture({ env: { BREVO_WEBHOOK_SECRET: '' } });
    assert.equal((await f.call(event())).status, 401);
    assert.equal(f.emails.length, 0);
    checks++;
  }
  {
    // The alert: Greek labels, humanized attributes, clickable phone, footer.
    const f = fixture();
    const result = await f.call(event());
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.outcomes, ['sent']);
    assert.deepEqual(f.brevoCalls, ['/v3/contacts/lead%40example.test']);
    assert.equal(f.emails.length, 1);
    const [mail] = f.emails;
    assert.equal(mail.to, 'alerts@example.test');
    assert.equal(mail.from, 'TDK <studio@example.test>');
    assert.equal(mail.subject, '🔔 Νέο lead Almond Suites – Μαρία');
    assert.ok(mail.text.includes('Όνομα: Μαρία Παπαδοπούλου'));
    assert.ok(mail.text.includes('Τηλέφωνο: 35799123456'));
    assert.ok(mail.text.includes('Email: lead@example.test'));
    assert.ok(mail.text.includes('Διαμέρισμα: 2 υπνοδωμάτια με ιδιωτικό roof garden'));
    assert.ok(mail.text.includes('Πότε: 3 6 μήνες'));
    assert.ok(mail.text.includes('Αγοραστής/Μεσίτης: αγοραστής'));
    assert.ok(mail.text.endsWith('Καλέστε εντός 5 λεπτών.'));
    assert.ok(mail.html.includes('href="tel:+35799123456"'));
    assert.ok(mail.html.includes('href="mailto:lead@example.test"'));
    assert.ok(mail.html.includes('2 υπνοδωμάτια με ιδιωτικό roof garden'));
    assert.ok(mail.html.includes('Καλέστε εντός 5 λεπτών.'));
    assert.equal(mail.html.includes('_'), false);
    assert.match(f.mailOptions[0].idempotencyKey, /^brevo-lead\/[a-f0-9]{40}$/);
    checks += 3;
  }
  {
    // Agents are flagged in the subject, whatever the capitalisation.
    for (const role of ['μεσίτης', 'Μεσίτης', 'ΜΕΣΊΤΗΣ'.toLowerCase()]) {
      const f = fixture({
        contact: { ...LEAD, attributes: { ...LEAD.attributes, LEAD_ROLE: role } },
      });
      await f.call(event());
      assert.equal(f.emails[0].subject, '[ΜΕΣΙΤΗΣ] 🔔 Νέο lead Almond Suites – Μαρία');
    }
    checks++;
  }
  {
    // Missing attributes show a dash; no phone means no tel link; the subject
    // falls back to the email; attribute text is escaped.
    const f = fixture({
      contact: { email: 'lead@example.test', attributes: { INTERESTED_UNIT: '<b>1_bed</b>' } },
    });
    await f.call(event());
    const [mail] = f.emails;
    assert.equal(mail.subject, '🔔 Νέο lead Almond Suites – lead@example.test');
    assert.ok(mail.text.includes('Τηλέφωνο: —'));
    assert.ok(mail.text.includes('Όνομα: —'));
    assert.equal(mail.html.includes('tel:'), false);
    assert.ok(mail.html.includes('&lt;b&gt;1 bed&lt;/b&gt;'));
    assert.equal(mail.html.includes('<b>1'), false);
    checks++;
  }
  {
    // Only list 4, only list additions; everything else is a quiet 200.
    const f = fixture();
    for (const body of [
      event({ list_id: [3] }),
      event({ list_id: 3 }),
      event({ event: 'unsubscribed' }),
      event({ event: 'contactUpdated', list_id: [4] }),
      event({ email: '' }),
      { hello: 'world' },
      null,
    ]) {
      const result = await f.call(body);
      assert.equal(result.status, 200);
      assert.deepEqual(result.body.outcomes, ['ignored']);
    }
    assert.equal((await f.call('not json', { raw: true })).status, 200);
    assert.equal(f.emails.length, 0);
    assert.equal(f.brevoCalls.length, 0);
    // Both spellings of the event, a numeric list id, and a batch.
    assert.deepEqual((await f.call(event({ event: 'listAddition', list_id: 4 }))).body.outcomes, [
      'sent',
    ]);
    const batch = await f.call([
      event({ email: 'second@example.test', list_id: [1, 4] }),
      event({ email: 'third@example.test', list_id: [1] }),
    ]);
    assert.deepEqual(batch.body.outcomes, ['sent', 'ignored']);
    assert.equal(f.emails.length, 2);
    checks += 3;
  }
  {
    // One alert per email within ten minutes, whatever Brevo resends.
    const f = fixture();
    assert.deepEqual((await f.call(event())).body.outcomes, ['sent']);
    assert.deepEqual((await f.call(event())).body.outcomes, ['duplicate']);
    assert.deepEqual((await f.call(event({ id: 1 }))).body.outcomes, ['duplicate']);
    assert.equal(f.emails.length, 1);
    assert.equal(f.brevoCalls.length, 1);
    assert.deepEqual((await f.call(event({ email: 'other@example.test' }))).body.outcomes, [
      'sent',
    ]);
    checks++;
  }
  {
    // Brevo outage: 200 to Brevo, nothing sent, nothing sensitive logged, and
    // the guard is released so the next delivery of the event gets through.
    const f = fixture({ contactStatus: 503 });
    const result = await f.call(event());
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.outcomes, ['failed']);
    assert.equal(f.emails.length, 0);
    assert.ok(f.logs.length >= 1);
    assert.ok(
      f.logs.every(
        (log) =>
          !log.includes('lead@example.test') &&
          !log.includes('brevo-test-secret') &&
          !log.includes(SECRET),
      ),
    );
    f.state.contactStatus = 0;
    assert.deepEqual((await f.call(event())).body.outcomes, ['sent']);
    checks += 2;
  }
  {
    const f = fixture({ contactStatus: 404 });
    const result = await f.call(event());
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.outcomes, ['missing_contact']);
    assert.equal(f.emails.length, 0);
    checks++;
  }
  {
    // Resend rejection: still 200, logged, guard released.
    const f = fixture({ mail: { notification: 'reject', acknowledgement: 'reject' } });
    const result = await f.call(event());
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.outcomes, ['failed']);
    assert.ok(f.logs.some((log) => log.includes('Lead alert rejected by Resend')));
    checks++;
  }
  {
    // Missing mail settings: 200, logged, no Brevo call.
    const f = fixture({ env: { RESEND_API_KEY: '' } });
    assert.deepEqual((await f.call(event())).body.outcomes, ['not_configured']);
    assert.equal(f.brevoCalls.length, 0);
    const g = fixture({ env: { LEAD_ALERT_TO_EMAIL: '' } });
    await g.call(event());
    assert.equal(g.emails[0].to, 'contact@example.test');
    checks++;
  }
  console.log(`${checks} lead-alert checks passed. Brevo and Resend were isolated.`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
