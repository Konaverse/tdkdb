export const BREVO_DEFAULTS = {
  listId: 3,
  pipelineId: '6acd18d26b19db2a45b1cef1',
  stageId: '0e5173b4643c420bbacdd97cc7d22450',
};

export function crmEnabled(): boolean {
  return process.env.BREVO_ENABLED?.trim() === 'true';
}

export function brevoSettings() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const listId = Number(process.env.BREVO_LIST_ID?.trim() || BREVO_DEFAULTS.listId);
  const pipelineId = process.env.BREVO_PIPELINE_ID?.trim() || BREVO_DEFAULTS.pipelineId;
  const stageId = process.env.BREVO_NEW_INQUIRY_STAGE_ID?.trim() || BREVO_DEFAULTS.stageId;
  const owner = process.env.BREVO_DEAL_OWNER?.trim();
  if (!apiKey || !Number.isSafeInteger(listId) || listId < 1 || !pipelineId || !stageId)
    return null;
  return { apiKey, listId, pipelineId, stageId, owner };
}
