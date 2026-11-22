const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createServer } = require('./server.cjs');

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
    isActive: true,
  };
  writeFileSync(db, JSON.stringify({ 'meeting-points': [seedPoint] }));
  const server = createServer(db).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/meeting-points`;
  const post = (body) => fetch(url, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  try {
    const listed = await (await fetch(url)).json();
    assert.deepEqual(listed, [seedPoint]);
    assert.deepEqual(await (await fetch(`${url}/${seedPoint.id}`)).json(), seedPoint);

    const conflict = await post({
      ...seedPoint,
      id: 'point-2',
      name: '  entrada principal  ',
      address: '  AVENIDA SETE DE SETEMBRO, 3165  ',
    });
    assert.equal(conflict.status, 409);
    assert.deepEqual(await conflict.json(), {
      message: 'Já existe um ponto de encontro com este nome neste endereço.',
    });

    const concurrent = await Promise.all([
      post({ name: 'Biblioteca', address: 'Rua Nova, 10', isActive: true }),
      post({ name: '  biblioteca  ', address: '  rua nova, 10  ', isActive: true }),
    ]);
    assert.deepEqual(concurrent.map((response) => response.status).sort(), [201, 409]);
    assert.equal((await (await fetch(url)).json()).length, 2);

    const toggled = await fetch(`${url}/${seedPoint.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
    assert.equal(toggled.status, 200);
    assert.equal((await toggled.json()).isActive, false);

    const afterToggle = await (await fetch(url)).json();
    assert.equal(afterToggle.length, 2);
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
  const server = createServer(db).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/meeting-points`;
  try {
    const listed = await fetch(url);
    assert.equal(listed.status, 200);
    const points = await listed.json();
    assert.ok(points.length > 0);

    const created = await fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Ponto de teste', address: 'Rua de teste, 1', isActive: true }),
    });
    assert.equal(created.status, 201);

    const patched = await fetch(`${url}/${points[0].id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isActive: !points[0].isActive }),
    });
    assert.equal(patched.status, 200);
    assert.equal((await patched.json()).isActive, !points[0].isActive);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});
