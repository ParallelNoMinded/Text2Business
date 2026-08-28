import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api';
import { admin } from 'better-auth/plugins';
import { Pool } from 'pg';

const normalizePostgresSslMode = (connectionString?: string) => {
  if (!connectionString) return connectionString;

  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get('sslmode');
    if (sslMode && ['prefer', 'require', 'verify-ca'].includes(sslMode.toLowerCase())) {
      url.searchParams.set('sslmode', 'verify-full');
    }
    return url.toString();
  } catch {
    return connectionString;
  }
};

const databaseURL = normalizePostgresSslMode(process.env.DATABASE_URL);
if (!databaseURL) {
  throw new Error('DATABASE_URL is required. Ensure the Neon environment is loaded before starting the server.');
}

export const authPool = new Pool({ connectionString: databaseURL });

const toOrigin = (value?: string) => {
  if (!value) return null;
  try {
    return new URL(value.startsWith('http') ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
};

const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  process.env.V0_RUNTIME_URL ||
  'http://localhost:8080';

const isV0Preview = Boolean(
  process.env.V0_RUNTIME_URL || process.env.V0_DEV_APP_URL || process.env.V0_BUILD_URL || process.env.V0_SANDBOX_URL,
);
const needsCrossSitePreviewCookies = process.env.NODE_ENV === 'development' || isV0Preview;

const environmentOrigins = needsCrossSitePreviewCookies
  ? [
      'http://localhost:3000',
      'http://localhost:8080',
      process.env.V0_RUNTIME_URL,
      process.env.V0_DEV_APP_URL,
      process.env.V0_BUILD_URL,
      process.env.V0_SANDBOX_URL,
    ]
  : [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL];

const staticTrustedOrigins = environmentOrigins.map(toOrigin).filter((origin): origin is string => Boolean(origin));

const getTrustedOrigins = (request?: Request) => {
  if (!needsCrossSitePreviewCookies || !request) return staticTrustedOrigins;

  const requestOrigin = toOrigin(request.headers.get('origin') ?? undefined);
  if (!requestOrigin) return staticTrustedOrigins;

  const originURL = new URL(requestOrigin);
  const isSecureV0Preview =
    originURL.protocol === 'https:' &&
    (originURL.hostname.endsWith('.v0.build') || originURL.hostname.endsWith('.vercel.run'));

  return isSecureV0Preview ? [...staticTrustedOrigins, requestOrigin] : staticTrustedOrigins;
};

export const auth = betterAuth({
  database: authPool,
  baseURL,
  trustedOrigins: getTrustedOrigins,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 5,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const protectedPaths = ['/admin/set-role', '/admin/ban-user', '/admin/remove-user'];
      if (!protectedPaths.includes(ctx.path)) return;

      const session = await getSessionFromCtx<{ role?: string }>(ctx, { disableCookieCache: true });
      if (!session?.user || session.user.role !== 'admin') {
        throw new APIError('FORBIDDEN', { message: 'Недостаточно прав.' });
      }

      const body = ctx.body as { userId?: string; role?: string | string[] } | undefined;
      const targetUserId = typeof body?.userId === 'string' ? body.userId : '';
      if (!targetUserId) throw new APIError('BAD_REQUEST', { message: 'Не указан пользователь.' });

      const requestedRoles = Array.isArray(body?.role) ? body.role : [body?.role];
      const removesAdminRole = ctx.path === '/admin/set-role' && !requestedRoles.includes('admin');
      const disablesAccount = ctx.path === '/admin/ban-user' || ctx.path === '/admin/remove-user';

      if (targetUserId === session.user.id && (removesAdminRole || disablesAccount)) {
        throw new APIError('CONFLICT', {
          message: 'Нельзя понизить, заблокировать или удалить собственный аккаунт.',
        });
      }

      const targetResult = await authPool.query<{ role: string | null; banned: boolean | null }>(
        'SELECT role, banned FROM "user" WHERE id = $1 LIMIT 1',
        [targetUserId],
      );
      const target = targetResult.rows[0];
      if (!target) throw new APIError('NOT_FOUND', { message: 'Пользователь не найден.' });

      if (target.role === 'admin' && target.banned !== true && (removesAdminRole || disablesAccount)) {
        const adminCount = await authPool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM "user" WHERE role = 'admin' AND COALESCE(banned, false) = false`,
        );
        if (Number(adminCount.rows[0]?.count ?? 0) <= 1) {
          throw new APIError('CONFLICT', {
            message: 'Нельзя изменить последнего активного администратора.',
          });
        }
      }
    }),
  },
  plugins: [
    admin({
      defaultRole: 'dispatcher',
      adminRoles: ['admin'],
      bannedUserMessage: 'Ваш доступ к системе приостановлен. Обратитесь к администратору.',
    }),
  ],
  ...(needsCrossSitePreviewCookies
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
});

export type AppRole = 'dispatcher' | 'admin';
