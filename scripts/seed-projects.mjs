/**
 * Seed projects into Sanity from a folder of renders.
 *
 *   node scripts/seed-projects.mjs --dry   # report, change nothing
 *   node scripts/seed-projects.mjs         # upload and write
 *
 * Each render is downscaled to 2600px and re-encoded before upload — the
 * originals run to 12 MB PNGs, and Sanity serves its own derivatives anyway.
 * Uploads are deduplicated by file, and documents use a deterministic _id
 * (`project-<slug>`, no dot — a dot makes a document private), so re-running
 * updates in place rather than creating copies.
 *
 * COPY IS PLACEHOLDER. The facts (title, year, status, scope) are real; the
 * description, pull quote and features are written to be replaced.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createClient } from '@sanity/client';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const DRY = process.argv.includes('--dry');
const ROOT = 'C:/Users/konst/OneDrive/Υπολογιστής/Business/MyClients/TDK/Projects';
const MAX_WIDTH = 2600;

const env = Object.fromEntries(
  fs
    .readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [
      l.slice(0, l.indexOf('=')),
      l.slice(l.indexOf('=') + 1).replace(/^["']|["']$/g, ''),
    ]),
);

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  token: env.SANITY_API_TOKEN,
  useCdn: false,
});

/** Placeholder prose, in the studio's voice, written to be replaced. */
const placeholder = (title, setting) => ({
  pullQuote: 'Drawn for the site it stands on.',
  features: [
    'Drawn and detailed in house',
    'Designed for the plot and its light',
    'Built to a residential brief',
  ],
  description: [
    `${title} was drawn by TDK for ${setting}. The design sets the living spaces toward the light and keeps the circulation short, so the plan works as well on an ordinary weekday as it does on the drawings.`,
    'This description is placeholder text. Replace it in the Studio with the project’s own story — the brief, the site, the decisions that shaped it, and what the client asked for.',
  ],
});

const PROJECTS = [
  {
    slug: 'vragadinou-complex',
    title: 'Vragadinou Complex',
    folder: 'VRAGADINOU COMPLEX',
    year: 2023,
    location: 'Nicosia',
    setting: 'a pair of two-storey houses on a sloping plot',
    hero: '1_1 - Photo.png',
    gallery: [
      '1_4 - Photo.png',
      '1_6 - Photo.png',
      '1_9 - Photo.png',
      '2_15 - Photo.png',
      '1_5 - Photo.png',
    ],
  },
  {
    slug: 'vraganidou-complex-ii',
    title: 'Vraganidou Complex II',
    folder: 'VRAGANIDOU COMPLEX 2',
    year: 2023,
    location: 'Nicosia',
    setting: 'a row of houses on a corner plot',
    hero: '1_1 - Photo.jpg',
    gallery: [
      '1_13 - Photo.jpg',
      '1_34 - Photo.jpg',
      '1_41 - Photo.jpg',
      '1_45 - Photo.jpg',
      '1_49 - Photo.jpg',
      '1_50 - Photo.jpg',
      '1_26 - Photo.jpg',
      '1_43 - Photo.jpg',
      '1_47 - Photo.jpg',
      '1_8 - Photo.jpg',
    ],
  },
  {
    slug: 'modular',
    title: 'Modular',
    folder: 'Modular',
    year: 2023,
    location: 'Cyprus',
    setting: 'a single-storey modular house in open country',
    hero: '1_12 - Photo_page-0001.jpg',
    gallery: [
      '1_11 - Photo_page-0001.jpg',
      '1_13 - Photo.jpg',
      '1_15 - Photo.jpg',
      '1_16 - Photo.jpg',
    ],
  },
  {
    slug: 'modular-2-bedroom',
    title: 'Modular — 2 Bedroom',
    folder: 'Modular/2-Bedroom',
    year: 2023,
    location: 'Cyprus',
    setting: 'the two-bedroom modular house, drawn for a coastal plot',
    hero: '1_1 - Sunny day.jpg',
    gallery: [
      '1_2 - Cloudy day.jpg',
      '1_3 - Morning on Vacation.jpg',
      '1_4 - Sunset.jpg',
      '1_5 - Photo.jpg',
      '1_6 - Photo.jpg',
    ],
  },
];

const uploaded = new Map();

async function uploadImage(folder, file) {
  const full = path.join(ROOT, folder, file);
  if (uploaded.has(full)) return uploaded.get(full);
  if (!fs.existsSync(full)) throw new Error(`missing: ${full}`);

  const image = sharp(full).rotate();
  const meta = await image.metadata();
  const buffer = await image
    .resize({ width: Math.min(MAX_WIDTH, meta.width), withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const filename = `${folder
    .split('/')
    .pop()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}-${file
    .replace(/\.[a-z]+$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}.jpg`;

  if (DRY) {
    console.log(
      `   ${file}: ${meta.width}×${meta.height} → ${(buffer.length / 1024).toFixed(0)} KB as ${filename}`,
    );
    const stub = { _id: `image-DRY-${filename}` };
    uploaded.set(full, stub);
    return stub;
  }

  const asset = await client.assets.upload('image', buffer, { filename });
  console.log(`   ${file} → ${asset._id}`);
  uploaded.set(full, asset);
  return asset;
}

const ref = (asset, key) => ({
  _type: 'image',
  ...(key ? { _key: key } : {}),
  asset: { _type: 'reference', _ref: asset._id },
});

for (const p of PROJECTS) {
  console.log(`\n── ${p.title} (${p.folder})`);
  const hero = await uploadImage(p.folder, p.hero);
  const gallery = [];
  for (let i = 0; i < p.gallery.length; i++) {
    gallery.push(ref(await uploadImage(p.folder, p.gallery[i]), `img${i}`));
  }

  const copy = placeholder(p.title, p.setting);
  const doc = {
    _id: `project-${p.slug}`,
    _type: 'project',
    title: p.title,
    slug: { _type: 'slug', current: p.slug },
    // Designed, not built: completed work, shown as a showcase, with the
    // scope stated so the page never implies TDK built it.
    status: 'completed',
    ctaType: 'showcase',
    type: 'residential',
    location: p.location,
    year: p.year,
    heroImage: ref(hero),
    rendersGallery: { heading: 'The design', images: gallery },
    pullQuote: copy.pullQuote,
    features: copy.features,
    specs: [{ _key: 'scope', _type: 'specItem', key: 'Scope', value: 'Design' }],
    description: copy.description.map((text, i) => ({
      _key: `p${i}`,
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{ _key: `s${i}`, _type: 'span', marks: [], text }],
    })),
  };

  console.log(`   → project-${p.slug}: hero + ${gallery.length} renders, ${p.year}, ${p.location}`);
  if (!DRY) await client.createOrReplace(doc);
}

console.log(`\n${DRY ? 'would upload' : 'uploaded'} ${uploaded.size} images`);
