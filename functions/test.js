// functions/test.js
export async function onRequest(context) {
  const headers = new Headers();
  headers.set('Content-Type', 'text/plain; charset=utf-8');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('X-Worker', 'test-function');
  return new Response('function-ok', { status: 200, headers });
}
