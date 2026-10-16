import { readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};
const port = Number(process.argv[2] || 4321);

function send(res, status, file) {
  const body = readFileSync(file);
  const type = TYPES[extname(file)] || 'application/octet-stream';
  const isText = /text|javascript|svg/.test(type);
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-cache',
    ...(isText && { 'Content-Encoding': 'gzip' }),
  });
  res.end(isText ? gzipSync(body) : body);
}

// Gzip and 404.html like GitHub Pages, so local pages and Lighthouse numbers match production.
createServer((req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    // The proof page is a dev tool, so it's served from the repo and never lands in dist/.
    const isProof = url === '/proof' || url === '/proof.html';
    let file = isProof ? fileURLToPath(new URL('proof.html', import.meta.url)) : normalize(join(DIST, url));
    if (!isProof && !file.startsWith(DIST)) return res.writeHead(403).end();
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    send(res, 200, file);
  } catch {
    try {
      send(res, 404, join(DIST, '404.html'));
    } catch {
      res.writeHead(404).end();
    }
  }
}).listen(port, '127.0.0.1', () => console.log(`http://localhost:${port}/`));
