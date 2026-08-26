import React from 'react';
import { ExtractedFacts } from '../types';
import { Eye, Quote } from 'lucide-react';

interface FactExtractorViewProps {
  facts: ExtractedFacts | null;
  theme?: 'dark' | 'light';
}

export const FactExtractorView: React.FC<FactExtractorViewProps> = ({ facts, theme = 'light' }) => {
  const isDark = theme === 'dark';

  if (!facts) {
    return null;
  }

  const renderFactCard = (
    label: string,
    factItem: { value: string | null; quote?: string | null; confidence: number; type: string }
  ) => {
    const confPercent = Math.round((factItem.confidence || 0) * 100);

    return (
      <div
        className={`border rounded-xl p-3.5 flex flex-col justify-between space-y-2 ${
          isDark
            ? 'border-slate-700 bg-[#1c1a2e]'
            : 'border-[#e0e0e0] bg-[#fafafa]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
            {label}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
              confPercent >= 85
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}
          >
            {confPercent}%
          </span>
        </div>

        <div>
          <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>
            {factItem.value || <span className="text-xs font-medium text-slate-400">Не обнаружено</span>}
          </p>
        </div>

        {factItem.quote && (
          <div className="pt-1.5 border-t border-slate-700/20 flex items-start space-x-1 text-[11px] text-slate-500">
            <Quote className="h-3 w-3 flex-shrink-0 mt-0.5 text-[#2D7A7A]" />
            <span className="italic line-clamp-1 font-sans">"{factItem.quote}"</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="fact-extractor-card"
      className={`rounded-xl p-5 sm:p-6 border transition-all ${
        isDark ? 'border-slate-700 bg-[#242438]' : 'border-[#c8c8c8] bg-white'
      }`}
    >
      <div className={`flex items-center justify-between pb-4 border-b mb-4 ${isDark ? 'border-slate-700' : 'border-[#e0e0e0]'}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D7A7A]/15 text-[#2D7A7A]">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold">Извлеченные факты</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
              Сущности, выделенные NER-моделью
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#2D7A7A] px-2.5 py-1 rounded-lg bg-[#2D7A7A]/10">
          Structured Output
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {renderFactCard('Организация (Клиент)', facts.customer_name)}
        {renderFactCard('Объект / Адрес', facts.site_info)}
        {renderFactCard('Оборудование / Asset', facts.asset_code)}
        {renderFactCard('Суть неисправности', facts.problem_summary)}
        {renderFactCard('Срочность / Дедлайн', facts.requested_deadline)}
        {renderFactCard('Резервное оборудование', facts.has_backup)}
      </div>
    </div>
  );
};
