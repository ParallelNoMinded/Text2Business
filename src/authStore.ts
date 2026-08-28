import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { ActivityEvent, PublicUser, UserRole, UserStatus } from './types';
import { firstRegisterError, normalizePhoneDigits } from './registerValidation';

const KEYLEN = 64;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  createdAt: string;
}

interface SessionRecord {
  userId: string;
  expiresAt: number;
}

const usersByEmail = new Map<string, StoredUser>();
const usersById = new Map<string, StoredUser>();
const sessions = new Map<string, SessionRecord>();
const activityLog: ActivityEvent[] = [];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashPassword(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEYLEN);
}

function passwordsMatch(password: string, user: StoredUser): boolean {
  const salt = Buffer.from(user.passwordSalt, 'hex');
  const actual = hashPassword(password, salt);
  const expected = Buffer.from(user.passwordHash, 'hex');
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}

export function recordActivity(user: PublicUser | StoredUser, action: string, detail?: string) {
  activityLog.unshift({
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userId: user.id,
    email: user.email,
    action,
    detail,
  });
  if (activityLog.length > 200) activityLog.length = 200;
}

export function listActivity(): ActivityEvent[] {
  return activityLog.slice();
}

function createUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string;
}): StoredUser {
  const salt = randomBytes(16);
  const hash = hashPassword(input.password, salt);
  const user: StoredUser = {
    id: `u-${randomBytes(8).toString('hex')}`,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: normalizeEmail(input.email),
    passwordSalt: salt.toString('hex'),
    passwordHash: hash.toString('hex'),
    role: input.role,
    status: input.status || 'active',
    phone: input.phone ? normalizePhoneDigits(input.phone) : undefined,
    createdAt: new Date().toISOString(),
  };
  usersByEmail.set(user.email, user);
  usersById.set(user.id, user);
  return user;
}

function seedIfMissing(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}) {
  const email = normalizeEmail(input.email);
  if (usersByEmail.has(email)) return;
  createUser({ ...input, email });
}

export function seedDefaultUsers() {
  seedIfMissing({
    firstName: 'Админ',
    lastName: 'Системы',
    email: process.env.ADMIN_EMAIL || 'admin@text2business.local',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'admin',
    phone: '79990000001',
  });
  seedIfMissing({
    firstName: 'Иван',
    lastName: 'Диспетчеров',
    email: process.env.DISPATCHER_EMAIL || 'dispatcher@text2business.local',
    password: process.env.DISPATCHER_PASSWORD || 'dispatcher123',
    role: 'dispatcher',
    phone: '79990000002',
  });
}

export function validateRegisterInput(body: {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
  passwordConfirm?: unknown;
}): string | null {
  return firstRegisterError({
    firstName: typeof body.firstName === 'string' ? body.firstName : '',
    lastName: typeof body.lastName === 'string' ? body.lastName : '',
    email: typeof body.email === 'string' ? body.email : '',
    phone: typeof body.phone === 'string' ? body.phone : '',
    password: typeof body.password === 'string' ? body.password : '',
    passwordConfirm: typeof body.passwordConfirm === 'string' ? body.passwordConfirm : '',
  });
}

export function registerDispatcher(body: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}): { user: PublicUser; sessionId: string } | { error: string } {
  const email = normalizeEmail(body.email);
  if (usersByEmail.has(email)) {
    return { error: 'Пользователь с таким email уже зарегистрирован.' };
  }
  const stored = createUser({
    firstName: body.firstName,
    lastName: body.lastName,
    email,
    password: body.password,
    role: 'dispatcher',
    phone: body.phone,
  });
  const sessionId = createSession(stored.id);
  const user = toPublicUser(stored);
  recordActivity(user, 'register', 'Регистрация диспетчера');
  return { user, sessionId };
}

export function loginUser(
  emailRaw: string,
  password: string
): { user: PublicUser; sessionId: string } | { error: string } {
  const email = normalizeEmail(emailRaw || '');
  const user = usersByEmail.get(email);
  if (!user || !password || !passwordsMatch(password, user)) {
    return { error: 'Неверный email или пароль.' };
  }
  if (user.status === 'blocked') {
    return { error: 'Учётная запись заблокирована.' };
  }
  const sessionId = createSession(user.id);
  const publicUser = toPublicUser(user);
  recordActivity(publicUser, 'login', 'Вход в систему');
  return { user: publicUser, sessionId };
}

function createSession(userId: string): string {
  const sessionId = randomBytes(24).toString('hex');
  sessions.set(sessionId, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return sessionId;
}

export function destroySession(sessionId: string | undefined) {
  if (sessionId) sessions.delete(sessionId);
}

export function destroySessionsForUser(userId: string) {
  for (const [sid, rec] of sessions.entries()) {
    if (rec.userId === userId) sessions.delete(sid);
  }
}

export function getUserBySession(sessionId: string | undefined): PublicUser | null {
  if (!sessionId) return null;
  const rec = sessions.get(sessionId);
  if (!rec) return null;
  if (Date.now() > rec.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  const user = usersById.get(rec.userId);
  if (!user || user.status === 'blocked') return null;
  return toPublicUser(user);
}

export function listUsers(role?: UserRole): PublicUser[] {
  const all = [...usersById.values()].map(toPublicUser);
  if (role) return all.filter((u) => u.role === role);
  return all.sort((a, b) => a.email.localeCompare(b.email));
}

export function adminCreateUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  passwordConfirm?: string;
}): { user: PublicUser } | { error: string } {
  const validationError = firstRegisterError({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone || '',
    password: input.password,
    passwordConfirm: input.passwordConfirm ?? input.password,
  });
  if (validationError) return { error: validationError };
  const email = normalizeEmail(input.email);
  if (input.role !== 'admin' && input.role !== 'dispatcher') return { error: 'Недопустимая роль.' };
  if (usersByEmail.has(email)) return { error: 'Пользователь с таким email уже существует.' };
  const stored = createUser({ ...input, email, role: input.role, phone: input.phone });
  return { user: toPublicUser(stored) };
}

function activeAdminCount(): number {
  return [...usersById.values()].filter((u) => u.role === 'admin' && u.status === 'active').length;
}

export function adminPatchUser(
  id: string,
  patch: { role?: UserRole; status?: UserStatus; firstName?: string; lastName?: string }
): { user: PublicUser } | { error: string } {
  const user = usersById.get(id);
  if (!user) return { error: 'Пользователь не найден.' };
  if (patch.role && patch.role !== 'admin' && patch.role !== 'dispatcher') {
    return { error: 'Недопустимая роль.' };
  }
  if (patch.status && patch.status !== 'active' && patch.status !== 'blocked') {
    return { error: 'Недопустимый статус.' };
  }
  const nextRole = patch.role ?? user.role;
  const nextStatus = patch.status ?? user.status;
  if (user.role === 'admin' && activeAdminCount() <= 1 && (nextRole !== 'admin' || nextStatus === 'blocked')) {
    return { error: 'Нельзя заблокировать или понизить последнего администратора.' };
  }
  if (typeof patch.firstName === 'string' && patch.firstName.trim()) user.firstName = patch.firstName.trim();
  if (typeof patch.lastName === 'string' && patch.lastName.trim()) user.lastName = patch.lastName.trim();
  user.role = nextRole;
  user.status = nextStatus;
  if (user.status === 'blocked') destroySessionsForUser(user.id);
  return { user: toPublicUser(user) };
}

export function updateOwnProfile(
  id: string,
  patch: { firstName?: string; lastName?: string; password?: string; role?: unknown; status?: unknown }
): { user: PublicUser } | { error: string } {
  const user = usersById.get(id);
  if (!user) return { error: 'Пользователь не найден.' };
  if (patch.role !== undefined || patch.status !== undefined) {
    return { error: 'Роль и статус может изменить только администратор.' };
  }
  if (typeof patch.firstName === 'string' && patch.firstName.trim()) user.firstName = patch.firstName.trim();
  if (typeof patch.lastName === 'string' && patch.lastName.trim()) user.lastName = patch.lastName.trim();
  if (typeof patch.password === 'string' && patch.password) {
    if (patch.password.length < 8) return { error: 'Пароль должен быть не короче 8 символов.' };
    const salt = randomBytes(16);
    user.passwordSalt = salt.toString('hex');
    user.passwordHash = hashPassword(patch.password, salt).toString('hex');
  }
  return { user: toPublicUser(user) };
}

export function resetAuthStoreForTests() {
  usersByEmail.clear();
  usersById.clear();
  sessions.clear();
  activityLog.length = 0;
  seedDefaultUsers();
}
