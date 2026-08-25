import React from 'react';
import { ExtractedFacts } from '../types';
import { Eye, Quote } from 'lucide-react';

interface FactExtractorViewProps {
  facts: ExtractedFacts | null;
  theme?: 'dark' | 'light';
}

export const FactExtractorView: React.FC<FactExtractorViewProps> = ({ facts, theme = 'dark' }) => {
  const isDark = theme === 'dark';

  if (!facts) {
    return (
      <div
        className="oc-card p-5 text-center text-xs font-mono text-oc-muted"
      >
        // Ожидание запуска пайплайна для извлечения фактов LLM (Structured Output)...
      </div>
    );
  }

  const renderFactCard = (
    label: string,
    factItem: { value: string | null; quote?: string | null; confidence: number; type: string }
  ) => {
    const confPercent = Math.round((factItem.confidence || 0) * 100);
    const isHighConf = confPercent >= 85;

    return (
      <div
        className="border rounded-lg p-3 flex flex-col justify-between space-y-2 bg-oc-bg-2 border-oc-border"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-oc-accent">
            {label}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                isHighConf
                  ? 'bg-oc-accent/10 text-oc-accent border border-oc-accent/30'
                  : 'bg-oc-warning/10 text-oc-warning border border-oc-warning/30'
              }`}
            >
              Conf: {confPercent}%
            </span>
            <span
              className="text-[9px] font-mono px-1 py-0.5 rounded uppercase font-medium bg-oc-bg-3 text-oc-muted"
            >
              {factItem.type}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold font-mono text-oc-text">
            {factItem.value || <span className="text-oc-muted italic font-sans font-normal">Не обнаружено</span>}
          </p>
        </div>

        {factItem.quote && (
          <div className="pt-1.5 border-t border-oc-border flex items-start gap-1 text-[11px] text-oc-muted">
            <Quote className="h-3 w-3 flex-shrink-0 mt-0.5 text-oc-accent" />
            <span className="italic line-clamp-1 font-sans">"{factItem.quote}"</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="fact-extractor-card"
      className="oc-card p-5"
    >
      <div className="flex items-center justify-between pb-4 border-b border-oc-border mb-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-oc-accent" />
          <h2 className="text-xs font-mono font-medium uppercase tracking-wider text-oc-accent">
            STEP 1 — Extracted Facts
          </h2>
        </div>
        <span
          className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-md border bg-oc-accent/10 text-oc-accent border-oc-accent/30"
        >
          Структурированный вывод
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {renderFactCard('Заказчик / Клиент', facts.customer_name)}
        {renderFactCard('Объект / Адрес', facts.site_info)}
        {renderFactCard('Код Оборудования', facts.asset_code)}
        {renderFactCard('Суть Проблемы', facts.problem_summary)}
        {renderFactCard('Запрошенный Срок', facts.requested_deadline)}
        {renderFactCard('Наличие Резерва', facts.has_backup)}
      </div>

      {facts.symptoms && facts.symptoms.length > 0 && (
        <div className="mt-4 pt-3 border-t border-oc-border flex items-center gap-2 text-xs">
          <span className="font-mono font-medium text-[11px] text-oc-secondary">Симптомы поломки:</span>
          <div className="flex flex-wrap gap-1.5">
            {facts.symptoms.map((s, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full border text-[11px] font-mono font-medium bg-oc-bg-3 border-oc-border text-oc-accent"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
