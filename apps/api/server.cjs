const { join } = require('node:path');
const jsonServer = require('json-server');

function createServer(databasePath = join(__dirname, 'db.json')) {
  const server = jsonServer.create();
  const router = jsonServer.router(databasePath);

  server.use(jsonServer.bodyParser);
  const meetingPointError = (response, statusCode, error, message) =>
    response.status(statusCode).json({ statusCode, error, message, timestamp: new Date().toISOString() });

  // TODO #2: Replace this json-server mock guard with the NestJS MeetingPoint uniqueness rule.
  server.post('/meeting-points', (request, response) => {
    const body = request.body ?? {};
    const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
    const { latitude, longitude } = body;
    const name = normalize(body.name);
    const address = normalize(body.address);
    if (!name || !address || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return meetingPointError(response, 422, 'Unprocessable Entity',
        'Informe nome, endereço e coordenadas válidas para o ponto de encontro.');
    }

    const points = router.db.get('meeting-points').value() ?? [];
    const duplicate = points.some(
      (point) => normalize(point.name) === name && normalize(point.address) === address,
    );

    if (duplicate) {
      return meetingPointError(response, 409, 'Conflict',
        'Já existe um ponto de encontro com este nome neste endereço.');
    }
    const point = router.db.get('meeting-points').insert({
      name: body.name.trim(),
      address: body.address.trim(),
      latitude,
      longitude,
      isActive: true,
      createdAt: new Date().toISOString(),
    }).value();
    router.db.write();
    return response.status(201).json(point);
  });
  const readMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
  const rejectMeetingPointWrite = (response) =>
    meetingPointError(
      response, 405, 'Method Not Allowed', 'Use a rota de cadastro ou atualize o status do ponto.',
    );

  // Keep meeting-point writes on the supported routes before json-server rewrites them.
  server.all('/meeting-points/:id?', (request, response, next) => {
    if (readMethods.has(request.method)) {
      return next();
    }
    if (request.method !== 'PATCH' || !request.params.id) {
      return rejectMeetingPointWrite(response);
    }

    const body = request.body ?? {};
    if (typeof body.isActive !== 'boolean' || Object.keys(body).length !== 1) {
      return meetingPointError(response, 422, 'Unprocessable Entity', 'Informe apenas o status do ponto.');
    }
    return next();
  });

  server.all('/:resource/:resourceId/:nested', (request, response, next) => {
    const collection = request.params.nested.toLowerCase();
    // A nested write must name a collection literally, without URL delimiters.
    if (!readMethods.has(request.method) &&
        (collection === 'meeting-points' || !/^[a-z0-9_-]+$/.test(collection))) {
      return rejectMeetingPointWrite(response);
    }
    return next();
  });

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
