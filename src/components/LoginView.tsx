import React, { useState } from 'react';
import { PublicUser } from '../types';
import { apiFetch } from '../api';
import { setSessionId } from '../authSession';
import { navigateTo } from '../appPath';
import { AuthLayout } from './AuthLayout';

interface LoginViewProps {
  onAuthenticated: (user: PublicUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Введите email и пароль.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.sessionId || !data.user) {
        setError(data.error || 'Не удалось войти.');
        return;
      }
      setSessionId(data.sessionId);
      onAuthenticated(data.user);
      navigateTo('/');
    } catch (err: any) {
      setError(err.message || 'Сетевая ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Вход" subtitle="Войдите, чтобы открыть операционный центр.">
      <form className="mt-4 grid gap-3" onSubmit={handleSubmit} noValidate>
        {error && (
          <p className="rounded-md border border-[var(--status-danger)] bg-[var(--status-danger-soft)] px-2 py-1.5 text-[12px] text-[var(--status-danger)]" role="alert">
            {error}
          </p>
        )}
        <label className="grid gap-1 text-[12px]">
          Email
          <input
            id="login-email"
            className="oc-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </label>
        <label className="grid gap-1 text-[12px]">
          Пароль
          <input
            id="login-password"
            className="oc-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </label>
        <button id="login-submit-btn" type="submit" className="oc-btn" disabled={isLoading}>
          {isLoading ? 'Вход…' : 'Войти'}
        </button>
        <p className="text-center text-[12px] text-[var(--oc-muted)]">
          Нет аккаунта?{' '}
          <a
            href="/register"
            className="text-[var(--oc-accent)] hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/register');
            }}
          >
            Регистрация
          </a>
        </p>
      </form>
    </AuthLayout>
  );
};
