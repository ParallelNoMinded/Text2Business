import React, { useState } from 'react';
import { ProcessingResult } from '../types';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

interface DispatchCardProps {
  result: ProcessingResult | null;
  onCommitLive: () => void;
  isCommitting: boolean;
  commitSuccessMsg: string | null;
  theme?: 'dark' | 'light';
}

export const DispatchCard: React.FC<DispatchCardProps> = ({
  result,
  onCommitLive,
  isCommitting,
  commitSuccessMsg,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  if (!result) {
    return null;
  }

  const handleCopyReply = () => {
    if (result.customer_response_draft) {
      navigator.clipboard.writeText(result.customer_response_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'AUTO_APPROVED') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-[#10B981]/15 text-[#10B981]">
          <CheckCircle className="h-3.5 w-3.5" />
          Авто-утверждено
        </span>
      );
    }
    if (status === 'REQUIRES_HUMAN_CONFIRMATION') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-[#F59E0B]/15 text-[#D97706]">
          <AlertTriangle className="h-3.5 w-3.5" />
          Требует диспетчера
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-rose-500/15 text-rose-600">
        <XCircle className="h-3.5 w-3.5" />
        Отклонено
      </span>
    );
  };

  return (
    <div
      id="dispatch-decision-card"
      className={`rounded-xl p-5 sm:p-6 border transition-all ${
        isDark ? 'border-slate-700 bg-[#242438]' : 'border-[#c8c8c8] bg-white'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-700' : 'border-[#e0e0e0]'}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D7A7A]/15 text-[#2D7A7A]">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold">Решение AI-Диспетчера</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
              Автоматическая классификация и маршрутизация
            </p>
          </div>
        </div>
        {getStatusBadge(result.decision_status)}
      </div>

      {/* Grid of decision attributes */}
      <div className="my-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#e0e0e0] bg-[#fafafa]'}`}>
          <span className={`block text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>ID Заявки</span>
          <span className="text-sm font-black mt-0.5 block">{result.ticket_payload?.ticket_id || 'T-NEW'}</span>
        </div>
        <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#e0e0e0] bg-[#fafafa]'}`}>
          <span className={`block text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>Приоритет</span>
          <span className="text-sm font-black text-rose-500 mt-0.5 block">{result.ticket_payload?.priority || 'CRITICAL'}</span>
        </div>
        <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#e0e0e0] bg-[#fafafa]'}`}>
          <span className={`block text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>Группа</span>
          <span className="text-sm font-bold mt-0.5 block truncate">{result.ticket_payload?.assigned_group || 'Холод-МСК'}</span>
        </div>
        <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#e0e0e0] bg-[#fafafa]'}`}>
          <span className={`block text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>SLA Дедлайн</span>
          <span className="text-sm font-bold mt-0.5 block">{result.ticket_payload?.sla_deadline ? new Date(result.ticket_payload.sla_deadline).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
        </div>
      </div>

      {/* Explanation & Customer Response Draft */}
      <div className="space-y-3">
        {result.decision_reasoning && result.decision_reasoning.length > 0 && (
          <div className={`p-4 rounded-xl border text-xs ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#e0e0e0] bg-slate-50'}`}>
            <span className={`block font-extrabold mb-1.5 ${isDark ? 'text-slate-300' : 'text-black'}`}>Обоснование решения:</span>
            <ul className={`space-y-1 ${isDark ? 'text-slate-400' : 'text-[#475569]'}`}>
              {result.decision_reasoning.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#2D7A7A] mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.customer_response_draft && (
          <div className={`p-4 rounded-xl border text-xs ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#e0e0e0] bg-slate-50'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`font-extrabold ${isDark ? 'text-slate-300' : 'text-black'}`}>Проект ответа клиенту:</span>
              <button
                type="button"
                onClick={handleCopyReply}
                className="flex items-center gap-1 text-[11px] font-bold text-[#2d7a7a] hover:underline"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
            <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-[#111827]'}`}>{result.customer_response_draft}</p>
          </div>
        )}
      </div>

      {/* Action Commit Button */}
      <div className={`mt-5 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'border-slate-700' : 'border-[#e0e0e0]'}`}>
        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
          {commitSuccessMsg ? <span className="text-emerald-500 font-bold">{commitSuccessMsg}</span> : 'Готово для записи в реестр и передачи сервисной бригаде'}
        </span>
        <button
          type="button"
          onClick={onCommitLive}
          disabled={isCommitting}
          className="w-full sm:w-auto h-[44px] px-6 rounded-xl bg-[#2D7A7A] hover:bg-[#236565] text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition"
        >
          <CheckCircle className="h-4 w-4" />
          <span>Подтвердить и создать в БД</span>
        </button>
      </div>
    </div>
  );
};
