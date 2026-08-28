import React, { useState } from 'react';
import { PublicUser } from '../types';
import { apiFetch } from '../api';
import { PageSection } from './layout/PageSection';

interface ProfileViewProps {
  user: PublicUser;
  onUserUpdate: (user: PublicUser) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUserUpdate }) => {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setSaving(true);
    try {
      const body: Record<string, string> = { firstName, lastName };
      if (password.trim()) body.password = password;
      const res = await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Не удалось сохранить профиль.');
        return;
      }
      onUserUpdate(data.user);
      setPassword('');
      setStatus('Профиль обновлён.');
    } catch (err: any) {
      setError(err.message || 'Сетевая ошибка.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-3">
      <PageSection
        title="Профиль"
        description="Роль меняет только администратор."
        status={{ tone: user.role === 'admin' ? 'info' : 'success', label: user.role === 'admin' ? 'АДМИН' : 'ДИСПЕТЧЕР' }}
      />
      <section className="oc-card max-w-lg p-4">
        <form className="grid gap-3" onSubmit={handleSave}>
          {error && <p className="text-[12px] text-[var(--status-danger)]">{error}</p>}
          {status && <p className="text-[12px] text-[var(--status-success)]">{status}</p>}
          <label className="grid gap-1 text-[12px]">
            Имя
            <input className="oc-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label className="grid gap-1 text-[12px]">
            Фамилия
            <input className="oc-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
          <label className="grid gap-1 text-[12px]">
            Email
            <input className="oc-input" value={user.email} disabled />
          </label>
          <label className="grid gap-1 text-[12px]">
            Телефон
            <input className="oc-input" value={user.phone ? `+${user.phone}` : '—'} disabled />
          </label>
          <label className="grid gap-1 text-[12px]">
            Роль
            <input className="oc-input" value={user.role === 'admin' ? 'Администратор' : 'Диспетчер'} disabled />
          </label>
          <label className="grid gap-1 text-[12px]">
            Новый пароль (необязательно)
            <input
              className="oc-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className="oc-btn" disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </form>
      </section>
    </div>
  );
};
