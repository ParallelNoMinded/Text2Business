import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 18016 + Math.floor(Math.random() * 50);
const BASE = `http://127.0.0.1:${PORT}`;
const TOKEN = 'dev-dispatch-token';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Dispatch-Token': TOKEN },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  assert.equal(res.status, 200, JSON.stringify(data));
  assert.ok(data.sessionId);
  return data.sessionId as string;
}

function headers(sessionId: string): Record<string, string> {
  return { 'X-Dispatch-Token': TOKEN, 'X-Session-Id': sessionId };
}

test('HTTP: диспетчер получает 403 на админские API, администратор — доступ', async (t) => {
  const child: ChildProcess = spawn(process.execPath, ['--import', 'tsx', path.join(root, 'server.ts')], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'production',
      DISPATCH_TOKEN: TOKEN,
    },
    stdio: 'pipe',
  });
  t.after(() => {
    child.kill('SIGTERM');
  });

  let ready = false;
  for (let i = 0; i < 50; i++) {
    try {
      const probe = await fetch(`${BASE}/api/auth/me`);
      if (probe.status === 401 || probe.status === 200) {
        ready = true;
        break;
      }
    } catch {
      /* not listening yet */
    }
    await delay(200);
  }
  assert.equal(ready, true, 'сервер RBAC не поднялся');

  const dispatcherSid = await login('dispatcher@text2business.local', 'dispatcher123');
  const adminSid = await login('admin@text2business.local', 'admin123');

  const dispUsers = await fetch(`${BASE}/api/admin/users`, { headers: headers(dispatcherSid) });
  assert.equal(dispUsers.status, 403);

  const dispLogs = await fetch(`${BASE}/api/logs`, { headers: headers(dispatcherSid) });
  assert.equal(dispLogs.status, 403);

  const dispReset = await fetch(`${BASE}/api/database/reset`, {
    method: 'POST',
    headers: headers(dispatcherSid),
  });
  assert.equal(dispReset.status, 403);

  const dispSla = await fetch(`${BASE}/api/admin/sla`, { headers: headers(dispatcherSid) });
  assert.equal(dispSla.status, 403);

  const dispCreate = await fetch(`${BASE}/api/admin/users`, {
    method: 'POST',
    headers: { ...headers(dispatcherSid), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Хак',
      lastName: 'Админ',
      email: 'hack-admin@example.com',
      password: 'password1',
      role: 'admin',
    }),
  });
  assert.equal(dispCreate.status, 403);

  const dispDispatch = await fetch(`${BASE}/api/dispatch`, {
    method: 'POST',
    headers: { ...headers(dispatcherSid), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'тест', channel: 'email' }),
  });
  assert.equal(dispDispatch.status, 403);

  const dispLlm = await fetch(`${BASE}/api/llm/config`, { headers: headers(dispatcherSid) });
  assert.equal(dispLlm.status, 403);

  const dispProfileRole = await fetch(`${BASE}/api/auth/profile`, {
    method: 'PATCH',
    headers: { ...headers(dispatcherSid), 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin' }),
  });
  assert.equal(dispProfileRole.status, 400);
  const profileBody = await dispProfileRole.json();
  assert.equal(profileBody.user?.role, undefined);

  const staleSessionLogs = await fetch(`${BASE}/api/logs`, {
    headers: { 'X-Dispatch-Token': TOKEN, 'X-Session-Id': 'not-a-real-session' },
  });
  assert.equal(staleSessionLogs.status, 401);

  const machineLogs = await fetch(`${BASE}/api/logs`, { headers: { 'X-Dispatch-Token': TOKEN } });
  assert.equal(machineLogs.status, 200);

  const registerAsAdmin = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Рег',
      lastName: 'Тест',
      email: `reg-${Date.now()}@example.com`,
      password: 'password1',
      passwordConfirm: 'password1',
      role: 'admin',
    }),
  });
  const regBody = await registerAsAdmin.json();
  assert.equal(registerAsAdmin.status, 201);
  assert.equal(regBody.user.role, 'dispatcher');
  assert.equal('passwordHash' in (regBody.user || {}), false);
  assert.equal('password' in (regBody.user || {}), false);

  const badLogin = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dispatcher@text2business.local', password: 'wrong-password' }),
  });
  assert.equal(badLogin.status, 401);
  const badLoginBody = await badLogin.json();
  assert.equal('sessionId' in badLoginBody, false);

  const dispDb = await fetch(`${BASE}/api/database`, { headers: headers(dispatcherSid) });
  assert.equal(dispDb.status, 200);

  const adminUsers = await fetch(`${BASE}/api/admin/users`, { headers: headers(adminSid) });
  assert.equal(adminUsers.status, 200);
  const usersBody = await adminUsers.json();
  assert.ok(Array.isArray(usersBody.users));
  assert.ok(usersBody.users.some((u: { role: string }) => u.role === 'dispatcher'));

  const adminLogs = await fetch(`${BASE}/api/logs`, { headers: headers(adminSid) });
  assert.equal(adminLogs.status, 200);

  const adminSla = await fetch(`${BASE}/api/admin/sla`, { headers: headers(adminSid) });
  assert.equal(adminSla.status, 200);

  const adminDb = await fetch(`${BASE}/api/database`, { headers: headers(adminSid) });
  assert.equal(adminDb.status, 200);

  const promote = await fetch(`${BASE}/api/admin/users`, {
    method: 'POST',
    headers: { ...headers(adminSid), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Назнач',
      lastName: 'Админ',
      email: `promoted-${Date.now()}@example.com`,
      password: 'password1',
      role: 'dispatcher',
    }),
  });
  const createdUser = await promote.json();
  assert.equal(promote.status, 201);
  const patched = await fetch(`${BASE}/api/admin/users/${createdUser.user.id}`, {
    method: 'PATCH',
    headers: { ...headers(adminSid), 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', status: 'active' }),
  });
  const patchedBody = await patched.json();
  assert.equal(patched.status, 200);
  assert.equal(patchedBody.user.role, 'admin');

  const blocked = await fetch(`${BASE}/api/admin/users/${createdUser.user.id}`, {
    method: 'PATCH',
    headers: { ...headers(adminSid), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'blocked' }),
  });
  assert.equal(blocked.status, 200);
});
