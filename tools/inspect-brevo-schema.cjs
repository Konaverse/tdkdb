// Read-only schema inspection. Never reads contact/deal records or writes to Brevo.
// Run: node --env-file=.env.local tools/inspect-brevo-schema.cjs
const fs = require('node:fs');
const path = require('node:path');

const key = process.env.BREVO_API_KEY?.trim();
const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
const neededOptions = new Set(['project', 'leadsource', 'interestedunit', 'preferredbedrooms']);

async function read(endpoint) {
  const response = await fetch(`https://api.brevo.com/v3${endpoint}`, {
    headers: { 'api-key': key, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Brevo schema read failed: HTTP ${response.status}.`);
  return response.json();
}

(async () => {
  if (!key) {
    console.error(
      'BREVO_API_KEY is unavailable locally. Add it to ignored .env.local; never paste it into chat.',
    );
    process.exitCode = 1;
    return;
  }
  const pipelineId = process.env.BREVO_PIPELINE_ID?.trim() || '6acd18d26b19db2a45b1cef1';
  const [deals, contacts, pipeline] = await Promise.all([
    read('/crm/attributes/deals'),
    read('/contacts/attributes'),
    read(`/crm/pipeline/details/${encodeURIComponent(pipelineId)}`),
  ]);
  if (!Array.isArray(deals) || !Array.isArray(contacts?.attributes)) {
    throw new Error('Unexpected Brevo schema response.');
  }
  const schema = {
    verifiedAt: new Date().toISOString(),
    deals: deals.map((attribute) => ({
      internalName: attribute.internalName,
      label: attribute.label,
      attributeTypeName: attribute.attributeTypeName,
      isRequired: attribute.isRequired,
      isValueReadonly: attribute.isValueReadonly,
      ...(neededOptions.has(normalize(attribute.label))
        ? { attributeOptions: attribute.attributeOptions }
        : {}),
    })),
    contacts: contacts.attributes.filter((attribute) =>
      ['FIRSTNAME', 'LASTNAME', 'SMS', 'PHONE', 'LANDLINE_NUMBER'].includes(attribute.name),
    ),
    pipeline,
  };
  if (process.argv.includes('--save')) {
    fs.mkdirSync(path.join(process.cwd(), '.tmp'), { recursive: true });
    fs.writeFileSync(
      path.join(process.cwd(), '.tmp/brevo-schema.json'),
      `${JSON.stringify(schema, null, 2)}\n`,
    );
  }
  console.log(JSON.stringify(schema, null, 2));
})().catch((error) => {
  console.error(
    error.message?.startsWith('Brevo schema read failed')
      ? error.message
      : 'Brevo schema inspection failed; credentials and provider response bodies are suppressed.',
  );
  process.exitCode = 1;
});
