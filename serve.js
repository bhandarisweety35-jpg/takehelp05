// Tiny zero-dependency static server for local testing. In production use any static host (Netlify, Vercel, Cloudflare Pages...).
const http = require('http'), fs = require('fs'), path = require('path');
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }, root = path.join(__dirname, 'public'), port = process.env.PORT || 5173;
http.createServer((q, s) => {
  let p; try { p = decodeURIComponent(q.url.split('?')[0]); } catch { s.writeHead(400); return s.end(); }
  const f = path.normalize(path.join(root, p === '/' ? '/index.html' : p));
  if (!f.startsWith(root)) { s.writeHead(403); return s.end(); }
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); return s.end('Not found'); }
    s.writeHead(200, { 'Content-Type': (T[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8' }); s.end(d); });
}).listen(port, () => console.log(`TakeHelp? frontend on http://localhost:${port}`));
