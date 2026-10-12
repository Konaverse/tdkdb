import { Resend } from 'resend';
import type { CreateEmailOptions } from 'resend';

export function mailSettings(kind: 'contact' | 'interest') {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const contactTo = process.env.CONTACT_FORM_TO_EMAIL?.trim();
  const interestTo = process.env.INTEREST_FORM_TO_EMAIL?.trim();
  const to = (kind === 'interest' ? interestTo : contactTo) || contactTo || interestTo;
  return apiKey && from && to ? { apiKey, from, to } : null;
}

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
}

/** Success means the studio's notification was accepted by the mail provider.
 * A failed acknowledgement must not invite a duplicate enquiry from the visitor.
 */
export async function sendEnquiry(
  apiKey: string,
  notification: CreateEmailOptions,
  acknowledgement: CreateEmailOptions,
  idempotencyKey?: string,
) {
  const resend = new Resend(apiKey);
  const result = await resend.emails.send(
    notification,
    idempotencyKey ? { idempotencyKey: `${idempotencyKey}/notification` } : undefined,
  );
  if (result.error) {
    console.error('Resend notification rejected:', {
      name: result.error.name,
      statusCode: result.error.statusCode,
      message: result.error.message,
    });
    throw new Error(result.error.message);
  }
  if (!result.data?.id) throw new Error('The mail provider did not accept the enquiry.');

  try {
    const reply = await resend.emails.send(
      acknowledgement,
      idempotencyKey ? { idempotencyKey: `${idempotencyKey}/acknowledgement` } : undefined,
    );
    if (reply.error) console.error('Enquiry acknowledgement failed:', reply.error.message);
  } catch (error) {
    console.error(
      'Enquiry acknowledgement failed:',
      error instanceof Error ? error.message : 'Unknown mail error',
    );
  }
  return result.data.id;
}
