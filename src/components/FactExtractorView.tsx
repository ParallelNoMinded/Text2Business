import React, { useState } from 'react';
import { ExtractedFacts, ExtractedFact } from '../types';
import { ChevronDown, Eye, Quote } from 'lucide-react';

interface FactExtractorViewProps {
  facts: ExtractedFacts | null;
  theme?: 'dark' | 'light';
}

export const FactExtractorView: React.FC<FactExtractorViewProps> = ({ facts, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const [showDetails, setShowDetails] = useState(false);

  if (!facts) {
    return (
      <div
        className={`rounded-2xl p-5 text-center text-xs border animate-fadeIn ${
          isDark
            ? 'bg-[#1A1D22] border-[#2C3139] text-slate-500'
            : 'bg-white border-[#E6E8EC] text-slate-600 shadow-sm'
        }`}
      >
        Запустите сценарий — здесь появятся клиент, объект и суть проблемы.
      </div>
    );
  }

  const essentials: Array<{ label: string; item: ExtractedFact }> = [
    { label: 'Клиент', item: facts.customer_name },
    { label: 'Объект', item: facts.site_info },
    { label: 'Оборудование', item: facts.asset_code },
  ];

  const extras: Array<{ label: string; item: ExtractedFact }> = [
    { label: 'Запрошенный срок', item: facts.requested_deadline },
    { label: 'Наличие резерва', item: facts.has_backup },
  ];

  const factMeta = (item: ExtractedFact) => (
    <div className="flex items-center gap-1.5">
      <span
        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
          isDark ? 'bg-white/8 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
        }`}
      >
        {Math.round((item.confidence || 0) * 100)}%
      </span>
      <span className={`text-[9px] uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
        {item.type}
      </span>
    </div>
  );

  return (
    <div
      id="fact-extractor-card"
      className={`rounded-2xl p-4 sm:p-5 border animate-fadeIn ${
        isDark ? 'bg-[#1A1D22] border-[#2C3139] text-white' : 'bg-white border-[#E6E8EC] text-zinc-900 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-zinc-200/40 dark:border-[#2C3139]">
        <div className="flex items-center gap-2">
          <Eye className={`h-4 w-4 ${isDark ? 'text-zinc-400' : 'text-zinc-700'}`} />
          <h2 className="text-xs font-bold uppercase tracking-wider">Извлечённые факты</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
            isDark
              ? 'border-[#3A404A] text-zinc-300 hover:bg-white/5'
              : 'border-[#E6E8EC] text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          {showDetails ? 'Скрыть детали' : 'Подробности'}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {essentials.map(({ label, item }) => (
          <div
            key={label}
            className={`rounded-xl border p-3 transition hover:-translate-y-0.5 ${
              isDark ? 'bg-[#121417] border-[#2C3139]' : 'bg-[#F7F8FA] border-[#E6E8EC]'
            }`}
          >
            <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {label}
            </div>
            <p className="text-sm font-bold leading-snug">{item.value || 'Не обнаружено'}</p>
            {showDetails && <div className="mt-2">{factMeta(item)}</div>}
          </div>
        ))}
      </div>

      <div
        className={`mt-2.5 rounded-xl border p-3 ${
          isDark ? 'bg-[#121417] border-[#2C3139]' : 'bg-[#F7F8FA] border-[#E6E8EC]'
        }`}
      >
        <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          Суть проблемы
        </div>
        <p className="text-sm font-semibold leading-relaxed">
          {facts.problem_summary.value || 'Не обнаружено'}
        </p>
        {facts.symptoms && facts.symptoms.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {facts.symptoms.map((s) => (
              <span
                key={s}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isDark ? 'bg-white/8 text-zinc-200' : 'bg-white border border-[#E6E8EC] text-zinc-700'
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {showDetails && (
        <div className="mt-3 space-y-2.5 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {extras.map(({ label, item }) => (
              <div
                key={label}
                className={`rounded-xl border p-3 ${
                  isDark ? 'bg-[#121417] border-[#2C3139]' : 'bg-[#F7F8FA] border-[#E6E8EC]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    {label}
                  </span>
                  {factMeta(item)}
                </div>
                <p className="text-sm font-semibold">{item.value || 'Не указано'}</p>
              </div>
            ))}
          </div>

          {[facts.customer_name, facts.site_info, facts.asset_code, facts.problem_summary]
            .filter((item) => item.quote)
            .map((item, idx) => (
              <div
                key={`${item.quote}-${idx}`}
                className={`flex items-start gap-2 text-[12px] italic ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}
              >
                <Quote className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>«{item.quote}»</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
