import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import os from 'os';
import path from 'path';
import {
  getUserBySession,
  loginUser,
  persistAuthRoundTripForTests,
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

test('регистрация сохраняется на диск и читается после перезагрузки', () => {
  resetAuthStoreForTests();
  const created = registerDispatcher({
    firstName: 'Соня',
    lastName: 'Файлова',
    email: 'sonya.persist@example.com',
    password: 'password1',
    phone: '+7 999 555-44-33',
  });
  assert.ok('user' in created);
  if (!('user' in created)) return;
  const file = path.join(os.tmpdir(), `t2b-users-${Date.now()}.json`);
  persistAuthRoundTripForTests(file);
  const raw = readFileSync(file, 'utf8');
  assert.equal(raw.includes('password1'), false);
  assert.ok(raw.includes('sonya.persist@example.com'));
  const again = loginUser('sonya.persist@example.com', 'password1');
  assert.ok('sessionId' in again);
  if (!('sessionId' in again)) return;
  assert.equal(again.user.firstName, 'Соня');
  assert.equal(again.user.phone, '79995554433');
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
  assert.equal(
    validateRegisterInput({
      firstName: 'Анна',
      lastName: 'Козлова',
      email: 'anna@example.com',
      phone: '+7 999 123-45-67',
      password: '123',
      passwordConfirm: '123',
    }),
    'Пароль должен содержать минимум 8 символов'
  );
  assert.equal(
    validateRegisterInput({
      firstName: 'Анна',
      lastName: 'Козлова',
      email: 'anna@example.com',
      phone: '+7 999 123-45-67',
      password: 'password1',
      passwordConfirm: 'password2',
    }),
    'Пароли не совпадают'
  );
  assert.equal(
    validateRegisterInput({
      firstName: 'Анна',
      lastName: 'Козлова',
      email: 'не-email',
      phone: '+7 999 123-45-67',
      password: 'password1',
      passwordConfirm: 'password1',
    }),
    'Введите корректный email'
  );
  assert.equal(
    validateRegisterInput({
      firstName: 'Анна',
      lastName: 'Козлова',
      email: 'anna@example.com',
      phone: '123',
      password: 'password1',
      passwordConfirm: 'password1',
    }),
    'Номер телефона введён в неправильном формате'
  );
});
