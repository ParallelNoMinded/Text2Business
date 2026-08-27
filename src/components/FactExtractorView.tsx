import React, { useEffect, useState } from 'react';
import { ExtractedFacts } from '../types';
import { Eye, Quote } from 'lucide-react';

interface FactExtractorViewProps {
  facts: ExtractedFacts | null;
  theme?: 'dark' | 'light';
  onFactsChange?: (facts: ExtractedFacts) => void;
}

export const FactExtractorView: React.FC<FactExtractorViewProps> = ({ facts, theme = 'dark', onFactsChange }) => {
  const isDark = theme === 'dark';
  const [editableValues, setEditableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!facts) return;

    setEditableValues({
      customer_name: facts.customer_name?.value || '',
      site_info: facts.site_info?.value || '',
      asset_code: facts.asset_code?.value || '',
      problem_summary: facts.problem_summary?.value || '',
      requested_deadline: facts.requested_deadline?.value || '',
      has_backup: facts.has_backup?.value || '',
    });
  }, [facts]);

  // Sync edited values back to parent when facts change
  useEffect(() => {
    if (!facts || !onFactsChange) return;
    const hasChanges = Object.keys(editableValues).some(
      (key) => editableValues[key] !== (facts[key as keyof ExtractedFacts] as any)?.value
    );
    if (!hasChanges) return;

    const updatedFacts: ExtractedFacts = {
      ...facts,
      customer_name: { ...facts.customer_name, value: editableValues.customer_name || null },
      site_info: { ...facts.site_info, value: editableValues.site_info || null },
      asset_code: { ...facts.asset_code, value: editableValues.asset_code || null },
      problem_summary: { ...facts.problem_summary, value: editableValues.problem_summary || null },
      requested_deadline: { ...facts.requested_deadline, value: editableValues.requested_deadline || null },
      has_backup: { ...facts.has_backup, value: editableValues.has_backup || null },
    };
    onFactsChange(updatedFacts);
  }, [editableValues]);

  if (!facts) {
    return (
      <div
        className={`rounded-2xl p-5 text-center text-xs font-mono border transition-all ${
          isDark
            ? 'bg-[#1C1B1B] border-[#2A2A2A] text-slate-500'
            : 'bg-white border-slate-300 text-slate-700 shadow-sm font-semibold'
        }`}
      >
        // Ожидание запуска пайплайна для извлечения фактов LLM (Structured Output)...
      </div>
    );
  }

  const renderFactCard = (
    label: string,
    factKey: keyof ExtractedFacts,
    factItem: { value: string | null; quote?: string | null; confidence: number; type: string }
  ) => {
    const confPercent = Math.round((factItem.confidence || 0) * 100);
    const isHighConf = confPercent >= 85;

    return (
      <div
        className={`border rounded-xl p-3 flex flex-col justify-between space-y-2 shadow-inner ${
          isDark
            ? 'bg-[#222222] border-[#2A2A2A]'
            : 'bg-slate-50 border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-blue-950'}`}>
            {label}
          </span>
          <div className="flex items-center space-x-1.5">
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                isHighConf
                  ? isDark
                    ? 'bg-[#222222] text-slate-300 border border-[#2A2A2A]'
                    : 'bg-blue-100 text-blue-950 border border-blue-300 font-extrabold'
                  : isDark
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
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
          <input
            data-inputbox="true"
            aria-label={label}
            value={editableValues[factKey] ?? factItem.value ?? ''}
            onChange={(event) =>
              setEditableValues((prev) => ({
                ...prev,
                [factKey]: event.target.value,
              }))
            }
            className={`input-box w-full rounded-xl border px-3 py-2 text-sm font-bold font-mono outline-none transition ${
              isDark
                ? 'border-[#2A2A2A] bg-[#1C1B1B] text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20'
                : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
            }`}
            placeholder="Введите значение"
          />
        </div>

        {factItem.quote && (
          <div className={`pt-1.5 border-t flex items-start space-x-1 text-[11px] ${isDark ? 'border-slate-700/20 text-slate-500' : 'border-slate-200 text-slate-600'}`}>
            <Quote className={`h-3 w-3 flex-shrink-0 mt-0.5 ${isDark ? 'text-slate-400' : 'text-blue-900'}`} />
            <span className="italic line-clamp-1 font-sans">"{factItem.quote}"</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="fact-extractor-card"
      className={`rounded-2xl p-4 sm:p-5 transition-all border ${
        isDark
          ? 'bg-[#1C1B1B] border-[#2A2A2A] shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white'
          : 'bg-white border-slate-300 shadow-sm text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/30 mb-3">
        <div className="flex items-center space-x-2">
          <Eye className={`h-4 w-4 ${isDark ? 'text-slate-300' : 'text-blue-900'}`} />
          <h2 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-blue-950'}`}>
            1. Извлеченные факты
          </h2>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
            isDark
              ? 'text-slate-300 bg-[#222222] border-[#2A2A2A]'
              : 'text-blue-950 bg-blue-50 border-blue-200 font-extrabold'
          }`}
        >
          InputBox
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {renderFactCard('Заказчик / Клиент', 'customer_name', facts.customer_name)}
        {renderFactCard('Объект / Адрес', 'site_info', facts.site_info)}
        {renderFactCard('Код Оборудования', 'asset_code', facts.asset_code)}
        {renderFactCard('Суть Проблемы', 'problem_summary', facts.problem_summary)}
        {renderFactCard('Запрошенный Срок', 'requested_deadline', facts.requested_deadline)}
        {renderFactCard('Наличие Резерва', 'has_backup', facts.has_backup)}
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
                      ? 'bg-[#1C1B1B] border-[#2A2A2A] text-slate-300'
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
