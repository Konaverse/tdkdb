// One-off backfill: a Brevo deal for every Meta lead (list 4) that has none.
//
//   node --env-file=.env.local tools/backfill-meta-deals.cjs          # dry run: prints the plan
//   node --env-file=.env.local tools/backfill-meta-deals.cjs --apply  # creates the planned deals
//
// Runs the webhook's own code (src/lib/crm/lead-deal.ts) against the live
// Brevo account: same pipeline, stage, naming, attribute matching and
// duplicate rule as /api/webhooks/brevo-lead. Reads everything first and
// writes nothing without --apply. Contacts in SKIP_EMAILS and contacts that
// already have an open deal in the pipeline are never touched.
const path = require('node:path');
const { isolate } = require('./check-form-delivery.cjs');

const SKIP_EMAILS = new Set(['konstantinoskyprianou10@gmail.com']);
const PAGE = 500;
const PAUSE_MS = 300;
const apply = process.argv.includes('--apply');

const budget = () => Date.now() + 60000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pad = (value, width) =>
  String(value ?? '')
    .padEnd(width)
    .slice(0, width);

async function main() {
  if (!process.env.BREVO_API_KEY?.trim()) {
    console.error(
      'BREVO_API_KEY is not set. Add it to the ignored .env.local (never paste it into chat) and run with --env-file=.env.local.',
    );
    process.exitCode = 1;
    return;
  }
  // The project's own modules with the real environment and the real network.
  const box = isolate({ env: process.env, fetch: globalThis.fetch });
  const load = (file) => box.load(path.resolve(file));
  const brevo = load('src/lib/crm/brevo.ts');
  const config = load('src/lib/crm/config.ts');
  const leadDeal = load('src/lib/crm/lead-deal.ts');
  const settings = config.brevoSettings();
  const listId = Number(process.env.BREVO_META_LEADS_LIST_ID?.trim() || 4);

  console.log(`Mode: ${apply ? 'APPLY (deals will be created)' : 'dry run (nothing is written)'}`);
  console.log(
    `List ${listId} → pipeline ${settings.pipelineId}, stage ${settings.stageId}, owner ${settings.owner ? 'set' : 'not set'}`,
  );

  const schema = await brevo.dealAttributeSchema(budget());
  const writable = schema.filter((attribute) => !attribute.isValueReadonly);
  console.log(`\nDeal model (${writable.length} writable fields):`);
  for (const attribute of writable) {
    const options = Array.isArray(attribute.attributeOptions)
      ? attribute.attributeOptions.map((option) => option.value).join(' | ')
      : '';
    console.log(
      `  ${pad(attribute.internalName, 28)} ${pad(attribute.label, 24)} ${pad(attribute.attributeTypeName, 14)} ${options}`,
    );
  }
  const closed = await brevo.closedStageIds(settings.pipelineId, budget());
  console.log(`Closed stages in the pipeline: ${closed.size ? [...closed].join(', ') : 'none'}`);

  const contacts = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await brevo.brevoRequest(
      'contact_list',
      `/contacts/lists/${listId}/contacts?limit=${PAGE}&offset=${offset}&sort=asc`,
      undefined,
      budget(),
    );
    const items = Array.isArray(page?.contacts) ? page.contacts : [];
    contacts.push(...items);
    if (items.length < PAGE) break;
  }
  console.log(`\n${contacts.length} contacts in list ${listId}.`);

  const rows = [];
  for (const contact of contacts) {
    const email = String(contact.email || '').toLowerCase();
    const lead = { id: contact.id, email, attributes: contact.attributes || {} };
    const row = { email, name: leadDeal.leadName(lead), contactId: contact.id };
    if (SKIP_EMAILS.has(email)) {
      rows.push({ ...row, action: 'skip', why: 'excluded by SKIP_EMAILS' });
      continue;
    }
    try {
      const plan = await leadDeal.planLeadDeal(lead, budget());
      if (plan.existing) {
        const stage = String(plan.existing.attributes?.deal_stage ?? '');
        rows.push({
          ...row,
          action: 'skip',
          why: `has open deal ${plan.existing.id}${stage ? ` (stage ${stage})` : ''}`,
        });
      } else rows.push({ ...row, action: 'create', plan });
    } catch (error) {
      rows.push({ ...row, action: 'error', why: error?.message || 'unknown error' });
    }
  }

  console.log('\nPlan:');
  for (const row of rows) {
    const head = `  ${pad(row.action.toUpperCase(), 7)} ${pad(row.email, 36)} ${pad(row.name, 30)}`;
    if (row.action !== 'create') {
      console.log(`${head} ${row.why}`);
      continue;
    }
    console.log(`${head} → "${row.plan.name}"`);
    console.log(`          fields: ${JSON.stringify(row.plan.attributes)}`);
    if (row.plan.unmatched.length)
      console.log(
        `          not in deal model: ${row.plan.unmatched
          .map((field) => `${field.names[0]} (${field.reason}: ${field.value})`)
          .join('; ')}`,
      );
  }
  const counts = rows.reduce(
    (acc, row) => ({ ...acc, [row.action]: (acc[row.action] || 0) + 1 }),
    {},
  );
  console.log(`\nSummary: ${JSON.stringify(counts)}`);

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to create the deals marked CREATE.');
  } else {
    let created = 0;
    let failed = 0;
    for (const row of rows) {
      if (row.action !== 'create') continue;
      try {
        const id = await brevo.createDeal(
          { name: row.plan.name, contactId: row.plan.contactId, attributes: row.plan.attributes },
          budget(),
        );
        if (id) {
          created++;
          console.log(`  created ${id} for ${row.email}`);
        } else {
          failed++;
          console.log(
            `  UNKNOWN outcome for ${row.email}: Brevo answered without an id. Check Brevo before re-running.`,
          );
        }
      } catch (error) {
        failed++;
        console.log(`  FAILED for ${row.email}: ${error?.message || 'unknown error'}`);
      }
      await sleep(PAUSE_MS);
    }
    console.log(`\nCreated ${created} deal(s); ${failed} failure(s).`);
    if (failed) process.exitCode = 1;
  }
  if (rows.some((row) => row.action === 'error')) process.exitCode = 1;
  if (box.logs.length) {
    console.log('\nModule logs:');
    for (const log of box.logs) console.log(`  ${log}`);
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exitCode = 1;
});
