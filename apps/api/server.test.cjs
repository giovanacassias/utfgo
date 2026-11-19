const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
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
