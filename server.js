const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const API_KEY = '043b25df62ec4870a4dfb3acd9d9c79e';
const API_HOST = 'api.rentcast.io';

const server = http.createServer((req, res) => {
  // Proxy API requests to RentCast
  if (req.url.startsWith('/api/')) {
    // /api/listings/sale?... → /v1/listings/sale?...
    const apiPath = '/v1' + req.url.slice(4); // strip "/api" prefix, keep the rest
    const fullUrl = `https://${API_HOST}${apiPath}`;
    console.log(`[PROXY] → ${fullUrl}`);

    const options = {
      hostname: API_HOST,
      path: apiPath,
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        'Accept': 'application/json'
      }
    };

    const proxy = https.request(options, (apiRes) => {
      let body = '';
      apiRes.on('data', chunk => body += chunk);
      apiRes.on('end', () => {
        console.log(`[PROXY] ← ${apiRes.statusCode} (${body.length} bytes)`);
        if (apiRes.statusCode !== 200) {
          console.log(`[PROXY] Error body: ${body.slice(0, 500)}`);
        }
        res.writeHead(apiRes.statusCode, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(body);
      });
    });

    proxy.on('error', (e) => {
      console.error(`[PROXY] Network error: ${e.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });

    proxy.end();
    return;
  }

  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  filePath = path.join(__dirname, filePath);
  const ext = path.extname(filePath);
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  🏠 SwipeHouse is running!\n`);
  console.log(`  Open http://localhost:${PORT} in your browser\n`);
});
