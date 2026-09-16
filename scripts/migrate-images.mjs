/**
 * Cloudinary → Sanity assets, one time.
 *
 * Downloads every image the site refers to — the ones stored on documents
 * (project heroes and galleries, team photos, settings) and the ones the
 * design asks for by name in code — uploads each ONCE to Sanity, then
 * rewrites the documents to point at the new assets and creates a `siteImage`
 * document per design key.
 *
 *   node scripts/migrate-images.mjs --dry    # report, change nothing
 *   node scripts/migrate-images.mjs          # do it
 *
 * Safe to re-run: uploads are keyed by the Cloudinary id, documents are
 * patched by _id, and siteImage documents use deterministic ids.
 */
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const DRY = process.argv.includes('--dry');

const env = Object.fromEntries(
  fs
    .readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^["']|["']$/g, '')]),
);

const CLOUD = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  token: env.SANITY_API_TOKEN,
  useCdn: false,
});

/** The images the design asks for by name: key → Cloudinary id + where it is. */
const SITE_IMAGES = [
  ['about-chip', 'clients/tdkdb/armonia/interior/5.jpg', 'About — the photograph set inside the headline'],
  ['about-hero', 'clients/tdkdb/general/about/armonia_front_angle_day', 'About — the wide plate under the headline'],
  ['about-draw', 'clients/tdkdb/general/about/second-design-philosophy', 'About — “Draw”, first of the three plates'],
  ['about-build', 'clients/tdkdb/general/about/fourth-people', 'About — “Build”, second of the three plates'],
  ['about-handover', 'clients/tdkdb/armonia/interior/2', 'About — “Hand over”, third of the three plates'],
  ['about-spread', 'clients/tdkdb/armonia/interior/4.jpg', 'About — the large plate in the spread'],
  ['about-view-one', 'clients/tdkdb/armonia/exterior/2.jpg', 'About — the taller plate in the staggered row'],
  ['about-view-two', 'clients/tdkdb/armonia/interior/3.jpg', 'About — the wider plate in the staggered row'],
  ['about-standard', 'clients/tdkdb/almond/renders/ChatGPT_Image_Feb_6_2026_08_07_30_PM.png', 'About — the full-height plate with the closing statement'],
  ['contact-plate', 'clients/tdkdb/armonia/interior/3.jpg', 'Contact page — the photograph beside the form'],
  ['home-contact-plate', 'clients/tdkdb/armonia/interior/6', 'Homepage — the tall photograph in the contact section'],
  ['home-about-people', 'clients/tdkdb/general/about/fourth-people', 'Homepage — the people cell in the About grid'],
  ['home-about-material', 'clients/tdkdb/general/about/second-design-philosophy', 'Homepage — the material cell in the About grid'],
  ['home-interlude', 'clients/tdkdb/armonia/interior/3', 'Homepage — the render behind the interlude'],
  ['footer-backdrop', 'clients/tdkdb/armonia/interior/2', 'Footer — the photograph behind every page’s footer'],
];

const uploaded = new Map(); // cloudinary id → { _id }

async function uploadOnce(publicId) {
  if (uploaded.has(publicId)) return uploaded.get(publicId);

  const url = `https://res.cloudinary.com/${CLOUD}/image/upload/${publicId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cloudinary ${res.status} for ${publicId}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const filename = publicId.split('/').pop().replace(/\.[a-z]+$/i, '');
  if (DRY) {
    console.log(`   would upload ${publicId} (${(buffer.length / 1024).toFixed(0)} KB)`);
    const stub = { _id: `image-DRY-${filename}` };
    uploaded.set(publicId, stub);
    return stub;
  }

  const asset = await client.assets.upload('image', buffer, { filename });
  console.log(`   uploaded ${publicId} → ${asset._id}`);
  uploaded.set(publicId, asset);
  return asset;
}

const ref = (asset, key) => ({
  _type: 'image',
  ...(key ? { _key: key } : {}),
  asset: { _type: 'reference', _ref: asset._id },
});

async function migrateDocs() {
  const docs = await client.fetch(
    `*[_type in ['project','teamMember','siteSettings']]{ _id, _type, title, name, heroImageId, homepageGridImageId, homepagePortraitImageId, photoId, logoId, ogImageId, 'renders': rendersGallery.images, 'photos': photosGallery.images }`,
  );

  for (const doc of docs) {
    const set = {};
    const unset = [];
    const label = doc.title || doc.name || doc._type;

    const single = async (oldField, newField) => {
      const id = doc[oldField];
      if (typeof id !== 'string' || !id) return;
      set[newField] = ref(await uploadOnce(id));
      unset.push(oldField);
    };

    await single('heroImageId', 'heroImage');
    await single('homepageGridImageId', 'homepageGridImage');
    await single('homepagePortraitImageId', 'homepagePortraitImage');
    await single('photoId', 'photo');
    await single('logoId', 'logo');
    await single('ogImageId', 'ogImage');

    for (const [field, list] of [
      ['rendersGallery.images', doc.renders],
      ['photosGallery.images', doc.photos],
    ]) {
      if (!Array.isArray(list) || !list.length) continue;
      // Already migrated (objects, not strings)? Leave it alone.
      if (typeof list[0] !== 'string') continue;
      const images = [];
      for (let i = 0; i < list.length; i++) {
        images.push(ref(await uploadOnce(list[i]), `img${i}`));
      }
      set[field] = images;
    }

    if (!Object.keys(set).length && !unset.length) {
      console.log(` · ${label}: nothing to migrate`);
      continue;
    }
    console.log(
      ` · ${label}: set ${Object.keys(set).join(', ') || '—'}${unset.length ? ` | unset ${unset.join(', ')}` : ''}`,
    );
    if (!DRY) {
      await client.patch(doc._id).set(set).unset(unset).commit();
    }
  }
}

async function migrateSiteImages() {
  for (const [key, publicId, title] of SITE_IMAGES) {
    const asset = await uploadOnce(publicId);
    const doc = {
      // Hyphen, never a dot: Sanity treats an id containing a dot as private,
      // so `siteImage.about-hero` is invisible to the site's public client.
      _id: `siteImage-${key}`,
      _type: 'siteImage',
      key: { _type: 'slug', current: key },
      title,
      image: ref(asset),
    };
    console.log(` · siteImage-${key} → ${publicId}`);
    if (!DRY) await client.createOrReplace(doc);
  }
}

console.log(DRY ? '— DRY RUN, nothing will change —' : '— migrating —');
await migrateDocs();
console.log('— site images —');
await migrateSiteImages();
console.log(`\ndistinct images: ${uploaded.size}`);
