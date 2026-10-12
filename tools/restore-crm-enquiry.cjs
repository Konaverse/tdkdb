const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { createClient } = require('@sanity/client');
const { z } = require('zod');

// Recovery for a confirmed Resend notification whose CMS queue write failed.
// Dry run by default. This tool never sends email or calls Brevo.
const inputSchema = z.object({
  id: z.string().regex(/^enquiry\.[a-f0-9]{64}$/),
  emailId: z.string().min(1).max(200),
  submittedAt: z.string().datetime(),
  enquiry: z.object({
    kind: z.enum(['contact', 'interest']),
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    phone: z.string().max(80).default(''),
    message: z.string().max(10000).default(''),
    projectSlug: z.string().max(200).default(''),
    projectName: z.string().max(200).default(''),
    projectType: z.string().max(100).default(''),
    unitPreference: z.string().max(200).default(''),
    attribution: z.record(z.string(), z.unknown()).default({}),
  }),
});

(async () => {
  const filename = process.argv[2];
  if (!filename || filename.startsWith('--'))
    throw new Error('Provide an enquiry JSON file; --apply is optional.');
  if (fs.statSync(filename).size > 100000) throw new Error('Recovery file is too large.');
  const parsed = inputSchema.safeParse(JSON.parse(fs.readFileSync(filename, 'utf8')));
  if (!parsed.success)
    throw new Error(
      'Invalid recovery data. Check the ID, accepted email ID, timestamp and enquiry fields.',
    );
  const data = parsed.data;
  if (!process.argv.includes('--apply')) {
    console.log(
      JSON.stringify({
        dryRun: true,
        id: data.id,
        valid: true,
        createsPrivateQueueRecord: true,
        sendsEmail: false,
        callsBrevo: false,
      }),
    );
    return;
  }
  if (!process.env.SANITY_API_TOKEN?.trim() || !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim())
    throw new Error('Sanity recovery access is not configured.');
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID.trim(),
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production',
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || '2024-01-01',
    token: process.env.SANITY_API_TOKEN.trim(),
    useCdn: false,
  });
  await client.createIfNotExists({
    _id: data.id,
    _type: 'enquirySubmission',
    enquiry: data.enquiry,
    payloadHash: createHash('sha256').update(JSON.stringify(data.enquiry)).digest('hex'),
    submittedAt: data.submittedAt,
    emailId: data.emailId,
    crm: { status: 'pending', attempts: 0, notesDone: 0, nextAttemptAt: new Date().toISOString() },
  });
  console.log(JSON.stringify({ id: data.id, queued: true, sendsEmail: false }));
})().catch((error) => {
  // Local validation errors are safe; CMS errors may include submitted data.
  const safeMessages = [
    'Provide an enquiry JSON file; --apply is optional.',
    'Recovery file is too large.',
    'Invalid recovery data. Check the ID, accepted email ID, timestamp and enquiry fields.',
    'Sanity recovery access is not configured.',
  ];
  console.error(
    safeMessages.includes(error.message)
      ? error.message
      : 'CRM recovery could not complete. Check file access and Sanity connectivity/permissions.',
  );
  process.exitCode = 1;
});
