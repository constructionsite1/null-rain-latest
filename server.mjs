import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const mime = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml', '.wav':'audio/wav', '.md':'text/plain' };
const port = Number(process.env.PORT || 4173);
http.createServer((req,res) => {
  let target;
  try { target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); } catch { res.writeHead(400); return res.end(); }
  if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  fs.readFile(target,(err,data) => { if(err) {res.writeHead(404);res.end('Not found');return;} res.writeHead(200, {'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control':'no-cache'});res.end(data); });
}).listen(port, '127.0.0.1', () => console.log(`NULL // RAIN — http://localhost:${port}`));
