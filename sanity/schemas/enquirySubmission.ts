import { defineField, defineType } from 'sanity';
import { CAMPAIGN_FIELDS } from '../../src/lib/contact/campaign-fields';

const touchFields = [
  defineField({ name: 'landingPage', type: 'url', title: 'Landing page' }),
  defineField({ name: 'referrer', type: 'string', title: 'Referrer' }),
  defineField({ name: 'capturedAt', type: 'datetime', title: 'Captured at' }),
  ...CAMPAIGN_FIELDS.map((name) => defineField({ name, type: 'string', title: name })),
];

export const attributionField = defineField({
  name: 'attribution',
  type: 'object',
  title: 'Marketing attribution',
  readOnly: true,
  fields: [
    defineField({ name: 'sourceUrl', type: 'url', title: 'Submission page' }),
    defineField({ name: 'firstTouch', type: 'object', title: 'First touch', fields: touchFields }),
    defineField({
      name: 'lastTouch',
      type: 'object',
      title: 'Last campaign touch',
      fields: touchFields,
    }),
  ],
});

export default defineType({
  name: 'enquirySubmission',
  title: 'CRM delivery',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({ name: 'submittedAt', title: 'Received at', type: 'datetime' }),
    defineField({ name: 'emailId', title: 'Accepted Resend notification', type: 'string' }),
    defineField({ name: 'payloadHash', type: 'string', hidden: true }),
    defineField({
      name: 'enquiry',
      type: 'object',
      title: 'Enquiry',
      fields: [
        ...[
          'kind',
          'name',
          'email',
          'phone',
          'projectSlug',
          'projectName',
          'projectType',
          'unitPreference',
        ].map((name) => defineField({ name, type: 'string', title: name })),
        defineField({ name: 'message', type: 'text', title: 'Message' }),
        attributionField,
      ],
    }),
    defineField({
      name: 'crm',
      title: 'Brevo delivery',
      type: 'object',
      fields: [
        defineField({ name: 'status', type: 'string', title: 'Status' }),
        defineField({ name: 'attempts', type: 'number', title: 'Attempts' }),
        defineField({ name: 'nextAttemptAt', type: 'datetime', title: 'Next retry' }),
        defineField({ name: 'leaseUntil', type: 'string', title: 'Worker lease' }),
        defineField({ name: 'contactId', type: 'number', title: 'Contact ID' }),
        defineField({ name: 'dealId', type: 'string', title: 'Deal ID' }),
        defineField({ name: 'dealAttempted', type: 'boolean', title: 'Deal creation attempted' }),
        defineField({ name: 'notesDone', type: 'number', title: 'Notes completed' }),
        defineField({ name: 'noteAttempted', type: 'number', title: 'Note creation attempted' }),
        defineField({ name: 'lastError', type: 'string', title: 'Last error code' }),
        defineField({ name: 'syncedAt', type: 'datetime', title: 'Synced at' }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Newest enquiries',
      name: 'newest',
      by: [{ field: 'submittedAt', direction: 'desc' }],
    },
  ],
  preview: { select: { title: 'enquiry.name', subtitle: 'crm.status' } },
});
