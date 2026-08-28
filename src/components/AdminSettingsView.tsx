import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { PageSection } from './layout/PageSection';

interface SlaSettings {
  Gold: number;
  Silver: number;
  Standard: number;
}

export const AdminSettingsView: React.FC = () => {
  const [sla, setSla] = useState<SlaSettings>({ Gold: 60, Silver: 240, Standard: 480 });
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/admin/sla')
      .then((r) => r.json())
      .then((data) => {
        if (data.sla) setSla(data.sla);
        if (data.error) setError(data.error);
      })
      .catch((err) => setError(err.message));
  }, []);

  const saveSla = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const res = await apiFetch('/api/admin/sla', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sla }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Не удалось сохранить SLA.');
      return;
    }
    if (data.sla) setSla(data.sla);
    setMsg('SLA обновлён для договоров в реестре.');
  };

  return (
    <div className="grid gap-3">
      <PageSection title="Настройки" description="SLA и параметры стенда." />
      {error && <p className="text-[12px] text-[var(--status-danger)]">{error}</p>}
      {msg && <p className="text-[12px] text-[var(--status-success)]">{msg}</p>}

      <section className="oc-card p-4">
        <h2 className="oc-section-title mb-2">Нормативы SLA (минуты)</h2>
        <form className="grid max-w-md gap-2" onSubmit={saveSla}>
          {(['Gold', 'Silver', 'Standard'] as const).map((plan) => (
            <label key={plan} className="grid gap-1 text-[12px]">
              {plan}
              <input
                className="oc-input"
                type="number"
                min={15}
                value={sla[plan]}
                onChange={(e) => setSla({ ...sla, [plan]: Number(e.target.value) || sla[plan] })}
              />
            </label>
          ))}
          <button type="submit" className="oc-btn">
            Сохранить SLA
          </button>
        </form>
      </section>

      <section className="oc-card p-4 text-[12px]">
        <h2 className="oc-section-title mb-2">Интеграции</h2>
        <p className="text-[var(--oc-muted)]">
          Telegram, почта, голос и REST настраиваются в разделе «Каналы». Токен GitHub Models — кнопка «Токен» в шапке.
          Эмулятор 1С: <span className="font-mono">/api/1c/tickets</span>.
        </p>
      </section>
    </div>
  );
};
