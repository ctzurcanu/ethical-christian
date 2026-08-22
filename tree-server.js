const fs = require('fs');
const http = require('http');
const path = require('path');

const projectDir = __dirname;
const htmlFile = path.join(projectDir, 'tree-view.html');
const jsonFile = path.join(projectDir, 'tree.json');
const requestedPortIndex = process.argv.indexOf('--port');
const requestedPort = requestedPortIndex === -1 ? undefined : Number(process.argv[requestedPortIndex + 1]);
const port = Number.isInteger(requestedPort) && requestedPort >= 0 ? requestedPort : Number(process.env.TREE_PORT || 4310);

function send(response, statusCode, contentType, body) {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  response.end(body);
}

const server = http.createServer((request, response) => {
  const requestPath = new URL(request.url, 'http://127.0.0.1').pathname;

  if (request.method !== 'GET') {
    send(response, 405, 'text/plain; charset=utf-8', 'Method Not Allowed');
    return;
  }

  if (requestPath === '/' || requestPath === '/index.html') {
    send(response, 200, 'text/html; charset=utf-8', fs.readFileSync(htmlFile));
    return;
  }

  if (requestPath === '/tree.json') {
    send(response, 200, 'application/json; charset=utf-8', fs.readFileSync(jsonFile));
    return;
  }

  if (requestPath === '/health') {
    send(response, 200, 'application/json; charset=utf-8', JSON.stringify({ok: true, tree: 'tree.json'}));
    return;
  }

  send(response, 404, 'text/plain; charset=utf-8', 'Not Found');
});

server.listen(port, '127.0.0.1', () => {
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  console.log(`Docs tree server running at http://127.0.0.1:${actualPort}`);
  console.log('Tree data: http://127.0.0.1:' + actualPort + '/tree.json');
});

function closeServer() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);
