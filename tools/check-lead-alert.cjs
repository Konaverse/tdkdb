const assert = require('node:assert/strict');
const path = require('node:path');
const { NextRequest } = require('next/server');
const { isolate } = require('./check-form-delivery.cjs');

// Exercise the real Brevo lead-alert webhook with an isolated Brevo and mail
// provider. Nothing leaves the process; no secret or lead detail is logged.

const ROUTE = path.resolve('src/app/api/webhooks/brevo-lead/route.ts');
const SECRET = 'hook-test-secret';
const PIPELINE = '6acd18d26b19db2a45b1cef1';
const STAGE = '0e5173b4643c420bbacdd97cc7d22450';
const LEAD = {
  id: 77,
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
// The account's deal model as the isolated Brevo reports it: a select for
// the source, text for unit and timeline, a Buyer/Agent select, and no
// field at all for bedrooms.
const DEAL_SCHEMA = [
  { internalName: 'deal_name', label: 'Deal name', attributeTypeName: 'text' },
  {
    internalName: 'deal_stage',
    label: 'Stage',
    attributeTypeName: 'single-select',
    attributeOptions: [
      { key: STAGE, value: 'New Inquiry' },
      { key: 'stage-won', value: 'Won' },
    ],
  },
  { internalName: 'pipeline', label: 'Pipeline', attributeTypeName: 'single-select' },
  {
    internalName: 'created_at',
    label: 'Created',
    attributeTypeName: 'date',
    isValueReadonly: true,
  },
  {
    internalName: 'lead_source',
    label: 'Lead Source',
    attributeTypeName: 'single-select',
    attributeOptions: [
      { key: 'src-web', value: 'Website' },
      { key: 'src-meta', value: 'Meta Lead Ad' },
    ],
  },
  { internalName: 'interested_unit', label: 'Interested Unit', attributeTypeName: 'text' },
  { internalName: 'purchase_timeline', label: 'Purchase Timeline', attributeTypeName: 'text' },
  {
    internalName: 'contact_type',
    label: 'Contact Type',
    attributeTypeName: 'single-select',
    attributeOptions: [
      { key: 'ct-buyer', value: 'Buyer' },
      { key: 'ct-agent', value: 'Agent' },
    ],
  },
];
const PIPELINE_DETAILS = {
  pipeline: PIPELINE,
  pipeline_name: 'Almond Pipeline',
  stages: [
    { id: STAGE, name: 'New Inquiry' },
    { id: 'stage-visit', name: 'Site visit' },
    { id: 'stage-won', name: 'Won' },
    { id: 'stage-lost', name: 'Lost' },
  ],
};

const response = (body, status = 200) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function fixture(options = {}) {
  const brevoCalls = [];
  const calls = [];
  const deals = (options.deals || []).map((deal) => ({ ...deal }));
  const contactIds = new Map();
  const state = {
    contactStatus: options.contactStatus || 0,
    contact: options.contact || LEAD,
    dealStatus: options.dealStatus || 0,
    dealListStatus: options.dealListStatus || 0,
    schemaStatus: options.schemaStatus || 0,
    pipelineStatus: options.pipelineStatus || 0,
  };
  let box;
  const fetch = async (url, request) => {
    const target = new URL(url);
    assert.equal(target.origin, 'https://api.brevo.com');
    assert.equal(request.headers['api-key'], 'brevo-test-secret');
    const body = request.body ? JSON.parse(request.body) : undefined;
    brevoCalls.push(target.pathname);
    calls.push({
      method: request.method,
      path: target.pathname,
      query: target.searchParams,
      body,
      emailsSent: box.emails.length,
    });
    const leaked = { code: 'provider_error', message: 'lead@example.test brevo-test-secret' };
    if (target.pathname.startsWith('/v3/contacts/')) {
      assert.equal(request.method, 'GET');
      if (state.contactStatus === 404) return response({ code: 'document_not_found' }, 404);
      if (state.contactStatus) return response(leaked, state.contactStatus);
      // Another address is another contact: same attributes, its own id.
      const email = decodeURIComponent(target.pathname.slice('/v3/contacts/'.length));
      if (email === state.contact.email || state.contact.id === undefined)
        return response(state.contact);
      if (!contactIds.has(email)) contactIds.set(email, 100 + contactIds.size);
      return response({ ...state.contact, id: contactIds.get(email), email });
    }
    if (target.pathname === '/v3/crm/attributes/deals') {
      assert.equal(request.method, 'GET');
      if (state.schemaStatus) return response(leaked, state.schemaStatus);
      return response(options.schema || DEAL_SCHEMA);
    }
    if (target.pathname.startsWith('/v3/crm/pipeline/details/')) {
      assert.equal(request.method, 'GET');
      assert.equal(target.pathname, `/v3/crm/pipeline/details/${PIPELINE}`);
      if (state.pipelineStatus) return response(leaked, state.pipelineStatus);
      return response(PIPELINE_DETAILS);
    }
    if (target.pathname === '/v3/crm/deals' && request.method === 'GET') {
      if (state.dealListStatus) return response(leaked, state.dealListStatus);
      const contactId = Number(target.searchParams.get('filters[linkedContactsIds]'));
      assert.ok(contactId > 0);
      return response({
        items: deals.filter((deal) => deal.linkedContactsIds.includes(contactId)),
      });
    }
    if (target.pathname === '/v3/crm/deals' && request.method === 'POST') {
      if (state.dealStatus) return response(leaked, state.dealStatus);
      const deal = {
        id: `deal-${deals.length + 1}`,
        attributes: { ...body.attributes, deal_name: body.name },
        linkedContactsIds: body.linkedContactsIds,
      };
      deals.push(deal);
      return response({ id: deal.id }, 201);
    }
    throw new Error(`Unexpected external call: ${request.method} ${target.pathname}`);
  };
  box = isolate({
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
  const created = () => calls.filter((c) => c.method === 'POST' && c.path === '/v3/crm/deals');
  const lookups = () => brevoCalls.filter((p) => p.startsWith('/v3/contacts/'));
  return { ...box, brevoCalls, calls, deals, state, call, created, lookups };
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

const noLeak = (logs) =>
  logs.every(
    (log) =>
      !log.includes('lead@example.test') &&
      !log.includes('brevo-test-secret') &&
      !log.includes(SECRET) &&
      !log.includes('Μαρία'),
  );

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
    assert.deepEqual(result.body.deals, ['created']);
    assert.deepEqual(f.brevoCalls, [
      '/v3/contacts/lead%40example.test',
      '/v3/crm/attributes/deals',
      '/v3/crm/deals',
      '/v3/crm/deals',
    ]);
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
    // The deal: created AFTER the alert went out, through the website's
    // pipeline/stage, named like a website deal, linked to the contact, with
    // the source and the lead's answers in the deal fields the account has.
    const f = fixture();
    const result = await f.call(event());
    assert.deepEqual(result.body.deals, ['created']);
    const [post] = f.created();
    assert.equal(f.created().length, 1);
    assert.equal(post.emailsSent, 1);
    assert.equal(post.body.name, 'Almond Suites — Μαρία Παπαδοπούλου');
    assert.deepEqual(post.body.linkedContactsIds, [77]);
    assert.deepEqual(post.body.attributes, {
      lead_source: 'src-meta',
      interested_unit: '2 υπνοδωμάτια με ιδιωτικό roof garden',
      purchase_timeline: '3 6 μήνες',
      contact_type: 'ct-buyer',
      pipeline: PIPELINE,
      deal_stage: STAGE,
    });
    assert.equal('deal_owner' in post.body.attributes, false);
    // The lookup that guards against duplicates is by contact link.
    const lookup = f.calls.find((c) => c.method === 'GET' && c.path === '/v3/crm/deals');
    assert.equal(lookup.query.get('filters[linkedContactsIds]'), '77');
    // Bedrooms has no deal field: reported by name only, never written.
    const warning = f.logs.find((log) => log.includes('without a matching deal attribute'));
    assert.ok(warning);
    assert.ok(warning.includes('Preferred Bedrooms:no_field'));
    assert.ok(noLeak(f.logs));
    checks += 3;
  }
  {
    // Deal owner, agent role, a nameless lead, an unlisted select value.
    const f = fixture({
      env: { BREVO_DEAL_OWNER: 'owner@example.test' },
      contact: { id: 78, email: 'lead@example.test', attributes: { LEAD_ROLE: 'Μεσίτης' } },
    });
    await f.call(event());
    const [post] = f.created();
    assert.equal(post.body.name, 'Almond Suites — lead@example.test');
    assert.deepEqual(post.body.linkedContactsIds, [78]);
    assert.deepEqual(post.body.attributes, {
      lead_source: 'src-meta',
      contact_type: 'ct-agent',
      pipeline: PIPELINE,
      deal_stage: STAGE,
      deal_owner: 'owner@example.test',
    });
    const g = fixture({
      contact: { ...LEAD, attributes: { ...LEAD.attributes, LEAD_ROLE: 'άλλο' } },
    });
    await g.call(event());
    assert.equal('contact_type' in g.created()[0].body.attributes, false);
    assert.ok(g.logs.some((log) => log.includes('Lead Role:no_option')));
    checks += 2;
  }
  {
    // A deal model without the custom fields still gets a plain deal.
    const f = fixture({ schema: DEAL_SCHEMA.slice(0, 4) });
    const result = await f.call(event());
    assert.deepEqual(result.body.deals, ['created']);
    assert.deepEqual(f.created()[0].body.attributes, { pipeline: PIPELINE, deal_stage: STAGE });
    checks++;
  }
  {
    // Duplicate skipped: an open deal in the pipeline already linked to the
    // contact means no second deal, while the alert still goes out.
    const open = {
      id: 'deal-open',
      attributes: {
        pipeline: PIPELINE,
        deal_stage: 'stage-visit',
        deal_name: 'Almond Suites — Μαρία',
      },
      linkedContactsIds: [77],
    };
    const f = fixture({ deals: [open] });
    const result = await f.call(event());
    assert.deepEqual(result.body.outcomes, ['sent']);
    assert.deepEqual(result.body.deals, ['exists']);
    assert.equal(f.created().length, 0);
    assert.equal(f.emails.length, 1);
    assert.deepEqual(f.brevoCalls, [
      '/v3/contacts/lead%40example.test',
      '/v3/crm/attributes/deals',
      '/v3/crm/deals',
      `/v3/crm/pipeline/details/${PIPELINE}`,
    ]);
    // A won or lost deal, a deal in another pipeline, or another contact's
    // deal does not block a new one.
    for (const deal of [
      { ...open, attributes: { ...open.attributes, deal_stage: 'stage-won' } },
      { ...open, attributes: { ...open.attributes, deal_stage: 'stage-lost' } },
      { ...open, attributes: { ...open.attributes, pipeline: 'other-pipeline' } },
      { ...open, linkedContactsIds: [5] },
    ]) {
      const g = fixture({ deals: [deal] });
      assert.deepEqual((await g.call(event())).body.deals, ['created']);
      assert.equal(g.created().length, 1);
    }
    // Two deals: one won, one open → exists.
    const h = fixture({
      deals: [
        { ...open, id: 'deal-won', attributes: { ...open.attributes, deal_stage: 'stage-won' } },
        open,
      ],
    });
    assert.deepEqual((await h.call(event())).body.deals, ['exists']);
    // If the pipeline cannot be read, every deal in it counts as open.
    const i = fixture({
      deals: [{ ...open, attributes: { ...open.attributes, deal_stage: 'stage-won' } }],
      pipelineStatus: 500,
    });
    assert.deepEqual((await i.call(event())).body.deals, ['exists']);
    assert.equal(i.created().length, 0);
    checks += 4;
  }
  {
    // Deal failures never touch the alert: still 200, still one email, the
    // failure logged without lead details, and never a blind creation.
    for (const [options, expectPost] of [
      [{ dealStatus: 500 }, 1],
      [{ dealStatus: 400 }, 1],
      [{ schemaStatus: 503 }, 0],
      [{ dealListStatus: 503 }, 0],
      [{ contact: { ...LEAD, id: undefined } }, 0],
    ]) {
      const f = fixture(options);
      const result = await f.call(event());
      assert.equal(result.status, 200);
      assert.deepEqual(result.body.outcomes, ['sent']);
      assert.deepEqual(result.body.deals, ['failed']);
      assert.equal(f.emails.length, 1);
      assert.equal(f.created().length, expectPost);
      assert.ok(f.logs.some((log) => log.includes('Lead deal failed')));
      assert.ok(noLeak(f.logs));
      // The duplicate guard still holds for the alert.
      assert.deepEqual((await f.call(event())).body, {
        received: true,
        outcomes: ['duplicate'],
        deals: ['skipped'],
      });
      assert.equal(f.emails.length, 1);
    }
    // Brevo recovering: the next event creates the deal and finds no
    // duplicate from the failed attempt.
    const f = fixture({ dealStatus: 500 });
    await f.call(event());
    f.state.dealStatus = 0;
    assert.deepEqual((await f.call(event({ email: 'again@example.test' }))).body.deals, [
      'created',
    ]);
    checks += 3;
  }
  {
    // A rejected alert still gets its deal; a missing contact gets neither.
    const f = fixture({ mail: { notification: 'reject', acknowledgement: 'reject' } });
    const result = await f.call(event());
    assert.deepEqual(result.body.outcomes, ['failed']);
    assert.deepEqual(result.body.deals, ['created']);
    assert.equal(f.created().length, 1);
    const g = fixture({ contactStatus: 404 });
    assert.deepEqual((await g.call(event())).body, {
      received: true,
      outcomes: ['missing_contact'],
      deals: ['skipped'],
    });
    assert.equal(g.created().length, 0);
    checks += 2;
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
      contact: {
        id: 77,
        email: 'lead@example.test',
        attributes: { INTERESTED_UNIT: '<b>1_bed</b>' },
      },
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
      assert.deepEqual(result.body.deals, ['skipped']);
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
    assert.deepEqual(batch.body.deals, ['created', 'skipped']);
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
    assert.equal(f.lookups().length, 1);
    assert.equal(f.created().length, 1);
    assert.deepEqual((await f.call(event({ email: 'other@example.test' }))).body.outcomes, [
      'sent',
    ]);
    checks++;
  }
  {
    // Brevo's event id is NOT unique per event: two leads arriving with the
    // same id must both send, with different Resend idempotency keys.
    const f = fixture();
    const first = await f.call(event({ id: 987654, email: 'first@example.test', ts: 1792000000 }));
    const second = await f.call(
      event({ id: 987654, email: 'second@example.test', ts: 1792000000 }),
    );
    assert.deepEqual(first.body.outcomes, ['sent']);
    assert.deepEqual(second.body.outcomes, ['sent']);
    assert.equal(f.emails.length, 2);
    assert.deepEqual(f.lookups(), [
      '/v3/contacts/first%40example.test',
      '/v3/contacts/second%40example.test',
    ]);
    const [a, b] = f.mailOptions.map((options) => options.idempotencyKey);
    assert.match(a, /^brevo-lead\/[a-f0-9]{40}$/);
    assert.match(b, /^brevo-lead\/[a-f0-9]{40}$/);
    assert.notEqual(a, b);
    checks += 2;
  }
  {
    // The key is the lead + list + event time: a Brevo retry of one event on
    // another instance repeats it; a later addition of the same lead, or no
    // timestamp at all, does not.
    const keyFor = async (body) => {
      const f = fixture();
      await f.call(body);
      return f.mailOptions[0].idempotencyKey;
    };
    const retried = await keyFor(event({ id: 1 }));
    assert.equal(retried, await keyFor(event({ id: 2 })));
    assert.notEqual(retried, await keyFor(event({ ts: 1792000600 })));
    assert.notEqual(retried, await keyFor(event({ list_id: [4], email: 'x@example.test' })));
    // Without `ts`, the date text identifies the event; without either, the
    // current minute does, and the alert still carries a key.
    const dated = await keyFor(event({ ts: undefined, date_time: '2026-10-14 12:00:00' }));
    assert.equal(dated, await keyFor(event({ ts: undefined, date: '2026-10-14 12:00:00' })));
    assert.notEqual(dated, retried);
    const bare = await keyFor(event({ ts: undefined, date: undefined }));
    assert.match(bare, /^brevo-lead\/[a-f0-9]{40}$/);
    assert.notEqual(
      bare,
      await keyFor(event({ ts: undefined, date: undefined, email: 'y@example.test' })),
    );
    checks += 2;
  }
  {
    // Resend 409 invalid_idempotent_request: resend once without a key rather
    // than drop the alert; the in-memory guard still holds afterwards.
    const f = fixture({ mail: { idempotencyConflict: true } });
    const result = await f.call(event());
    assert.deepEqual(result.body.outcomes, ['sent']);
    assert.equal(f.emails.length, 2);
    assert.equal(f.emails[0].subject, f.emails[1].subject);
    assert.match(f.mailOptions[0].idempotencyKey, /^brevo-lead\//);
    assert.equal(f.mailOptions[1].idempotencyKey, undefined);
    assert.ok(f.logs.some((log) => log.includes('invalid_idempotent_request')));
    assert.ok(noLeak(f.logs));
    assert.deepEqual((await f.call(event())).body.outcomes, ['duplicate']);
    assert.equal(f.emails.length, 2);
    // If the keyless retry is refused too, the alert fails and the guard opens.
    const g = fixture({ mail: { idempotencyConflict: true, acknowledgement: 'reject' } });
    assert.deepEqual((await g.call(event())).body.outcomes, ['failed']);
    assert.equal(g.emails.length, 2);
    assert.deepEqual((await g.call(event())).body.outcomes, ['failed']);
    assert.equal(g.emails.length, 4);
    checks += 2;
  }
  {
    // Brevo outage: 200 to Brevo, nothing sent, no deal step, nothing
    // sensitive logged, and the guard is released so the next delivery of
    // the event gets through.
    const f = fixture({ contactStatus: 503 });
    const result = await f.call(event());
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.outcomes, ['failed']);
    assert.deepEqual(result.body.deals, ['skipped']);
    assert.equal(f.emails.length, 0);
    assert.equal(f.brevoCalls.length, 1);
    assert.ok(f.logs.length >= 1);
    assert.ok(noLeak(f.logs));
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
    // Missing mail settings: 200, logged, and the deal is still created.
    const f = fixture({ env: { RESEND_API_KEY: '' } });
    assert.deepEqual((await f.call(event())).body, {
      received: true,
      outcomes: ['not_configured'],
      deals: ['created'],
    });
    assert.equal(f.emails.length, 0);
    const g = fixture({ env: { LEAD_ALERT_TO_EMAIL: '' } });
    await g.call(event());
    assert.equal(g.emails[0].to, 'contact@example.test');
    // No Brevo key: nothing can be read, so nothing happens but a log.
    const h = fixture({ env: { BREVO_API_KEY: '' } });
    assert.deepEqual((await h.call(event())).body, {
      received: true,
      outcomes: ['failed'],
      deals: ['skipped'],
    });
    assert.equal(h.brevoCalls.length, 0);
    checks++;
  }
  console.log(`${checks} lead-alert checks passed. Brevo and Resend were isolated.`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
