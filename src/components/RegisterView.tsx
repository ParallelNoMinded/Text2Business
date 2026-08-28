import React, { useMemo, useState } from 'react';
import { PublicUser } from '../types';
import { apiFetch } from '../api';
import { setSessionId } from '../authSession';
import { navigateTo } from '../appPath';
import { AuthLayout } from './AuthLayout';
import { AuthField } from './AuthField';
import {
  REGISTER_FIELD_META,
  RegisterFieldName,
  RegisterFormValues,
  validateRegisterField,
  validateRegisterForm,
} from '../registerValidation';

interface RegisterViewProps {
  onAuthenticated: (user: PublicUser) => void;
}

const EMPTY: RegisterFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
};

export const RegisterView: React.FC<RegisterViewProps> = ({ onAuthenticated }) => {
  const [values, setValues] = useState<RegisterFormValues>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<RegisterFieldName, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Partial<Record<RegisterFieldName, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const liveErrors = useMemo(() => validateRegisterForm(values), [values]);
  const formValid = Object.keys(liveErrors).length === 0;

  const setField = (name: RegisterFieldName, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
    setServerFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const blurField = (name: RegisterFieldName) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const shownError = (name: RegisterFieldName) =>
    serverFieldErrors[name] || (touched[name] ? validateRegisterField(name, values) : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      passwordConfirm: true,
    });
    setFormError(null);
    setServerFieldErrors({});
    if (!formValid) return;
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          password: values.password,
          passwordConfirm: values.passwordConfirm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.sessionId || !data.user) {
        const message =
          typeof data.error === 'string' && data.error.trim()
            ? data.error
            : 'Не удалось проверить данные. Попробуйте ещё раз';
        if (/email/i.test(message)) {
          setTouched((prev) => ({ ...prev, email: true }));
          setServerFieldErrors({ email: message });
        } else {
          setFormError(message);
        }
        return;
      }
      setSessionId(data.sessionId);
      onAuthenticated(data.user);
      navigateTo('/');
    } catch {
      setFormError('Не удалось проверить данные. Попробуйте ещё раз');
    } finally {
      setIsLoading(false);
    }
  };

  const fieldId: Record<RegisterFieldName, string> = {
    firstName: 'register-first-name',
    lastName: 'register-last-name',
    email: 'register-email',
    phone: 'register-phone',
    password: 'register-password',
    passwordConfirm: 'register-password-confirm',
  };

  return (
    <AuthLayout title="Регистрация" subtitle="Новый пользователь получает роль диспетчера. Администратора создаёт только действующий администратор.">
      <form className="mt-4 grid gap-3" onSubmit={handleSubmit} noValidate>
        {formError && (
          <p
            className="rounded-md border border-[var(--status-danger)] bg-[var(--status-danger-soft)] px-2 py-1.5 text-[12px] text-[var(--status-danger)]"
            role="alert"
          >
            {formError}
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(['firstName', 'lastName'] as const).map((name) => {
            const meta = REGISTER_FIELD_META[name];
            const err = shownError(name);
            return (
              <AuthField
                key={name}
                id={fieldId[name]}
                label={meta.label}
                hint={meta.hint}
                placeholder={meta.placeholder}
                type={meta.type}
                autoComplete={meta.autoComplete}
                value={values[name]}
                error={err}
                showOk={Boolean(values[name]) && !liveErrors[name]}
                disabled={isLoading}
                onChange={(v) => setField(name, v)}
                onBlur={() => blurField(name)}
              />
            );
          })}
        </div>
        {(['email', 'phone', 'password', 'passwordConfirm'] as const).map((name) => {
          const meta = REGISTER_FIELD_META[name];
          const err = shownError(name);
          return (
            <AuthField
              key={name}
              id={fieldId[name]}
              label={meta.label}
              hint={meta.hint}
              placeholder={meta.placeholder}
              type={meta.type}
              autoComplete={meta.autoComplete}
              value={values[name]}
              error={err}
              showOk={Boolean(values[name]) && !liveErrors[name]}
              disabled={isLoading}
              onChange={(v) => setField(name, v)}
              onBlur={() => blurField(name)}
            />
          );
        })}
        <button
          id="register-submit-btn"
          type="submit"
          className="oc-btn oc-btn-accent"
          disabled={isLoading || !formValid}
        >
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
