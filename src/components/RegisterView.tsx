import React, { useState } from 'react';
import { PublicUser } from '../types';
import { apiFetch } from '../api';
import { setSessionId } from '../authSession';
import { navigateTo } from '../appPath';
import { AuthLayout } from './AuthLayout';

interface RegisterViewProps {
  onAuthenticated: (user: PublicUser) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onAuthenticated }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          passwordConfirm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.sessionId || !data.user) {
        setError(data.error || 'Не удалось зарегистрироваться.');
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
    <AuthLayout title="Регистрация" subtitle="Новый пользователь получает роль диспетчера.">
      <form className="mt-4 grid gap-3" onSubmit={handleSubmit} noValidate>
        {error && (
          <p className="rounded-md border border-[var(--status-danger)] bg-[var(--status-danger-soft)] px-2 py-1.5 text-[12px] text-[var(--status-danger)]" role="alert">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-[12px]">
            Имя
            <input
              id="register-first-name"
              className="oc-input"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isLoading}
              required
            />
          </label>
          <label className="grid gap-1 text-[12px]">
            Фамилия
            <input
              id="register-last-name"
              className="oc-input"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isLoading}
              required
            />
          </label>
        </div>
        <label className="grid gap-1 text-[12px]">
          Email
          <input
            id="register-email"
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
            id="register-password"
            className="oc-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={8}
          />
        </label>
        <label className="grid gap-1 text-[12px]">
          Подтверждение пароля
          <input
            id="register-password-confirm"
            className="oc-input"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            disabled={isLoading}
            required
            minLength={8}
          />
        </label>
        <button id="register-submit-btn" type="submit" className="oc-btn" disabled={isLoading}>
          {isLoading ? 'Создание…' : 'Зарегистрироваться'}
        </button>
        <p className="text-center text-[12px] text-[var(--oc-muted)]">
          Уже есть аккаунт?{' '}
          <a
            href="/login"
            className="text-[var(--oc-accent)] hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/login');
            }}
          >
            Войти
          </a>
        </p>
      </form>
    </AuthLayout>
  );
};
