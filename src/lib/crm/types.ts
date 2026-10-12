import type { Attribution } from '@/lib/contact/metadata';

export interface Enquiry {
  kind: 'contact' | 'interest';
  name: string;
  email: string;
  phone: string;
  message: string;
  projectSlug: string;
  projectName: string;
  projectType: string;
  unitPreference: string;
  attribution: Attribution;
}

export interface Submission {
  id: string;
  payloadHash: string;
  enquiry: Enquiry;
  submittedAt: string;
  idempotencyKey?: string;
}

export interface CrmState {
  status: 'pending' | 'processing' | 'retry' | 'review' | 'synced';
  attempts: number;
  nextAttemptAt: string;
  leaseUntil?: string;
  contactId?: number;
  dealId?: string;
  dealAttempted?: boolean;
  notesDone: number;
  noteAttempted?: number | null;
  lastError?: string;
  syncedAt?: string;
}

export interface StoredSubmission {
  _id: string;
  _rev: string;
  _type: 'enquirySubmission';
  payloadHash: string;
  enquiry: Enquiry;
  submittedAt: string;
  emailId: string;
  crm: CrmState;
}
