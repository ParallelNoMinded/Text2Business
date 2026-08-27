import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adminCreateUser,
  adminPatchUser,
  getUserBySession,
  listUsers,
  loginUser,
  registerDispatcher,
  resetAuthStoreForTests,
  updateOwnProfile,
} from '../src/authStore';
import { canAccessPath, canAccessTab } from '../src/roles';

test('диспетчер не имеет доступа к /admin/users и админским вкладкам', () => {
  assert.equal(canAccessPath('dispatcher', '/admin/users'), false);
  assert.equal(canAccessPath('dispatcher', '/admin/logs'), false);
  assert.equal(canAccessPath('dispatcher', '/admin/channels'), false);
  assert.equal(canAccessTab('dispatcher', 'logs_traces'), false);
  assert.equal(canAccessTab('dispatcher', 'admin_users'), false);
  assert.equal(canAccessPath('dispatcher', '/operator'), true);
  assert.equal(canAccessPath('dispatcher', '/tickets'), true);
  assert.equal(canAccessPath('dispatcher', '/sla'), true);
  assert.equal(canAccessPath('dispatcher', '/history'), true);
  assert.equal(canAccessPath('dispatcher', '/notifications'), true);
  assert.equal(canAccessPath('dispatcher', '/profile'), true);
  assert.equal(canAccessTab('dispatcher', 'sla'), true);
  assert.equal(canAccessTab('dispatcher', 'channels'), false);
});

test('администратор имеет доступ к /admin/users', () => {
  assert.equal(canAccessPath('admin', '/admin/users'), true);
  assert.equal(canAccessPath('admin', '/admin/registry'), true);
  assert.equal(canAccessTab('admin', 'logs_traces'), true);
});

test('заблокированный пользователь не входит', () => {
  resetAuthStoreForTests();
  const created = registerDispatcher({
    firstName: 'Блок',
    lastName: 'Тест',
    email: 'blocked@example.com',
    password: 'password1',
  });
  assert.ok('user' in created);
  if (!('user' in created)) return;
  const patched = adminPatchUser(created.user.id, { status: 'blocked' });
  assert.ok('user' in patched);
  const login = loginUser('blocked@example.com', 'password1');
  assert.ok('error' in login);
  assert.equal(getUserBySession(created.sessionId), null);
});

test('админ создаёт пользователя и меняет роль', () => {
  resetAuthStoreForTests();
  const created = adminCreateUser({
    firstName: 'Новый',
    lastName: 'Диспетчер',
    email: 'new.disp@example.com',
    password: 'password1',
    role: 'dispatcher',
  });
  assert.ok('user' in created);
  if (!('user' in created)) return;
  assert.equal(created.user.role, 'dispatcher');
  const promoted = adminPatchUser(created.user.id, { role: 'admin' });
  assert.ok('user' in promoted);
  if (!('user' in promoted)) return;
  assert.equal(promoted.user.role, 'admin');
  assert.ok(listUsers('dispatcher').every((u) => u.role === 'dispatcher'));
});

test('профиль не позволяет сменить роль самостоятельно', () => {
  resetAuthStoreForTests();
  const created = registerDispatcher({
    firstName: 'Оля',
    lastName: 'Саморост',
    email: 'olya@example.com',
    password: 'password1',
  });
  assert.ok('user' in created);
  if (!('user' in created)) return;
  const denied = updateOwnProfile(created.user.id, { role: 'admin' } as any);
  assert.ok('error' in denied);
  const ok = updateOwnProfile(created.user.id, { firstName: 'Ольга' });
  assert.ok('user' in ok);
  if (!('user' in ok)) return;
  assert.equal(ok.user.role, 'dispatcher');
  assert.equal(ok.user.firstName, 'Ольга');
});
