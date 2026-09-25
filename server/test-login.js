const http = require('http');
const req = http.request('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(res.statusCode, data));
});
req.write(JSON.stringify({email: 'admin@tamilarasuenterprises.com', password: 'abc'}));
req.end();
