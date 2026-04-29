const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4000;
const BASE = __dirname;
const ADS_DIR = path.join(path.dirname(BASE), 'habuild-ads');
const LEADS_FILE = path.join(BASE, 'leads.json');

// Initialize leads file
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, '[]');

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json'
};

function getLeads() {
  try { return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8')); } catch { return []; }
}
function saveLeads(leads) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

const server = http.createServer((req, res) => {
  const [urlPath] = req.url.split('?');
  const method = req.method;

  // ── API Routes ──
  if (urlPath === '/api/leads' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(fs.readFileSync(LEADS_FILE, 'utf8'));
    return;
  }

  if (urlPath === '/api/leads' && method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const lead = JSON.parse(body);
        const leads = getLeads();
        const idx = leads.findIndex(l => l.id === lead.id);
        if (idx >= 0) leads[idx] = lead; else leads.push(lead);
        saveLeads(leads);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true, total: leads.length }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (urlPath === '/api/leads' && method === 'DELETE') {
    saveLeads([]);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  // ── Page Routes ──
  let filePath;
  if (urlPath === '/' || urlPath === '/quiz') {
    filePath = path.join(BASE, 'index.html');
  } else if (urlPath === '/responses' || urlPath === '/leads' || urlPath === '/dashboard') {
    filePath = path.join(BASE, 'responses.html');
  } else if (urlPath === '/ads' || urlPath === '/ad') {
    filePath = path.join(ADS_DIR, 'index.html');
  } else {
    filePath = path.join(BASE, urlPath);
    if (!fs.existsSync(filePath)) filePath = path.join(ADS_DIR, urlPath);
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`<html><body style="font-family:system-ui;padding:40px;text-align:center">
        <h1>HaBuild Tools</h1>
        <p><a href="/" style="font-size:1.1rem;color:#6C63FF">Quiz Page</a></p>
        <p><a href="/responses" style="font-size:1.1rem;color:#6C63FF">Response Sheet</a></p>
        <p><a href="/ads" style="font-size:1.1rem;color:#6C63FF">Ad Kit</a></p>
      </body></html>`);
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/html' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  HaBuild Tools running:\n`);
  console.log(`    Quiz:       http://localhost:${PORT}/`);
  console.log(`    Responses:  http://localhost:${PORT}/responses`);
  console.log(`    Ad Kit:     http://localhost:${PORT}/ads\n`);
});
