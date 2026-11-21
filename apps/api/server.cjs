const { join } = require('node:path');
const jsonServer = require('json-server');

function createServer(databasePath = join(__dirname, 'db.json')) {
  const server = jsonServer.create();
  const router = jsonServer.router(databasePath);

  server.use(jsonServer.bodyParser);
  server.post('/auth/otp/send', (request, response) => {
    console.log('OTP simulado:', request.body.code);
    response.status(204).end();
  });
  server.post('/users', (request, response) => {
    const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    if (router.db.get('users').value().some((user) => user.email.trim().toLowerCase() === email)) {
      return response.status(409).json({ message: 'E-mail já cadastrado.' });
    }
    const user = { ...request.body, email, role: 'PASSENGER', status: 'ACTIVE' };
    router.db.get('users').push(user).write();
    return response.status(201).json(user);
  });
  server.post('/wallets', (request, response) => {
    const wallet = router.db.get('wallets').find({ userId: request.body.userId }).value();
    if (wallet) return response.status(200).json(wallet);
    router.db.get('wallets').push(request.body).write();
    return response.status(201).json(request.body);
  });
  server.use(router);
  return server;
}

if (require.main === module) {
  createServer().listen(3000, 'localhost', () => {
    console.log('Mock da API disponível em http://localhost:3000');
  });
}

module.exports = { createServer };
