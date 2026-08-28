import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityEvent, PublicUser, UserRole, UserStatus } from '../types';
import { apiFetch } from '../api';
import { PageSection } from './layout/PageSection';
import { StatusBadge } from './ui/StatusBadge';
import { AuthField } from './AuthField';
import {
  REGISTER_FIELD_META,
  RegisterFieldName,
  RegisterFormValues,
  validateRegisterField,
  validateRegisterForm,
} from '../registerValidation';

const EMPTY_FORM: RegisterFormValues & { role: UserRole } = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
  role: 'dispatcher',
};

export type AdminPeopleSection = 'users' | 'roles' | 'activity';

export const AdminUsersView: React.FC<{ section?: AdminPeopleSection }> = ({ section = 'users' }) => {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'dispatcher'>('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<RegisterFieldName, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const liveErrors = useMemo(() => validateRegisterForm(form), [form]);
  const formValid = Object.keys(liveErrors).length === 0;

  const load = useCallback(async () => {
    setError(null);
    try {
      if (section === 'activity') {
        const aRes = await apiFetch('/api/admin/activity');
        const aData = await aRes.json();
        if (!aRes.ok) {
          setError(aData.error || 'Нет доступа к журналу активности.');
          return;
        }
        setActivity(aData.activity || []);
        return;
      }
      const uRes = await apiFetch('/api/admin/users');
      const uData = await uRes.json();
      if (!uRes.ok) {
        setError(uData.error || 'Нет доступа к списку пользователей.');
        return;
      }
      setUsers(uData.users || []);
    } catch (err: any) {
      setError(err.message || 'Сетевая ошибка.');
    }
  }, [section]);

  useEffect(() => {
    load();
  }, [load]);

  const patchUser = async (id: string, body: { role?: UserRole; status?: UserStatus }) => {
    setError(null);
    const res = await apiFetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Операция отклонена.');
      return;
    }
    await load();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      passwordConfirm: true,
    });
    if (!formValid) return;
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Не удалось проверить данные. Попробуйте ещё раз');
        return;
      }
      setForm(EMPTY_FORM);
      setTouched({});
      await load();
    } catch {
      setError('Не удалось проверить данные. Попробуйте ещё раз');
    } finally {
      setSaving(false);
    }
  };

  const shown = filter === 'dispatcher' ? users.filter((u) => u.role === 'dispatcher') : users;
  const titles = {
    users: { title: 'Пользователи', description: 'Создание учётки диспетчера или администратора.' },
    roles: { title: 'Список и роли', description: 'Роли, блокировка и состав команды.' },
    activity: { title: 'Активность', description: 'Журнал действий администраторов и входов.' },
  } as const;

  return (
    <div id="admin-users-page" className="grid gap-3">
      <PageSection title={titles[section].title} description={titles[section].description} />
      {error && (
        <p className="rounded-md border border-[var(--status-danger)] bg-[var(--status-danger-soft)] px-3 py-2 text-[12px] text-[var(--status-danger)]">
          {error}
        </p>
      )}

      {section === 'users' && (
      <section className="oc-card p-3">
        <h2 className="oc-section-title mb-2">Создать пользователя</h2>
        <p className="mb-3 text-[11px] text-[var(--oc-muted)]">Диспетчер или администратор. Пароли не показываются.</p>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleCreate} noValidate>
          {(['firstName', 'lastName', 'email', 'phone', 'password', 'passwordConfirm'] as RegisterFieldName[]).map(
            (name) => {
              const meta = REGISTER_FIELD_META[name];
              const err = touched[name] ? validateRegisterField(name, form) : null;
              return (
                <AuthField
                  key={name}
                  id={`admin-create-${name}`}
                  label={meta.label}
                  hint={meta.hint}
                  placeholder={meta.placeholder}
                  type={meta.type}
                  autoComplete={meta.autoComplete}
                  value={form[name]}
                  error={err}
                  showOk={Boolean(form[name]) && !liveErrors[name]}
                  disabled={saving}
                  onChange={(v) => setForm({ ...form, [name]: v })}
                  onBlur={() => setTouched((prev) => ({ ...prev, [name]: true }))}
                />
              );
            }
          )}
          <div className="grid gap-1">
            <label htmlFor="admin-create-role" className="text-[12px] font-medium">
              Роль
            </label>
            <p className="text-[11px] text-[var(--oc-muted)]">Например: Диспетчер</p>
            <select
              id="admin-create-role"
              className="oc-input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              disabled={saving}
            >
              <option value="dispatcher">Диспетчер</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="oc-btn" disabled={saving || !formValid}>
              {saving ? 'Создание…' : 'Зарегистрировать'}
            </button>
          </div>
        </form>
      </section>
      )}

      {section === 'roles' && (
      <section id="admin-roles-section" className="oc-card overflow-hidden">
        <div className="flex items-center justify-end border-b border-[var(--oc-border)] px-3 py-2">
          <select className="oc-input w-auto" value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'dispatcher')}>
            <option value="all">Все роли</option>
            <option value="dispatcher">Только диспетчеры</option>
          </select>
        </div>
        <div className="divide-y divide-[var(--oc-border)]">
          {shown.map((u) => (
            <div key={u.id} className="grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div className="min-w-0">
                <p className="text-[13px] font-medium">
                  {u.firstName} {u.lastName}
                </p>
                <p className="break-all font-mono text-[11px] text-[var(--oc-muted)]">{u.email}</p>
                <p className="font-mono text-[11px] text-[var(--oc-muted)]">{u.phone ? `+${u.phone}` : '—'}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <StatusBadge tone={u.role === 'admin' ? 'info' : 'success'} label={u.role === 'admin' ? 'АДМИН' : 'ДИСПЕТЧЕР'} />
                  <StatusBadge tone={u.status === 'blocked' ? 'danger' : 'success'} label={u.status === 'blocked' ? 'БЛОК' : 'АКТИВЕН'} />
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                <button
                  type="button"
                  className="text-[var(--oc-accent)]"
                  onClick={() => patchUser(u.id, { role: u.role === 'admin' ? 'dispatcher' : 'admin' })}
                >
                  {u.role === 'admin' ? 'Сделать диспетчером' : 'Сделать админом'}
                </button>
                <button
                  type="button"
                  className="text-[var(--status-danger)]"
                  onClick={() => patchUser(u.id, { status: u.status === 'blocked' ? 'active' : 'blocked' })}
                >
                  {u.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {section === 'activity' && (
      <section id="admin-activity-section" className="oc-card overflow-hidden">
        <div className="border-b border-[var(--oc-border)] px-3 py-2">
          <p className="text-[11px] text-[var(--oc-muted)]">События учёток и входов</p>
        </div>
        <ul className="max-h-[70vh] overflow-auto px-3 py-2 text-[12px]">
          {activity.length === 0 && <li className="text-[var(--oc-muted)]">Пока нет событий.</li>}
          {activity.map((a) => (
            <li key={a.id} className="border-b border-[var(--oc-border)] py-1">
              <span className="font-mono text-[10px] text-[var(--oc-muted)]">{new Date(a.timestamp).toLocaleString('ru-RU')}</span>{' '}
              <span>{a.email}</span> · {a.action}
              {a.detail ? ` — ${a.detail}` : ''}
            </li>
          ))}
        </ul>
      </section>
      )}
    </div>
  );
};
