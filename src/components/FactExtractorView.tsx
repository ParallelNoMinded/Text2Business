import React from 'react';
import { ExtractedFacts } from '../types';

// Строки, которые разбор подставляет вместо пустого поля. В бланке они не
// должны выглядеть как извлечённые сведения.
const BLANK_VALUES = new Set([
  'null',
  'undefined',
  'не указано',
  'не указан',
  'не определено',
  'нет данных',
  'n/a',
  '-',
  '—',
]);

interface FactExtractorViewProps {
  facts: ExtractedFacts | null;
  theme?: 'dark' | 'light';
}

export const FactExtractorView: React.FC<FactExtractorViewProps> = ({ facts }) => {
  if (!facts) {
    return (
      <div className="sheet p-5">
        <div className="border border-dashed border-rule p-5 text-center font-mono text-xs leading-relaxed text-ink-3">
          Разобранные сведения появятся здесь после первого обращения.
        </div>
      </div>
    );
  }

  const renderFactRow = (
    label: string,
    factItem: { value: string | null; quote?: string | null; confidence: number; type: string }
  ) => {
    // Разбор иногда возвращает не пустое поле, а строку-заглушку ("null",
    // "не указано"). В бланке такая строка выглядела как извлечённый факт.
    const raw = (factItem.value ?? '').trim();
    const isBlank = raw === '' || BLANK_VALUES.has(raw.toLowerCase());

    const confPercent = Math.round((factItem.confidence || 0) * 100);
    const isUncertain = !isBlank && confPercent < 85;

    // Цитата совпадает со значением — источник не показан, дублировать нечего.
    const quote = (factItem.quote ?? '').trim();
    const hasQuote = quote !== '' && quote !== raw;

    return (
      <div className="border-b border-rule py-2.5 last:border-b-0">
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-sm font-semibold text-ink-2">{label}</span>
          {isBlank && (
            <span
              className="font-sans text-sm font-semibold text-ink-2"
              title="В тексте обращения этих сведений нет — запросите у заказчика"
            >
              нет в обращении
            </span>
          )}
          {isUncertain && (
            <span
              className="font-mono text-[10px] tabular-nums text-attention"
              title="Требует проверки диспетчером"
            >
              под вопросом · {confPercent}%
            </span>
          )}
        </div>

        {/* Значение вписано в графу — как от руки в бланк */}
        <p className={`mt-1 text-base leading-relaxed ${isBlank ? 'text-ink-3' : 'text-ink'}`}>
          {isBlank ? '—' : raw}
        </p>

        {hasQuote && (
          <p className="mt-1 truncate border-l border-rule pl-2 text-[11px] italic leading-relaxed text-ink-3">
            {quote}
          </p>
        )}
      </div>
    );
  };

  return (
    <div id="fact-extractor-card" className="sheet p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
        <h2 className="text-lg font-bold text-ink">
          <span className="text-ink-3">1 · </span>Разобранные сведения
        </h2>
        <span className="font-sans text-sm font-semibold text-ink-2">
          из текста обращения
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2 lg:grid-cols-3">
        {renderFactRow('Заказчик', facts.customer_name)}
        {renderFactRow('Объект и адрес', facts.site_info)}
        {renderFactRow('Код оборудования', facts.asset_code)}
        {renderFactRow('Суть обращения', facts.problem_summary)}
        {renderFactRow('Запрошенный срок', facts.requested_deadline)}
        {renderFactRow('Наличие резерва', facts.has_backup)}
      </div>

      {facts.symptoms && facts.symptoms.length > 0 && (
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-rule pt-2.5">
          <span className="font-sans text-sm font-semibold text-ink-2">Признаки:</span>
          <span className="text-xs leading-relaxed text-ink-2">{facts.symptoms.join(' · ')}</span>
        </div>
      )}
    </div>
  );
};
