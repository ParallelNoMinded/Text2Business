import React, { useCallback, useEffect, useState } from 'react';
import { ActivityEvent, PublicUser, UserRole, UserStatus } from '../types';
import { apiFetch } from '../api';
import { PageSection } from './layout/PageSection';
import { StatusBadge } from './ui/StatusBadge';

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'dispatcher'>('all');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'dispatcher' as UserRole,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [uRes, aRes] = await Promise.all([
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/activity'),
      ]);
      const uData = await uRes.json();
      const aData = await aRes.json();
      if (!uRes.ok) {
        setError(uData.error || 'Нет доступа к списку пользователей.');
        return;
      }
      setUsers(uData.users || []);
      if (aRes.ok) setActivity(aData.activity || []);
    } catch (err: any) {
      setError(err.message || 'Сетевая ошибка.');
    }
  }, []);

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
        setError(data.error || 'Не удалось создать пользователя.');
        return;
      }
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'dispatcher' });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const shown = filter === 'dispatcher' ? users.filter((u) => u.role === 'dispatcher') : users;

  return (
    <div id="admin-users-page" className="grid gap-3">
      <PageSection
        title="Пользователи"
        description="Создание учёток, роли, блокировка и журнал активности. Пароли не отображаются."
      />
      {error && (
        <p className="rounded-md border border-[var(--status-danger)] bg-[var(--status-danger-soft)] px-3 py-2 text-[12px] text-[var(--status-danger)]">
          {error}
        </p>
      )}

      <section className="oc-card p-3">
        <h2 className="oc-section-title mb-2">Создать пользователя</h2>
        <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6" onSubmit={handleCreate}>
          <input
            className="oc-input"
            placeholder="Имя"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
          />
          <input
            className="oc-input"
            placeholder="Фамилия"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
          <input
            className="oc-input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="oc-input"
            type="password"
            placeholder="Пароль"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
          <select
            className="oc-input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
          >
            <option value="dispatcher">Диспетчер</option>
            <option value="admin">Администратор</option>
          </select>
          <button type="submit" className="oc-btn" disabled={saving}>
            {saving ? 'Создание…' : 'Создать'}
          </button>
        </form>
      </section>

      <section id="admin-roles-section" className="oc-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">Список и роли</h2>
          <select className="oc-input w-auto" value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'dispatcher')}>
            <option value="all">Все роли</option>
            <option value="dispatcher">Только диспетчеры</option>
          </select>
        </div>
        <div className="table-scroll">
          <table className="oc-table min-w-[720px]">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="font-mono text-[11px]">{u.email}</td>
                  <td>
                    <StatusBadge tone={u.role === 'admin' ? 'info' : 'success'} label={u.role === 'admin' ? 'АДМИН' : 'ДИСПЕТЧЕР'} />
                  </td>
                  <td>
                    <StatusBadge tone={u.status === 'blocked' ? 'danger' : 'success'} label={u.status === 'blocked' ? 'БЛОК' : 'АКТИВЕН'} />
                  </td>
                  <td className="whitespace-nowrap text-[11px]">
                    <button
                      type="button"
                      className="mr-2 text-[var(--oc-accent)]"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="admin-activity-section" className="oc-card overflow-hidden">
        <div className="border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">Активность</h2>
        </div>
        <ul className="max-h-64 overflow-auto px-3 py-2 text-[12px]">
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
    </div>
  );
};
