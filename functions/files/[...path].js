// functions/files/[...path].js
export async function onRequest(context) {
  const { request, env } = context;

  // Public route: /files/<path...>
  const url = new URL(request.url);
  // remove leading /files/
  let path = url.pathname.replace(/^\/files\/?/, "");

  if (!path || path === "") {
    return new Response("Missing filename in /files/<path>", { status: 400 });
  }

  // Use optional prefix from env
  const prefix = (env.CONTENT_PREFIX || "").replace(/^\/*|\/*$/g, "");
  const key = prefix ? `${prefix}/${path}` : path;

  const bucket = env.Files;
  if (!bucket) {
    return new Response("R2 binding 'Files' not found", { status: 500 });
  }

  const obj = await bucket.get(key);
  if (!obj) {
    return new Response(`R2 object not found: ${key}`, { status: 404 });
  }

  const headers = new Headers();
  try {
    if (typeof obj.writeHttpMetadata === 'function') {
      const meta = obj.writeHttpMetadata();
      for (const [k, v] of Object.entries(meta || {})) {
        headers.set(k, v);
      }
    } else if (obj.httpMetadata?.contentType) {
      headers.set('Content-Type', obj.httpMetadata.contentType);
    }
  } catch (_) {}

  if (!headers.get('Content-Type')) {
    headers.set('Content-Type', 'application/octet-stream');
  }

  headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('X-Worker', 'files-catchall');

  return new Response(obj.body, { status: 200, headers });
}
