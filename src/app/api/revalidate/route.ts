import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

// Ensure this matches the secret you set in the Sanity webhook dashboard
const secret = process.env.SANITY_REVALIDATE_SECRET;

export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<{ _type: string; slug?: string }>(
      req,
      secret,
    );

    if (!isValidSignature) {
      const message = 'Invalid signature';
      return new Response(JSON.stringify({ message, isValidSignature, body }), { status: 401 });
    }

    if (!body?._type) {
      const message = 'Bad Request';
      return new Response(JSON.stringify({ message, body }), { status: 400 });
    }

    const { _type, slug } = body;

    // We can use a tag-based revalidation if tags are setup, but since the requirement
    // says "revalidate all relevant routes via Next.js cache", let's revalidate all paths
    // or type-specific paths. Given localization, checking paths might be robust.
    // However, the simplest way to invalidate everything for site-wide data:

    console.log(`[Revalidate Webhook] Updating type: ${_type}, slug: ${slug}`);

    // Assuming we don't have tags set up on all queries, we can manually clear key paths
    // where 'slug' might be present, or globally clear if it's siteSettings

    if (_type === 'siteSettings') {
      revalidatePath('/', 'layout'); // Revalidate all layouts (navbar/footer updates globally)
    } else if (_type === 'project') {
      revalidatePath('/en/projects');
      if (slug) revalidatePath(`/en/projects/${slug}`);
      revalidatePath('/en'); // homepage reel + featured residence
    } else if (_type === 'teamMember') {
      revalidatePath('/en/about');
    }

    // Since we also support Greek in the future, if you want it to apply site-wide,
    // we could also just revalidate layouts or everything. Let's do a catch-all layout
    // revalidate for simplicity if it gets complicated, but for now the paths above are okay.

    return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
  } catch (err: unknown) {
    console.error(err);
    const error = err as Error;
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
