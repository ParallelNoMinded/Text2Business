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
        className={`oc-card p-5 text-center text-xs font-mono ${
          isDark
            ? 'bg-[#06060e]/80 border-cyan-500/20 text-slate-500'
            : 'bg-white border-slate-300 text-slate-700 shadow-sm font-semibold'
        }`}
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
        className={`border rounded-xl p-3 flex flex-col justify-between space-y-2 shadow-inner ${
          isDark
            ? 'bg-[#020204]/90 border-cyan-500/20'
            : 'bg-slate-50 border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
            {label}
          </span>
          <div className="flex items-center space-x-1.5">
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                isHighConf
                  ? isDark
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                    : 'bg-blue-100 text-blue-950 border border-blue-300 font-extrabold'
                  : isDark
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                  : 'bg-amber-100 text-amber-950 border border-amber-300 font-extrabold'
              }`}
            >
              Conf: {confPercent}%
            </span>
            <span
              className={`text-[9px] font-mono px-1 py-0.5 rounded uppercase font-semibold ${
                isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {factItem.type}
            </span>
          </div>
        </div>

        <div>
          <p className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {factItem.value || <span className="text-slate-500 italic font-sans font-normal">Не обнаружено</span>}
          </p>
        </div>

        {factItem.quote && (
          <div className="pt-1.5 border-t border-slate-700/20 flex items-start space-x-1 text-[11px] text-slate-500">
            <Quote className={`h-3 w-3 flex-shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
            <span className="italic line-clamp-1 font-sans">"{factItem.quote}"</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="fact-extractor-card"
      className="oc-card p-4"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/30 mb-3">
        <div className="flex items-center space-x-2">
          <Eye className={`h-4 w-4 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
          <h2 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
            STEP 1 — Extracted Facts
          </h2>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
            isDark
              ? 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
              : 'text-blue-950 bg-blue-50 border-blue-200 font-extrabold'
          }`}
        >
          Структурированный вывод
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {renderFactCard('Заказчик / Клиент', facts.customer_name)}
        {renderFactCard('Объект / Адрес', facts.site_info)}
        {renderFactCard('Код Оборудования', facts.asset_code)}
        {renderFactCard('Суть Проблемы', facts.problem_summary)}
        {renderFactCard('Запрошенный Срок', facts.requested_deadline)}
        {renderFactCard('Наличие Резерва', facts.has_backup)}
      </div>

      {facts.symptoms && facts.symptoms.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-700/20 flex items-center space-x-2 text-xs">
          <span className={`font-mono font-bold text-[11px] ${isDark ? 'text-slate-400' : 'text-blue-950'}`}>Симптомы поломки:</span>
          <div className="flex flex-wrap gap-1.5">
            {facts.symptoms.map((s, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded-full border text-[11px] font-mono font-bold ${
                  isDark
                    ? 'bg-[#020204] border-cyan-500/30 text-cyan-300'
                    : 'bg-blue-50 border-blue-200 text-blue-950'
                }`}
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
