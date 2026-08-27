import React from 'react';
import { ExtractedFacts, ExtractedFact } from '../types';
import { StatusBadge } from './ui/StatusBadge';

interface FactExtractorViewProps {
  facts: ExtractedFacts | null;
  theme?: 'dark' | 'light';
}

function sourceLabel(type: string): string {
  if (type === 'fact') return 'ФАКТ';
  if (type === 'inference') return 'ВЫВОД';
  if (type === 'database') return 'БД';
  return type.toUpperCase();
}

function FactRow({ label, fact }: { label: string; fact: ExtractedFact }) {
  const conf = Math.round((fact.confidence || 0) * 100);
  const tone = !fact.value ? 'neutral' : conf >= 85 ? 'success' : conf >= 50 ? 'warning' : 'danger';
  return (
    <div className="grid grid-cols-[7rem_1fr_3.25rem_5.5rem] items-start gap-2 border-b border-[var(--oc-border)] py-1.5 last:border-0">
      <span className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">{label}</span>
      <span className="min-w-0 truncate text-[12px]" title={fact.value || undefined}>
        {fact.value || '—'}
      </span>
      <span className="text-right font-mono text-[11px] tabular-nums text-[var(--oc-muted)]">{conf}%</span>
      <StatusBadge tone={tone} label={fact.value ? sourceLabel(fact.type) : 'НЕТ'} />
    </div>
  );
}

export const FactExtractorView: React.FC<FactExtractorViewProps> = ({ facts }) => {
  return (
    <section id="fact-extractor-card" className="oc-card" aria-label="Извлечённые факты">
      <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
        <h2 className="oc-section-title">Извлечённые факты</h2>
        <StatusBadge tone={facts ? 'info' : 'neutral'} label={facts ? 'ИИ' : 'ОЖИДАНИЕ'} />
      </div>
      <div className="px-3 py-1">
        {!facts && (
          <p className="py-4 text-center text-[11px] text-[var(--oc-muted)]">Ожидание извлечения фактов…</p>
        )}
        {facts && (
          <>
            <div className="grid grid-cols-[7rem_1fr_3.25rem_5.5rem] gap-2 pb-1 text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">
              <span>Поле</span>
              <span>Значение</span>
              <span className="text-right">Увер.</span>
              <span>Источник</span>
            </div>
            <FactRow label="Клиент" fact={facts.customer_name} />
            <FactRow label="Объект / адрес" fact={facts.site_info} />
            <FactRow label="Оборудование" fact={facts.asset_code} />
            <FactRow label="Проблема" fact={facts.problem_summary} />
            <FactRow label="Срок" fact={facts.requested_deadline} />
            <FactRow label="Резерв" fact={facts.has_backup} />
            <div className="grid grid-cols-[7rem_1fr] items-start gap-2 py-1.5">
              <span className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Симптомы</span>
              <span className="text-[12px]">{facts.symptoms?.length ? facts.symptoms.join(' · ') : '—'}</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
