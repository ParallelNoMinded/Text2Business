import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { PageSection } from './layout/PageSection';

interface AnalyticsPayload {
  openTickets: number;
  closedTickets: number;
  waitingDispatcher: number;
  users: { total: number; dispatchers: number; admins: number; blocked: number };
  error?: string;
}

export const AdminAnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/admin/analytics')
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) setError(json.error || 'Нет доступа к аналитике.');
        else setData(json);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="grid gap-3">
      <PageSection title="Аналитика" description="Сводка по заявкам и пользователям. Только для администратора." />
      {error && <p className="text-[12px] text-[var(--status-danger)]">{error}</p>}
      {data && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {[
            ['Открытые заявки', data.openTickets],
            ['Закрытые', data.closedTickets],
            ['Ждут диспетчера', data.waitingDispatcher],
            ['Пользователи', data.users.total],
            ['Диспетчеры', data.users.dispatchers],
            ['Заблокированы', data.users.blocked],
          ].map(([label, value]) => (
            <div key={String(label)} className="oc-kpi">
              <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">{label}</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
