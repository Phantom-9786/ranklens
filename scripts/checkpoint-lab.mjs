/** Local-only fault proxy. Production contains no fault switches or mock model. */
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const origin = 'https://ranklens-beta.vercel.app';
const port = Number(process.argv[2] || 5188);
const modes = new Set(['network', 'midstream', 'api-error', 'rate-limit', 'malformed-tool', 'slow']);
let mode = ''; let armed = false;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const event = part => `data: ${JSON.stringify(part)}\n\n`;
const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://127.0.0.1:${port}`);
  if (url.pathname === '/assistant' && modes.has(url.searchParams.get('checkpoint'))) {
    mode = url.searchParams.get('checkpoint'); armed = true;
  }
  try {
    const chunks = []; let size = 0;
    for await (const chunk of request) { size += chunk.length; if (size > 32000) { response.writeHead(413); response.end(); return; } chunks.push(chunk); }
    const body = Buffer.concat(chunks);
    if (url.pathname === '/api/chat' && armed) {
      armed = false;
      if (mode === 'network') {
        // Flush headers before dropping the connection so the browser cannot silently retry the POST.
        response.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8' }); response.flushHeaders();
        await wait(100); response.destroy(); return;
      }
      if (mode === 'rate-limit') {
        response.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '8' });
        response.end(JSON.stringify({ error: 'Local sabotage: injected HTTP 429.' })); return;
      }
      if (mode === 'slow') await wait(10000);
      else {
        response.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store' });
        response.write(event({ type: 'start' }));
        response.write(event({ type: 'text-delta', delta: 'Local connection test: this reply arrived only partially.' }));
        await wait(900);
        if (mode === 'midstream') { response.destroy(); return; }
        if (mode === 'api-error') { response.end(event({ type: 'error', message: 'The AI service failed while replying. Retry this message for a fresh response.' })); return; }
        response.end(event({ type: 'tool-update', part: { type: 'tool-get_audit_report', toolCallId: 'invalid-result', state: 'output-available', output: { score: 'bad' } } })); return;
      }
    }
    const target = new URL(url.pathname + url.search, origin);
    const abort = new AbortController();
    response.on('close', () => abort.abort());
    const headers = { origin, ...(body.length ? { 'Content-Type': 'application/json' } : {}) };
    const upstream = await fetch(target, { method: request.method, headers, ...(body.length ? { body } : {}), signal: abort.signal });
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    response.writeHead(upstream.status, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    if (contentType.includes('text/html')) {
      const html = await upstream.text();
      const banner = `<div style="position:fixed;top:0;left:0;right:0;z-index:99999;padding:7px 14px;background:#403d33;color:#fff;font:12px Arial;text-align:center">LOCAL SABOTAGE LAB · ${mode || 'no fault'} · First request is deliberately failed/delayed; Retry contacts the real live service.</div>`;
      response.end(html.replace('</body>', `${banner}</body>`));
    } else if (upstream.body) await pipeline(Readable.fromWeb(upstream.body), response);
    else response.end();
  } catch {
    if (response.destroyed) return;
    if (!response.headersSent) { response.writeHead(502, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error: 'The connection to the live service was interrupted. Retry this message.' })); }
    else response.destroy();
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Checkpoint sabotage lab: http://127.0.0.1:${port}/assistant?checkpoint=midstream`));
