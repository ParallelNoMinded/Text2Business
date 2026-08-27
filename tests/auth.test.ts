import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getUserBySession,
  loginUser,
  registerDispatcher,
  resetAuthStoreForTests,
  toPublicUser,
  validateRegisterInput,
} from '../src/authStore';

test('регистрация всегда создаёт dispatcher и игнорирует role из формы', () => {
  resetAuthStoreForTests();
  const result = registerDispatcher({
    firstName: 'Анна',
    lastName: 'Козлова',
    email: 'anna@example.com',
    password: 'password1',
  });
  assert.ok('user' in result);
  if (!('user' in result)) return;
  assert.equal(result.user.role, 'dispatcher');
  assert.equal(result.user.email, 'anna@example.com');
  assert.equal('password' in result.user, false);
  assert.equal('passwordHash' in result.user, false);
});

test('публичный пользователь не содержит хеш пароля', () => {
  resetAuthStoreForTests();
  const created = registerDispatcher({
    firstName: 'Пётр',
    lastName: 'Сидоров',
    email: 'petr@example.com',
    password: 'password1',
  });
  assert.ok('user' in created);
  if (!('user' in created)) return;
  const json = JSON.stringify(created);
  assert.equal(json.includes('passwordHash'), false);
  assert.equal(json.includes('passwordSalt'), false);
  assert.equal(json.includes('password1'), false);
  const publicUser = toPublicUser({
    id: created.user.id,
    firstName: created.user.firstName,
    lastName: created.user.lastName,
    email: created.user.email,
    passwordSalt: 'secret-salt',
    passwordHash: 'secret-hash',
    role: created.user.role,
    status: created.user.status,
    createdAt: created.user.createdAt,
  } as any);
  assert.equal((publicUser as any).passwordHash, undefined);
  assert.equal((publicUser as any).passwordSalt, undefined);
});

test('вход по неверному паролю не выдаёт сессию', () => {
  resetAuthStoreForTests();
  const bad = loginUser('dispatcher@text2business.local', 'wrong-password');
  assert.ok('error' in bad);
  const ok = loginUser('dispatcher@text2business.local', 'dispatcher123');
  assert.ok('sessionId' in ok);
  if (!('sessionId' in ok)) return;
  assert.equal(ok.user.role, 'dispatcher');
  assert.ok(getUserBySession(ok.sessionId));
});

test('валидация регистрации отклоняет короткий пароль и несовпадение', () => {
  assert.ok(validateRegisterInput({ firstName: 'А', lastName: 'Б', email: 'a@b.c', password: '123', passwordConfirm: '123' }));
  assert.equal(
    validateRegisterInput({
      firstName: 'А',
      lastName: 'Б',
      email: 'a@b.c',
      password: 'password1',
      passwordConfirm: 'password2',
    }),
    'Пароли не совпадают.'
  );
});
