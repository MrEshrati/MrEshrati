export async function serveCard(request, secret, readData, render) {
  if (new URL(request.url).search) {
    return new Response('This card takes no parameters.', { status: 400 });
  }
  const token = process.env[secret]?.trim();
  if (!token) {
    return new Response('Card setup is incomplete.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const data = await readData(token, AbortSignal.timeout(25_000));
    return new Response(render(data), {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=1800',
        'Vercel-CDN-Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response('GitHub data is temporarily unavailable.', {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
