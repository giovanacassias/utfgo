const { join } = require('node:path');
const jsonServer = require('json-server');

const server = jsonServer.create();
const router = jsonServer.router(join(__dirname, 'db.json'));

server.use(jsonServer.bodyParser);
server.post('/auth/otp/send', (request, response) => {
  console.log('OTP simulado:', request.body.code);
  response.status(204).end();
});
server.use(router);

server.listen(3000, 'localhost', () => {
  console.log('Mock da API disponível em http://localhost:3000');
});
