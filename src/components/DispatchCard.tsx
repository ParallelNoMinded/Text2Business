import React, { useState } from 'react';
import { ProcessingResult } from '../types';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Building,
  Clock,
  Shield,
  Send,
  Zap,
  ChevronDown,
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
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!result) {
    return (
      <div
        className={`rounded-2xl p-5 text-center text-xs border animate-fadeIn ${
          isDark
            ? 'bg-[#1A1D22] border-[#2C3139] text-slate-500'
            : 'bg-white border-[#E6E8EC] text-slate-600 shadow-sm'
        }`}
      >
        Решение появится после прогона.
      </div>
    );
  }

  const handleCopyReply = () => {
    if (result.customer_response_draft) {
      navigator.clipboard.writeText(result.customer_response_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE_TICKET':
        return 'Создание заявки';
      case 'UPDATE_TICKET':
        return 'Обновление заявки';
      case 'REQUEST_CLARIFICATION':
        return 'Запрос уточнения';
      case 'ESCALATE_TO_HUMAN':
        return 'Эскалация оператору';
      case 'REJECT':
        return 'Отклонение';
      default:
        return action;
    }
  };

  const needsConfirm = result.status === 'REQUIRES_HUMAN_CONFIRMATION';
  const autoApproved = result.status === 'AUTO_APPROVED';
  const slaTime = result.ticket_payload?.sla_deadline
    ? new Date(result.ticket_payload.sla_deadline).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      id="dispatch-decision-card"
      className={`rounded-2xl p-4 sm:p-5 border space-y-4 animate-fadeIn ${
        isDark ? 'bg-[#1A1D22] border-[#2C3139] text-white' : 'bg-white border-[#E6E8EC] text-zinc-900 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${isDark ? 'text-zinc-400' : 'text-zinc-700'}`} />
          <h2 className="text-xs font-bold uppercase tracking-wider">Решение</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
              needsConfirm
                ? 'nb-pulse-warn bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800'
                : autoApproved
                ? isDark
                  ? 'bg-zinc-800 text-zinc-200 border-zinc-600'
                  : 'bg-zinc-100 text-zinc-800 border-zinc-300'
                : isDark
                ? 'bg-zinc-800 text-zinc-200 border-zinc-600'
                : 'bg-zinc-100 text-zinc-800 border-zinc-300'
            }`}
          >
            {needsConfirm ? <AlertTriangle className="h-3.5 w-3.5" /> : autoApproved ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {needsConfirm ? 'Нужно подтверждение' : autoApproved ? 'Авто-утверждено' : 'Заблокировано'}
          </span>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div
          className={`rounded-xl border p-3 ${
            isDark ? 'bg-[#121417] border-[#2C3139]' : 'bg-[#F7F8FA] border-[#E6E8EC]'
          }`}
        >
          <div className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Действие
          </div>
          <p className="text-sm font-extrabold">{formatActionLabel(result.recommended_action)}</p>
        </div>

        <div
          className={`rounded-xl border p-3 ${
            isDark ? 'bg-[#121417] border-[#2C3139]' : 'bg-[#F7F8FA] border-[#E6E8EC]'
          }`}
        >
          <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            <Clock className="h-3.5 w-3.5" />
            Дедлайн SLA
          </div>
          <p className="text-sm font-extrabold">{slaTime || 'Не вычисляется'}</p>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {result.matched_contract?.plan || 'Gold'}
          </p>
        </div>

        <div
          className={`rounded-xl border p-3 ${
            isDark ? 'bg-[#121417] border-[#2C3139]' : 'bg-[#F7F8FA] border-[#E6E8EC]'
          }`}
        >
          <div className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Неустойка
          </div>
          <p className="text-sm font-extrabold">{result.matched_contract?.penalty_per_hour || '50 000 руб./час'}</p>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-3 animate-fadeIn">
          <div
            className={`rounded-xl border p-3 ${
              isDark ? 'bg-[#121417] border-[#2C3139]' : 'bg-[#F7F8FA] border-[#E6E8EC]'
            }`}
          >
            <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              <Building className="h-3.5 w-3.5" />
              Привязка в реестре
            </div>
            <p className="text-sm font-bold">
              {result.matched_site
                ? `${result.matched_site.customer_name} (${result.matched_site.site_id})`
                : 'Объект не привязан'}
            </p>
            <p className={`text-[12px] mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {result.matched_site?.address || 'Нужно уточнение'}
            </p>
            <p className="text-[12px] mt-2 font-semibold">
              Оборудование: {result.matched_asset ? result.matched_asset.local_code : 'Не определено'}
            </p>
            <p className={`text-[11px] mt-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Уверенность AI: {Math.round(result.confidence_score * 100)}%
            </p>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              isDark ? 'bg-[#121417] border-[#2C3139]' : 'bg-[#F7F8FA] border-[#E6E8EC]'
            }`}
          >
            <h3 className={`text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              <Shield className="h-3.5 w-3.5" />
              Почему так
            </h3>
            <ul className={`space-y-1 text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {result.decision_reasoning.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 bg-zinc-500" />
                  <span className="leading-relaxed">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              isDark ? 'bg-[#121417] border-[#2C3139]' : 'bg-[#F7F8FA] border-[#E6E8EC]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                <Send className="h-3.5 w-3.5" />
                Черновик ответа клиенту
              </label>
              <button
                type="button"
                onClick={handleCopyReply}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold border rounded-full ${
                  isDark
                    ? 'text-zinc-300 border-white/10 hover:bg-white/5'
                    : 'text-zinc-700 border-[#E6E8EC] bg-white hover:bg-zinc-50'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Копировать
                  </>
                )}
              </button>
            </div>
            <p className="text-xs leading-relaxed">{result.customer_response_draft}</p>
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-zinc-200/50 dark:border-[#2C3139] flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {result.is_dry_run ? 'Тестовый режим — в реестр после подтверждения' : 'Живая запись в БД'}
        </p>
        <button
          id="commit-live-btn"
          type="button"
          onClick={onCommitLive}
          disabled={isCommitting || !result.ticket_payload}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
            isCommitting || !result.ticket_payload
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
              : isDark
              ? 'bg-zinc-200 hover:bg-zinc-100 text-zinc-900'
              : 'bg-zinc-800 hover:bg-zinc-900 text-white'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          {isCommitting ? 'Сохранение…' : 'Подтвердить'}
        </button>
      </div>

      {commitSuccessMsg && (
        <div
          className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border animate-fadeIn ${
            isDark
              ? 'bg-[#52525B]/10 border-[#52525B]/40 text-zinc-200'
              : 'bg-zinc-100 border-zinc-300 text-zinc-800'
          }`}
        >
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{commitSuccessMsg}</span>
        </div>
      )}
    </div>
  );
};
