// functions/files/index.js
// PIN-protected R2 file server with an optimizer.live-like PIN UI
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // PUBLIC URL: /files/<path>
  // R2 KEY: content/<path>
  const path = url.pathname.replace(/^\/files\/?/, "") || "index.html";
  const key = `content/${path}`;

  // Secrets and bindings (names from your Pages settings)
  const PIN = env.DOB; // your 8-digit secret (Pages Secret named DOB)
  const SIGN_KEY = env.COOKIE_SIGNING_SECRET || PIN; // use long COOKIE_SIGNING_SECRET if available
  const R2 = env.Files; // your R2 binding named "Files" (case-sensitive)

  // Helper: constant-time compare
  function constantTimeEq(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    let res = 0;
    for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return res === 0;
  }

  // HMAC-SHA256 sign / verify
  async function signValue(value) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(SIGN_KEY),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", keyMaterial, enc.encode(value));
    const arr = Array.from(new Uint8Array(sig));
    // base64url
    return btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  async function verifySignedValue(signed) {
    try {
      const [value, sig] = signed.split(".");
      if (!value || !sig) return false;
      const expected = await signValue(value);
      if (!constantTimeEq(expected, sig)) return false;
      return value;
    } catch (e) {
      return false;
    }
  }

  // Cookie helper
  function getCookie(name) {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.split(";").map(s => s.trim()).find(s => s.startsWith(name + "="));
    if (!match) return null;
    return decodeURIComponent(match.split("=").slice(1).join("="));
  }

  // If POST -> attempt login
  if (request.method === "POST") {
    const form = await request.formData();
    const pin = (form.get("pin") || "").toString().trim();

    // throttle guard: naive (Pages Functions do not persist counters here).
    if (!PIN) {
      return new Response("Server not configured (PIN missing).", { status: 500 });
    }

    if (pin === PIN) {
      // Create session payload with expiry
      const payloadObj = { ok: true, exp: Date.now() + 24 * 60 * 60 * 1000 };
      const payload = JSON.stringify(payloadObj);
      const sig = await signValue(payload);
      const cookieVal = encodeURIComponent(`${payload}.${sig}`);
      const headers = new Headers();
      // Set secure cookie for 1 day. HttpOnly so JS can't read it.
      headers.append("Set-Cookie", `files_auth=${cookieVal}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${24*60*60}`);
      // Redirect to same URL (GET) after successful login
      headers.append("Location", url.pathname || "/files");
      return new Response(null, { status: 302, headers });
    } else {
      // Bad PIN: return form with message
      return new Response(renderForm("Incorrect PIN — try again."), { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
  }

  // If GET and cookie present -> verify and serve file if valid
  const cookie = getCookie("files_auth");
  if (cookie) {
    const verified = await verifySignedValue(cookie);
    if (verified) {
      try {
        const session = JSON.parse(verified);
        if (session.exp && Date.now() < session.exp) {
          // Serve the R2 object
          if (!R2) return new Response("Server misconfigured (R2 binding missing).", { status: 500 });
          const obj = await R2.get(key);
          if (!obj) return new Response("Not found", { status: 404 });

          // Build headers (preserve any http metadata if available)
          const headers = new Headers();
          try {
            if (typeof obj.writeHttpMetadata === "function") {
              const meta = obj.writeHttpMetadata();
              for (const [k, v] of Object.entries(meta || {})) headers.set(k, v);
            } else if (obj.httpMetadata && obj.httpMetadata.contentType) {
              headers.set("Content-Type", obj.httpMetadata.contentType);
            }
          } catch (e) { /* ignore */ }

          if (!headers.get("Content-Type")) {
            if (key.endsWith(".html")) headers.set("Content-Type", "text/html; charset=utf-8");
            else if (key.endsWith(".css")) headers.set("Content-Type", "text/css; charset=utf-8");
            else if (key.endsWith(".js")) headers.set("Content-Type", "application/javascript; charset=utf-8");
            else if (key.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) headers.set("Content-Type", "image/*");
            else headers.set("Content-Type", "application/octet-stream");
          }

          // Authenticated responses: private cache on browser, short edge cache
          headers.set("Cache-Control", "private, max-age=0, s-maxage=3600, stale-while-revalidate=3600");

          return new Response(obj.body, { status: 200, headers });
        }
      } catch (e) {
        // fall through to login form
      }
    }
  }

  // not authenticated -> show PIN form
  return new Response(renderForm(), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });

  // ---------- UI renderer (HTML + CSS) ----------
  function renderForm(message = "") {
    // Minimal inline CSS that gives a look similar in spirit to optimizer.live:
    // centered glass card, subtle gradient background, clean input and button, small logo area.
    // Adjust logo / text to your site identity if desired.
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Notes — Enter PIN</title>
<style>
  :root{
    --bg1: #0f172a;
    --bg2: #071021;
    --card: rgba(255,255,255,0.03);
    --glass: rgba(255,255,255,0.04);
    --accent: #7c5cff;
    --muted: rgba(255,255,255,0.7);
    --danger: #ff6b6b;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  }
  html,body{height:100%;margin:0;}
  body{
    display:flex;
    align-items:center;
    justify-content:center;
    background:linear-gradient(180deg,var(--bg1),var(--bg2));
    color:var(--muted);
    -webkit-font-smoothing:antialiased;
    -moz-osx-font-smoothing:grayscale;
    padding:24px;
  }
  .card{
    width:100%;
    max-width:420px;
    background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
    border-radius:14px;
    padding:28px;
    box-shadow: 0 6px 30px rgba(2,6,23,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.04);
    backdrop-filter: blur(8px) saturate(120%);
  }
  .logo {
    display:flex;
    align-items:center;
    gap:12px;
    margin-bottom:18px;
  }
  .badge {
    width:44px;height:44px;border-radius:10px;
    background:linear-gradient(135deg,var(--accent), #3b82f6);
    display:flex;align-items:center;justify-content:center;color:white;font-weight:700;
    box-shadow: 0 6px 18px rgba(124,92,255,0.16);
    font-size:16px;
  }
  h1{margin:0;font-size:20px;color:#fff;}
  p.lead{margin:6px 0 18px;color:rgba(255,255,255,0.75);font-size:13px}
  form{display:flex;flex-direction:column;gap:12px}
  input[type="password"]{
    padding:14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.06);
    background:var(--glass);color:#fff;font-size:15px;outline:none;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
  }
  input[type="password"]::placeholder{color:rgba(255,255,255,0.45)}
  input[type="password"]:focus{border-color: rgba(124,92,255,0.85); box-shadow: 0 6px 20px rgba(124,92,255,0.08); }
  .row{display:flex;gap:10px;align-items:center}
  button{
    padding:12px 14px;border-radius:10px;border:0;background:linear-gradient(90deg,var(--accent), #5eead4);
    color:#061220;font-weight:600;font-size:15px;cursor:pointer;
    transition:transform .12s ease, box-shadow .12s ease;
  }
  button:active{transform:translateY(1px)}
  .hint{font-size:13px;color:rgba(255,255,255,0.6)}
  .msg{font-size:13px;color:var(--danger);background:rgba(255,107,107,0.06);padding:10px;border-radius:8px;border:1px solid rgba(255,107,107,0.06)}
  .foot{margin-top:16px;font-size:12px;color:rgba(255,255,255,0.5);text-align:center}
  @media (max-width:420px){ .card{padding:20px} .logo h1{font-size:18px} }
</style>
</head>
<body>
  <div class="card" role="main" aria-labelledby="title">
    <div class="logo">
      <div class="badge">S</div>
      <div style="flex:1">
        <h1 id="title">Protected Notes</h1>
        <div class="lead">Enter the PIN to access secure files.</div>
      </div>
    </div>

    ${message ? `<div class="msg" role="alert">${escapeHtml(message)}</div>` : ""}

    <form method="post" autocomplete="off" onsubmit="disableBtn(this)">
      <input name="pin" id="pin" type="password" inputmode="numeric" maxlength="8" placeholder="Enter 8-digit PIN" required pattern="\\d{4,8}" />
      <div class="row">
        <div style="flex:1" class="hint">Keep your PIN private. You will remain logged in for 24 hours.</div>
        <button type="submit" id="unlock">Unlock</button>
      </div>
    </form>

    <div class="foot">If you didn’t set this up, contact the site admin.</div>
  </div>

<script>
  function disableBtn(form){
    const btn = document.getElementById('unlock');
    btn.disabled = true;
    btn.textContent = 'Unlocking...';
    setTimeout(()=>btn.disabled=false, 5000);
    return true;
  }
  // small helper to focus input
  document.getElementById('pin').focus();
</script>
</body>
</html>`;

  } // end renderForm

  // helper to escape inserted text safely
  function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
}
