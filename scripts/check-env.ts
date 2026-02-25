/**
 * Validates that all required environment variables are set.
 * Run at build time or import from instrumentation to catch misconfigurations early.
 *
 * Usage:
 *   npx tsx scripts/check-env.ts
 */

const required: { key: string; secret?: boolean }[] = [
  { key: 'NEXT_PUBLIC_SANITY_PROJECT_ID' },
  { key: 'NEXT_PUBLIC_SANITY_DATASET' },
  { key: 'NEXT_PUBLIC_SANITY_API_VERSION' },
  { key: 'SANITY_API_TOKEN', secret: true },
  { key: 'SANITY_REVALIDATE_SECRET', secret: true },
  { key: 'RESEND_API_KEY', secret: true },
  { key: 'RESEND_FROM_EMAIL' },
  { key: 'CONTACT_FORM_TO_EMAIL' },
  { key: 'INTEREST_FORM_TO_EMAIL' },
  { key: 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME' },
  { key: 'NEXT_PUBLIC_CLOUDINARY_BASE_PATH' },
  { key: 'NEXT_PUBLIC_SITE_URL' },
  { key: 'NEXT_PUBLIC_CLARITY_PROJECT_ID' },
];

const missing = required.filter(({ key }) => !process.env[key]);

if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:\n');
  for (const { key, secret } of missing) {
    const hint = secret ? '  (server-only secret — do NOT prefix with NEXT_PUBLIC_)' : '';
    console.error(`   • ${key}${hint}`);
  }
  console.error('\n   Copy .env.example → .env.local and fill in the values.\n');
  process.exit(1);
}

console.log('✅ All required environment variables are set.');
