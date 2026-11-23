const { randomInt, randomUUID } = require('node:crypto');
const { join } = require('node:path');
const jsonServer = require('json-server');

const normalize = (value) => typeof value === 'string'
  ? value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
    .replace(/\s+/g, ' ').replace(/\s*([,/—])\s*/g, '$1')
  : '';

function createServer(databasePath = join(__dirname, 'db.json'), reportOtp = console.log) {
  const server = jsonServer.create();
  const router = jsonServer.router(databasePath);

  server.use(jsonServer.bodyParser);
  const meetingPointError = (response, statusCode, error, message) =>
    response.status(statusCode).json({ statusCode, error, message, timestamp: new Date().toISOString() });

  const adminChallenges = new Map();
  const adminSessions = new Map();
  const activeAdmin = (email) => (router.db.get('users').value() ?? []).find(
    (user) => user.email === email && user.role === 'ADMIN' && user.status === 'ACTIVE',
  );
  const requireAdmin = (request, response, next) => {
    const token = /^Bearer (\S+)$/.exec(request.get('Authorization') ?? '')?.[1];
    const session = adminSessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      adminSessions.delete(token);
      return meetingPointError(response, 401, 'Unauthorized', 'Entre com uma conta de administrador.');
    }
    if (activeAdmin(session.email)?.id !== session.userId) {
      return meetingPointError(response, 403, 'Forbidden', 'A gestão é exclusiva de administradores.');
    }
    return next();
  };

  // TODO #2: Replace this json-server mock guard with the NestJS MeetingPoint uniqueness rule.
  server.post('/meeting-points', requireAdmin, (request, response) => {
    const body = request.body ?? {};
    const { latitude, longitude } = body;
    const name = normalize(body.name);
    const address = normalize(body.address);
    if (!name || !address || !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
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

    return requireAdmin(request, response, next);
  });
  server.patch('/meeting-points/:id', (request, response, next) => {
    const body = request.body ?? {};
    if (typeof body.isActive !== 'boolean' || Object.keys(body).length !== 1) {
      return meetingPointError(response, 422, 'Unprocessable Entity', 'Informe apenas o status do ponto.');
    }
    return next();
  });

  server.all('/:resource/:resourceId/:nested', (request, response, next) => {
    const collection = request.params.nested.toLowerCase();
    if (!readMethods.has(request.method) && collection === 'users') {
      return response.sendStatus(405);
    }
    // A nested write must name a collection literally, without URL delimiters.
    if (!readMethods.has(request.method) &&
        (collection === 'meeting-points' || !/^[a-z0-9_-]+$/.test(collection))) {
      return rejectMeetingPointWrite(response);
    }
    return next();
  });

  server.post('/auth/otp/send', (request, response) => {
    const { email, purpose, code } = request.body ?? {};
    if (purpose === 'LOGIN' && activeAdmin(email)) {
      const adminCode = String(randomInt(0, 1_000_000)).padStart(6, '0');
      adminChallenges.set(email, { code: adminCode, expiresAt: Date.now() + 5 * 60_000, attempts: 0 });
      reportOtp('OTP administrativo simulado:', adminCode);
      return response.json({ serverVerified: true });
    }
    reportOtp('OTP simulado:', code);
    response.status(204).end();
  });
  server.post('/auth/otp/verify', (request, response) => {
    const { email, code } = request.body ?? {};
    const challenge = adminChallenges.get(email);
    const user = activeAdmin(email);
    if (!challenge || !user || challenge.expiresAt <= Date.now()) {
      adminChallenges.delete(email);
      return response.sendStatus(401);
    }
    if (challenge.code !== code) {
      challenge.attempts += 1;
      if (challenge.attempts >= 5) adminChallenges.delete(email);
      return response.sendStatus(401);
    }
    adminChallenges.delete(email);
    const token = randomUUID();
    adminSessions.set(token, { email, userId: user.id, expiresAt: Date.now() + 8 * 60 * 60_000 });
    const wallet = router.db.get('wallets').find({ userId: user.id }).value();
    return response.json({ user, wallet, token });
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
  // The generic mock router must not allow clients to assign roles through user writes.
  server.use((request, response, next) => {
    const segments = request.path.split('/').filter(Boolean);
    const targetsUsers = segments[0]?.toLowerCase() === 'users';
    if (!readMethods.has(request.method) && targetsUsers) return response.sendStatus(405);
    return next();
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
