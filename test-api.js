const http = require('http');

const data = JSON.stringify({
  action: 'ADD',
  entity: 'EXAM',
  payload: { name: 'New Test Exam ' + Date.now() }
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/master-data',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
