// Read-only account/configuration check. Never creates contacts, deals or notes.
const enabled = process.env.BREVO_ENABLED?.trim() === 'true';
const key = process.env.BREVO_API_KEY?.trim();
const listId = Number(process.env.BREVO_LIST_ID?.trim() || 3);
const pipelineId = process.env.BREVO_PIPELINE_ID?.trim() || '6acd18d26b19db2a45b1cef1';
const stageId =
  process.env.BREVO_NEW_INQUIRY_STAGE_ID?.trim() || '0e5173b4643c420bbacdd97cc7d22450';

async function get(path) {
  const response = await fetch(`https://api.brevo.com/v3${path}`, {
    headers: { 'api-key': key, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Brevo configuration read failed (HTTP ${response.status}).`);
  return response.json();
}

(async () => {
  if (!key) {
    console.log(
      JSON.stringify({
        enabled,
        apiKeyConfigured: false,
        listId,
        pipelineId,
        stageId,
        ready: false,
      }),
    );
    process.exitCode = 1;
    return;
  }
  if (!Number.isSafeInteger(listId) || listId < 1) throw new Error('Invalid BREVO_LIST_ID.');
  const [list, pipelines, attributes] = await Promise.all([
    get(`/contacts/lists/${listId}`),
    get(`/crm/pipeline/details/${encodeURIComponent(pipelineId)}`),
    get('/contacts/attributes'),
  ]);
  const pipeline = Array.isArray(pipelines)
    ? pipelines.find((item) => (item.pipeline || item.id) === pipelineId)
    : pipelines;
  const listExists = Number(list.id) === listId;
  const stages = pipeline?.stages || [];
  const stageExists = stages.some((stage) => (stage.id || stage.stageId) === stageId);
  const available = new Set((attributes.attributes || []).map((attribute) => attribute.name));
  const namesPresent = ['FIRSTNAME', 'LASTNAME'].every((name) => available.has(name));
  const ready =
    enabled &&
    listExists &&
    !!pipeline &&
    stageExists &&
    namesPresent &&
    !!process.env.SANITY_API_TOKEN?.trim() &&
    !!process.env.CRON_SECRET?.trim();
  console.log(
    JSON.stringify(
      {
        enabled,
        apiKeyConfigured: true,
        listExists,
        pipelineExists: !!pipeline,
        newInquiryStageExists: stageExists,
        standardNameAttributesPresent: namesPresent,
        smsAttributePresent: available.has('SMS'),
        explicitOwnerConfigured: !!process.env.BREVO_DEAL_OWNER?.trim(),
        queueTokenConfigured: !!process.env.SANITY_API_TOKEN?.trim(),
        retrySecretConfigured: !!process.env.CRON_SECRET?.trim(),
        ready,
      },
      null,
      2,
    ),
  );
  if (!ready) process.exitCode = 1;
})().catch((error) => {
  // Avoid printing remote response bodies, keys, account names or contact data.
  console.error(
    error.message?.startsWith('Brevo configuration read failed') ||
      error.message === 'Invalid BREVO_LIST_ID.'
      ? error.message
      : 'Brevo configuration check could not reach the provider.',
  );
  process.exitCode = 1;
});
