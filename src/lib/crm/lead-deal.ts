import { brevoSettings } from './config';
import {
  BrevoError,
  createDeal,
  dealAttributeSchema,
  findOpenDeal,
  matchDealAttributes,
  type BrevoDeal,
  type MatchedDealAttributes,
  type WantedDealAttribute,
} from './brevo';

/* ───────────────────────────────────────────────────────────────────────────
   A Brevo deal for a Meta Instant Form lead, created by the lead webhook
   after the alert and by `tools/backfill-meta-deals.cjs` for earlier leads.
   It goes through the website's `createDeal`: same pipeline, same New
   Inquiry stage, same owner, same "<interest> — <name>" naming. The deal's
   extra fields are resolved against the account's own deal attributes, so
   nothing is written to a field the deal model does not have.
   ─────────────────────────────────────────────────────────────────────────── */

export const META_DEAL_SOURCE = 'Meta Lead Ad';
export const META_DEAL_PROJECT = 'Almond Suites';
const DEAL_BUDGET_MS = 15000;
const AGENT_ROLE = 'μεσίτης';
const BUYER_ROLE = 'αγοραστής';

export interface LeadContact {
  id?: number;
  email: string;
  attributes: Record<string, unknown>;
}

/** Attribute values arrive as Meta form option keys: "2_υπνοδωμάτια_με_ιδιωτικό_roof_garden". */
export function humanize(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

export function isAgent(role: unknown): boolean {
  return humanize(role).toLowerCase() === AGENT_ROLE;
}

export function isBuyer(role: unknown): boolean {
  return humanize(role).toLowerCase() === BUYER_ROLE;
}

export function leadName(contact: LeadContact): string {
  const a = contact.attributes;
  return [humanize(a.FIRSTNAME), humanize(a.LASTNAME)].filter(Boolean).join(' ') || contact.email;
}

/** The website names deals "<interest> — <name>" (plus a private enquiry
    marker it needs to find them again). A Meta lead is found again through
    its contact link, so its name carries no marker. */
export function metaDealName(contact: LeadContact): string {
  return `${META_DEAL_PROJECT} — ${leadName(contact)}`.slice(0, 120);
}

/** The fields a Meta lead's deal should carry, by the names the account may
    use for them. Aliases let a select field match the website's spellings
    ("2 bedrooms", "2-Bed", "Agent") as well as the Meta form's Greek keys. */
export function metaDealFields(contact: LeadContact): WantedDealAttribute[] {
  const a = contact.attributes;
  const unit = humanize(a.INTERESTED_UNIT);
  const bedrooms = /^(\d+)/.exec(unit)?.[1] || '';
  const role = humanize(a.LEAD_ROLE);
  return [
    { names: ['Lead Source', 'lead_source', 'Source', 'deal_source'], value: META_DEAL_SOURCE },
    {
      names: ['Interested Unit', 'interested_unit', 'Unit', 'Unit type'],
      value: unit,
      aliases: bedrooms
        ? [`${bedrooms} bedroom`, `${bedrooms} bedrooms`, `${bedrooms}-Bed`, `${bedrooms} Bed`]
        : [],
    },
    {
      names: ['Preferred Bedrooms', 'preferred_bedrooms', 'Bedrooms'],
      value: bedrooms,
      aliases: bedrooms ? [`${bedrooms} bedroom`, `${bedrooms} bedrooms`, `${bedrooms}-Bed`] : [],
    },
    {
      names: ['Purchase Timeline', 'purchase_timeline', 'Timeline'],
      value: humanize(a.PURCHASE_TIMELINE),
    },
    {
      names: ['Lead Role', 'lead_role', 'Role', 'Contact Type', 'contact_type'],
      value: role,
      aliases: isAgent(role) ? ['Agent', 'Μεσίτης'] : isBuyer(role) ? ['Buyer', 'Αγοραστής'] : [],
    },
  ];
}

export interface LeadDealPlan {
  contactId: number;
  name: string;
  attributes: Record<string, string>;
  unmatched: MatchedDealAttributes['unmatched'];
  /** The contact's open deal in the pipeline; when set, nothing is created. */
  existing: BrevoDeal | null;
}

/** Everything the deal would be, plus whether one already exists. Read-only. */
export async function planLeadDeal(
  contact: LeadContact,
  deadline = Date.now() + DEAL_BUDGET_MS,
): Promise<LeadDealPlan> {
  if (!Number.isSafeInteger(contact.id) || contact.id! <= 0)
    throw new BrevoError('deal_plan', 502, 'missing_contact_id');
  const schema = await dealAttributeSchema(deadline);
  const matched = matchDealAttributes(schema, metaDealFields(contact));
  const existing = await findOpenDeal(contact.id!, deadline);
  return {
    contactId: contact.id!,
    name: metaDealName(contact),
    attributes: matched.attributes,
    unmatched: matched.unmatched,
    existing,
  };
}

export type LeadDealOutcome = 'created' | 'exists' | 'not_configured' | 'failed';

/** Creates the lead's deal unless the contact already has an open one in
    the pipeline. Never throws and never blindly repeats a creation whose
    outcome is unknown: a retry finds the existing deal first. */
export async function ensureLeadDeal(contact: LeadContact): Promise<LeadDealOutcome> {
  if (!brevoSettings()) return 'not_configured';
  const deadline = Date.now() + DEAL_BUDGET_MS;
  try {
    const plan = await planLeadDeal(contact, deadline);
    if (plan.existing) return 'exists';
    if (plan.unmatched.length)
      console.warn(
        'Lead deal: fields without a matching deal attribute',
        plan.unmatched.map((field) => `${field.names[0]}:${field.reason}`),
      );
    const id = await createDeal(
      { name: plan.name, contactId: plan.contactId, attributes: plan.attributes },
      deadline,
    );
    if (!id) {
      console.error('Lead deal: Brevo answered without a deal id');
      return 'failed';
    }
    return 'created';
  } catch (error) {
    // Codes only: never the lead's details or any credential.
    console.error(
      'Lead deal failed',
      error instanceof BrevoError
        ? `${error.operation}:${error.status}:${error.code}`
        : error instanceof Error
          ? error.message
          : 'unknown error',
    );
    return 'failed';
  }
}
