import { escapeHtml } from '@/lib/contact/delivery';
import { brevoSettings } from './config';
import type { Enquiry, StoredSubmission } from './types';

export class BrevoError extends Error {
  constructor(
    public operation: string,
    public status: number,
    public code: string,
    public retryAfter = 0,
  ) {
    super(`Brevo ${operation}: ${status} ${code}`);
  }
  get uncertain() {
    return this.status === 0 || this.status >= 500;
  }
  get retryable() {
    return this.uncertain || [401, 403, 408, 425, 429].includes(this.status);
  }
}

export class ReviewRequired extends Error {}

export async function brevoRequest<T>(
  operation: string,
  path: string,
  body: unknown,
  deadline: number,
): Promise<T> {
  const settings = brevoSettings();
  if (!settings) throw new BrevoError(operation, 503, 'configuration_missing');
  const remaining = Math.min(4000, deadline - Date.now());
  if (remaining <= 0) throw new BrevoError(operation, 0, 'budget_exhausted');
  let response: Response;
  try {
    response = await fetch(`https://api.brevo.com/v3${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'api-key': settings.apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(remaining),
      cache: 'no-store',
    });
  } catch {
    throw new BrevoError(operation, 0, 'transport_or_timeout');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // Provider messages can contain contact data. Log only a short machine code.
    const code =
      typeof data?.code === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(data.code)
        ? data.code
        : 'request_rejected';
    const retryAfter = Number(response.headers.get('retry-after')) || 0;
    throw new BrevoError(operation, response.status, code, retryAfter);
  }
  return data as T;
}

export async function upsertContact(enquiry: Enquiry, deadline: number): Promise<number> {
  const [firstName, ...rest] = enquiry.name.split(/\s+/);
  const attributes: Record<string, string> = { FIRSTNAME: firstName };
  if (rest.length) attributes.LASTNAME = rest.join(' ');
  const phone = enquiry.phone.replace(/[\s().-]/g, '').replace(/^00/, '+');
  if (/^\+[1-9]\d{6,14}$/.test(phone)) attributes.SMS = phone;
  const payload = {
    email: enquiry.email.toLowerCase(),
    attributes,
    listIds: [brevoSettings()!.listId],
    updateEnabled: true,
    forceMerge: false,
  };
  let result: { id?: number } | null;
  try {
    result = await brevoRequest('contact_upsert', '/contacts', payload, deadline);
  } catch (error) {
    // A shared phone must never merge distinct email contacts. Preserve the raw
    // phone in the enquiry note and upsert the contact by email alone instead.
    if (
      !(error instanceof BrevoError) ||
      error.status !== 400 ||
      error.code !== 'duplicate_parameter' ||
      !attributes.SMS
    )
      throw error;
    delete attributes.SMS;
    result = await brevoRequest('contact_upsert', '/contacts', payload, deadline);
  }
  if (Number.isSafeInteger(result?.id) && result!.id! > 0) return result!.id!;
  // Updates commonly return 204 without an ID.
  const contact = await brevoRequest<{ id?: number }>(
    'contact_lookup',
    `/contacts/${encodeURIComponent(enquiry.email.toLowerCase())}`,
    undefined,
    deadline,
  );
  if (!Number.isSafeInteger(contact?.id) || contact.id! <= 0)
    throw new BrevoError('contact_lookup', 502, 'missing_contact_id');
  return contact.id!;
}

export function dealName(record: StoredSubmission): string {
  const interest = record.enquiry.projectName || record.enquiry.projectType || 'Website enquiry';
  const label = `${interest} — ${record.enquiry.name}`.slice(0, 120);
  return `${label} [TDK-${record._id.split('.')[1].slice(0, 24)}]`;
}

export async function findDeal(record: StoredSubmission, deadline: number): Promise<string | null> {
  const name = dealName(record);
  const query = new URLSearchParams({ 'filters[attributes.deal_name]': name, limit: '50' });
  const result = await brevoRequest<{
    items?: { id: string; attributes?: { deal_name?: string } }[];
  }>('deal_lookup', `/crm/deals?${query}`, undefined, deadline);
  if (!Array.isArray(result?.items)) throw new BrevoError('deal_lookup', 502, 'invalid_response');
  return result.items.find((deal) => deal.attributes?.deal_name === name)?.id || null;
}

export function enquiryNotes(record: StoredSubmission): { marker: string; text: string }[] {
  const enquiry = record.enquiry;
  const text = [
    `Received: ${record.submittedAt}`,
    `Form: ${enquiry.kind}`,
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Phone: ${enquiry.phone || 'Not provided'}`,
    `Property: ${enquiry.projectName || 'Not specified'}`,
    `Property slug: ${enquiry.projectSlug || 'Not specified'}`,
    `Service interest: ${enquiry.projectType || 'Not specified'}`,
    `Residence preference: ${enquiry.unitPreference || 'Any residence'}`,
    `Message:\n${enquiry.message || 'None'}`,
    `Attribution:\n${JSON.stringify(enquiry.attribution, null, 2)}`,
    'Marketing consent: not collected by this enquiry. Existing subscription preferences are preserved.',
  ].join('\n\n');
  // Split before escaping: even a message full of HTML metacharacters stays
  // below Brevo's 10,000-character note limit, with no loss of the full message.
  const chunks = Array.from(text);
  const count = Math.ceil(chunks.length / 1200);
  return Array.from({ length: count }, (_, index) => {
    const marker = `TDK enquiry ${record._id} part ${index + 1}/${count}`;
    return {
      marker,
      text: `<p><b>${marker}</b></p><p>${escapeHtml(chunks.slice(index * 1200, (index + 1) * 1200).join('')).replace(/\n/g, '<br />')}</p>`,
    };
  });
}

export async function findNote(
  record: StoredSubmission,
  marker: string,
  deadline: number,
): Promise<boolean> {
  for (let offset = 0; offset < 1000; offset += 100) {
    const query = new URLSearchParams({
      entity: 'deals',
      entityIds: record.crm.dealId!,
      limit: '100',
      offset: String(offset),
    });
    const notes = await brevoRequest<{ text?: string }[]>(
      'note_lookup',
      `/crm/notes?${query}`,
      undefined,
      deadline,
    );
    if (!Array.isArray(notes)) throw new BrevoError('note_lookup', 502, 'invalid_response');
    if (notes.some((note) => note.text?.includes(marker))) return true;
    if (notes.length < 100) return false;
  }
  throw new ReviewRequired('note_lookup_limit');
}
