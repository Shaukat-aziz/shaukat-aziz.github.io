// functions/files/index.js
export async function onRequest(context) {
  const { request, env } = context;

  // Public route: /files/<path>
  const url = new URL(request.url);
  let path = url.pathname.replace(/^\/files\/?/, "");

  // Default file for directory root
  if (!path || path === "") {
    return new Response("Missing filename in /files/<path>", { status: 400 });
  }

  // R2 key: content/<path>
  const key = `content/${path}`;

  // R2 binding must be exactly "Files"
  const bucket = env.Files;
  if (!bucket) {
    return new Response("R2 binding 'Files' not found", { status: 500 });
  }

  // Read file from R2
  const obj = await bucket.get(key);
  if (!obj) {
    return new Response(`R2 object not found: ${key}`, { status: 404 });
  }

  // Build headers
  const headers = new Headers();

  // Preserve metadata if available
  try {
    if (typeof obj.writeHttpMetadata === "function") {
      const meta = obj.writeHttpMetadata();
      for (const [k, v] of Object.entries(meta || {})) {
        headers.set(k, v);
      }
    } else if (obj.httpMetadata?.contentType) {
      headers.set("Content-Type", obj.httpMetadata.contentType);
    }
  } catch (_) {}

  // Fallback content type
  if (!headers.get("Content-Type")) {
    headers.set("Content-Type", "application/octet-stream");
  }

  // Cloudflare edge cache — safe for public files
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");

  // Debug header so you KNOW function ran
  headers.set("X-Worker", "files-basic");

  return new Response(obj.body, { status: 200, headers });
}
