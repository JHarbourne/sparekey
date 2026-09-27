// Tiny static server for local use and the browser tests. Sends the same
// security headers as vercel.json, so the tests run under the real CSP.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('..', import.meta.url)));
const types = { '.txt': 'text/plain; charset=utf-8', '': 'text/plain; charset=utf-8', '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
const vercel = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
const security = Object.fromEntries(vercel.headers[0].headers.map((h) => [h.key, h.value]));
const port = Number(process.env.PORT || 4173);

http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  if (!extname(p) && !p.startsWith('/.well-known/')) p += '.html'; // clean URLs, as on Vercel
  const file = normalize(join(root, p));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { ...security, 'content-type': types[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, () => console.log(`Serving on http://localhost:${port}`));
