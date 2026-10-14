import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

import { submitIndexNow } from '@/lib/indexnow';

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

    console.log(`[Revalidate Webhook] Updating type: ${_type}, slug: ${slug}`);

    // The pages whose content this document feeds. They are revalidated here
    // and announced to IndexNow below, so Bing recrawls them promptly.
    const changed: string[] = [];

    if (_type === 'siteSettings') {
      revalidatePath('/', 'layout'); // Revalidate all layouts (navbar/footer updates globally)
      changed.push('/en', '/en/about', '/en/projects', '/en/contact');
    } else if (_type === 'project') {
      revalidatePath('/en/projects');
      if (slug) revalidatePath(`/en/projects/${slug}`);
      revalidatePath('/en'); // homepage reel + featured residence
      changed.push('/en', '/en/projects');
      if (slug) changed.push(`/en/projects/${slug}`);
    } else if (_type === 'siteImage') {
      revalidatePath('/', 'layout');
      changed.push('/en', '/en/about', '/en/contact');
    } else if (_type === 'teamMember') {
      revalidatePath('/en/about');
      changed.push('/en/about');
    }

    // Best effort: a rejected or failed hint never fails the revalidation.
    const indexNow = await submitIndexNow(changed);

    return NextResponse.json({ status: 200, revalidated: true, indexNow, now: Date.now() });
  } catch (err: unknown) {
    console.error(err);
    const error = err as Error;
    return new Response(error.message || 'Internal Server Error', { status: 500 });
  }
}
