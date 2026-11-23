const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createServer } = require('./server.cjs');

const admin = {
  id: 'admin-1', email: 'admin@alunos.utfpr.edu.br', role: 'ADMIN', status: 'ACTIVE',
};

async function signInAdmin(url, getCode) {
  const post = (path, body) => fetch(new URL(path, url), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  const sent = await post('/auth/otp/send', { email: admin.email, purpose: 'LOGIN' });
  assert.deepEqual(await sent.json(), { serverVerified: true });
  const code = getCode();
  const verified = await post('/auth/otp/verify', { email: admin.email, code });
  assert.equal(verified.status, 200);
  assert.equal((await post('/auth/otp/verify', { email: admin.email, code })).status, 401);
  return (await verified.json()).token;
}

test('concurrent requests preserve unique users and wallets', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'utfgo-test-'));
  const db = join(dir, 'db.json');
  writeFileSync(db, JSON.stringify({ users: [], wallets: [] }));
  const server = createServer(db).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(url + path, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  try {
    const user = { id: '1', name: 'Ana', email: 'ana@utfpr.edu.br', campus: 'Curitiba', role: 'ADMIN', status: 'BANNED' };
    const results = await Promise.all([post('/users', user), post('/users', { ...user, id: '2', email: ' ANA@utfpr.edu.br ' })]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    const wallet = { id: 'wallet-1', userId: '1', tokenBalance: 0, penaltyPoints: 0 };
    const wallets = await Promise.all([post('/wallets', wallet), post('/wallets', wallet)]);
    assert.deepEqual(wallets.map((r) => r.status).sort(), [200, 201]);
    const users = await (await fetch(url + '/users')).json();
    assert.equal(users.length, 1);
    assert.equal(users[0].role, 'PASSENGER');
    assert.equal(users[0].status, 'ACTIVE');
    assert.equal((await (await fetch(url + '/wallets')).json()).length, 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});

test('meeting-points endpoints expose the seed, guard duplicates and toggle status', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'utfgo-meeting-points-'));
  const db = join(dir, 'db.json');
  const seedPoint = {
    id: 'point-1',
    name: 'Entrada Principal',
    address: 'Avenida Sete de Setembro, 3165',
    latitude: -25.4,
    longitude: -49.2,
    isActive: true,
  };
  writeFileSync(db, JSON.stringify({ 'meeting-points': [seedPoint], users: [admin], wallets: [] }));
  let code;
  const server = createServer(db, (_label, otp) => { code = otp; }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/meeting-points`;
  const post = (body, token) => fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
  });
  try {
    const listed = await (await fetch(url)).json();
    assert.deepEqual(listed, [seedPoint]);
    assert.deepEqual(await (await fetch(`${url}/${seedPoint.id}`)).json(), seedPoint);

    assert.equal((await post(seedPoint)).status, 401);
    assert.equal((await post(seedPoint, 'utfgo-session-admin-1')).status, 401);
    const unauthorizedPatch = await fetch(`${url}/${seedPoint.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
    assert.equal(unauthorizedPatch.status, 401);
    const token = await signInAdmin(url, () => code);
    const headers = { 'content-type': 'application/json', Authorization: `Bearer ${token}` };

    const conflict = await post({
      ...seedPoint,
      id: 'point-2',
      name: '  éntrada   principal  ',
      address: '  AVENIDA SETE DE SETEMBRO ,3165  ',
    }, token);
    assert.equal(conflict.status, 409);
    const { timestamp, ...error } = await conflict.json();
    assert.ok(Number.isFinite(Date.parse(timestamp)));
    assert.deepEqual(error, {
      statusCode: 409,
      error: 'Conflict',
      message: 'Já existe um ponto de encontro com este nome neste endereço.',
    });

    for (const body of [{}, { ...seedPoint, name: ' ' }, { ...seedPoint, latitude: null }, { ...seedPoint, longitude: 'invalid' }, { ...seedPoint, latitude: 91 }, { ...seedPoint, longitude: -181 }]) {
      const invalid = await post(body, token);
      assert.equal(invalid.status, 422);
      assert.equal((await invalid.json()).statusCode, 422);
    }
    assert.deepEqual(await (await fetch(url)).json(), [seedPoint]);

    const concurrent = await Promise.all([
      post({ name: 'Biblioteca', address: 'Rua Nova, 10', latitude: -25.4, longitude: -49.2 }, token),
      post({ name: '  biblioteca  ', address: '  rua nova, 10  ', latitude: -25.4, longitude: -49.2 }, token),
    ]);
    assert.deepEqual(concurrent.map((response) => response.status).sort(), [201, 409]);
    assert.equal((await (await fetch(url)).json()).length, 2);

    const toggled = await fetch(`${url}/${seedPoint.id}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ isActive: false }),
    });
    assert.equal(toggled.status, 200);
    assert.equal((await toggled.json()).isActive, false);

    const deleted = await fetch(`${url}/${seedPoint.id}`, { method: 'DELETE' });
    assert.equal(deleted.status, 405);
    assert.equal((await fetch(`${url}/${seedPoint.id}`)).status, 200);

    const nestedResults = await Promise.all(
      ['meeting-points', 'meeting-points%3F'].map((resource) =>
        fetch(new URL(`/campuses/curitiba/${resource}`, url), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        }),
      ),
    );
    const overriddenDelete = await fetch(`${url}/${seedPoint.id}`, {
      method: 'POST',
      headers: { 'x-http-method-override': 'DELETE' },
    });
    assert.deepEqual(nestedResults.map((response) => response.status), [405, 405]);
    assert.equal(overriddenDelete.status, 405);
    assert.equal((await fetch(`${url}/${seedPoint.id}`)).status, 200);

    const afterToggle = await (await fetch(url)).json();
    assert.equal(afterToggle.length, 2);
    assert.equal((await post({ ...seedPoint, name: 'Portão lateral', latitude: -90, longitude: 180 }, token)).status, 201);
    assert.equal(afterToggle.find((point) => point.id === seedPoint.id).isActive, false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the real seed exposes GET/POST/PATCH on /meeting-points', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'utfgo-seed-points-'));
  const db = join(dir, 'db.json');
  writeFileSync(db, readFileSync(join(__dirname, 'db.json')));
  let code;
  const server = createServer(db, (_label, otp) => { code = otp; }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/meeting-points`;
  try {
    const listed = await fetch(url);
    assert.equal(listed.status, 200);
    const points = await listed.json();
    assert.ok(points.length > 0);

    const token = await signInAdmin(url, () => code);
    const headers = { 'content-type': 'application/json', Authorization: `Bearer ${token}` };
    const created = await fetch(url, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Ponto de teste', address: 'Rua de teste, 1', latitude: -25.4, longitude: -49.2 }),
    });
    assert.equal(created.status, 201);
    const point = await created.json();
    assert.ok(point.id);
    assert.equal(point.isActive, true);
    assert.ok(Number.isFinite(Date.parse(point.createdAt)));
    assert.deepEqual(await (await fetch(`${url}/${point.id}`)).json(), point);

    const patched = await fetch(`${url}/${points[0].id}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ isActive: !points[0].isActive }),
    });
    assert.equal(patched.status, 200);
    assert.equal((await patched.json()).isActive, !points[0].isActive);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});
