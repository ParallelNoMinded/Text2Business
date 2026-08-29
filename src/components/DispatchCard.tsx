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

  if (!result) return null;

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
        return 'СОЗДАНИЕ ЗАЯВКИ';
      case 'UPDATE_TICKET':
        return 'ОБНОВЛЕНИЕ ЗАЯВКИ';
      case 'REQUEST_CLARIFICATION':
        return 'ЗАПРОС УТОЧНЕНИЯ';
      case 'ESCALATE_TO_HUMAN':
        return 'ЭСКАЛАЦИЯ ОПЕРАТОРУ';
      case 'REJECT':
        return 'ОТКЛОНЕНИЕ';
      default:
        return action;
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'CREATE_TICKET':
        return isDark
          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
          : 'bg-emerald-100 text-emerald-950 border-emerald-400 font-extrabold';
      case 'UPDATE_TICKET':
        return isDark
          ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
          : 'bg-amber-100 text-amber-950 border-amber-400 font-extrabold';
      case 'REQUEST_CLARIFICATION':
        return isDark
          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
          : 'bg-blue-100 text-blue-950 border-blue-400 font-extrabold';
      case 'ESCALATE_TO_HUMAN':
        return isDark
          ? 'bg-purple-500/10 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
          : 'bg-purple-100 text-purple-950 border-purple-400 font-extrabold';
      default:
        return 'bg-red-500/10 text-red-300 border-red-500/40';
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'AUTO_APPROVED') {
      return (
        <span
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-bold text-xs border ${
            isDark
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'bg-emerald-100 text-emerald-950 border-emerald-400 font-extrabold'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          АВТО-УТВЕРЖДЕНО
        </span>
      );
    }
    if (status === 'REQUIRES_HUMAN_CONFIRMATION') {
      return (
        <span
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-bold text-xs border ${
            isDark
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'bg-amber-100 text-amber-950 border-amber-400 font-extrabold'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          ТРЕБУЕТСЯ ПОДТВЕРЖДЕНИЕ
        </span>
      );
    }
    return (
      <span
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-bold text-xs border ${
          isDark
            ? 'bg-red-950/80 text-red-300 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
            : 'bg-red-100 text-red-950 border-red-400 font-extrabold'
        }`}
      >
        <XCircle className="h-4 w-4" />
        ЗАБЛОКИРОВАНО СИСТЕМОЙ ЗАЩИТЫ
      </span>
    );
  };

  return (
    <div
      id="dispatch-decision-card"
      className={`rounded-2xl p-4 sm:p-5 transition-all border space-y-4 ${
        isDark
          ? 'bg-[#06060e]/90 border-cyan-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white'
          : 'bg-white border-slate-300 shadow-sm text-slate-900'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/30">
        <div>
          <div className="flex items-center space-x-2">
            <Zap className={`h-4 w-4 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
            <h2 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
              2. Принятое решение
            </h2>
          </div>
          <p className={`text-xs mt-0.5 font-sans ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
            Решение графа состояний на основе извлеченных фактов и сверки с реестром.
          </p>
        </div>

        <div>{getStatusBadge(result.status)}</div>
      </div>

      {/* Main Action & SLA Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* Business Action Box */}
        <div
          className={`border rounded-xl p-3 flex flex-col justify-between shadow-inner ${
            isDark
              ? 'bg-[#020204]/90 border-cyan-500/20'
              : 'bg-slate-50 border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
            Рекомендуемое Бизнес-Действие
          </span>
          <div className="my-2">
            <span
              className={`inline-block px-3 py-1.5 rounded-lg border text-xs font-extrabold font-mono tracking-wider ${getActionBadgeClass(
                result.recommended_action
              )}`}
            >
              {formatActionLabel(result.recommended_action)}
            </span>
          </div>
          <div className="text-[11px] font-mono flex items-center justify-between pt-2 border-t border-slate-700/20">
            <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Уверенность AI:</span>
            <span className={`font-mono font-extrabold ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
              {Math.round(result.confidence_score * 100)}%
            </span>
          </div>
        </div>

        {/* Matched Asset & Site */}
        <div
          className={`border rounded-xl p-3 space-y-1.5 shadow-inner ${
            isDark
              ? 'bg-[#020204]/90 border-cyan-500/20'
              : 'bg-slate-50 border-slate-300'
          }`}
        >
          <div className={`flex items-center space-x-1.5 text-[10px] font-mono font-bold uppercase ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
            <Building className={`h-3.5 w-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
            <span>Привязка в БД</span>
          </div>
          <div>
            <p className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {result.matched_site ? (
                `${result.matched_site.customer_name} (${result.matched_site.site_id})`
              ) : (
                <span className="text-amber-600 font-sans font-bold">Объект не привязан</span>
              )}
            </p>
            <p className={`text-[11px] line-clamp-1 mt-0.5 font-sans ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
              {result.matched_site?.address || 'Необходим запрос уточнения'}
            </p>
          </div>
          <div className="pt-1.5 border-t border-slate-700/20 text-[11px] font-mono flex items-center justify-between">
            <span className={isDark ? 'text-slate-300' : 'text-slate-700 font-semibold'}>Оборудование:</span>
            <span className={`font-mono font-extrabold ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
              {result.matched_asset ? result.matched_asset.local_code : 'Не определено'}
            </span>
          </div>
        </div>

        {/* SLA & Deadlines */}
        <div
          className={`border rounded-xl p-3 space-y-1.5 shadow-inner ${
            isDark
              ? 'bg-[#020204]/90 border-cyan-500/20'
              : 'bg-slate-50 border-slate-300'
          }`}
        >
          <div className={`flex items-center space-x-1.5 text-[10px] font-mono font-bold uppercase ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
            <Clock className={`h-3.5 w-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
            <span>Уровень сервиса и срок ответа по договору</span>
          </div>
          <div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
              План: {result.matched_contract?.plan || 'Gold (24x7)'}
            </p>
            <p className={`text-[11px] mt-0.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>
              Срок ответа:{' '}
              {result.ticket_payload?.sla_deadline ? (
                <span className={`font-mono font-extrabold ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
                  {new Date(result.ticket_payload.sla_deadline).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              ) : (
                'Не вычисляется'
              )}
            </p>
          </div>
          <div className="pt-1.5 border-t border-slate-700/20 text-[11px] font-mono flex items-center justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-semibold'}>Неустойка:</span>
            <span className="font-mono text-xs text-rose-600 dark:text-rose-400 font-extrabold">
              {result.matched_contract?.penalty_per_hour || '50 000 руб./час'}
            </span>
          </div>
        </div>
      </div>

      {/* Decision Rationale */}
      <div
        className={`border rounded-xl p-3 ${
          isDark
            ? 'bg-[#020204]/80 border-cyan-500/20'
            : 'bg-slate-50 border-slate-300'
        }`}
      >
        <h3 className={`text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
          <Shield className={`h-3.5 w-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
          Аргументация Движка Принятия Решений
        </h3>
        <ul className={`space-y-1 text-xs font-sans ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
          {result.decision_reasoning.map((reason, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${isDark ? 'bg-cyan-300' : 'bg-[#398e8b]'}`}></span>
              <span className="leading-relaxed">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* AI Customer Reply Draft */}
      <div
        className={`border rounded-xl p-3 ${
          isDark
            ? 'bg-[#020204]/80 border-cyan-500/20'
            : 'bg-slate-50 border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <label className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
            <Send className={`h-3.5 w-3.5 ${isDark ? 'text-cyan-400' : 'text-[#398e8b]'}`} />
            Проект ответа клиенту
          </label>
          <button
            type="button"
            onClick={handleCopyReply}
            className={`flex items-center space-x-1 px-2.5 py-1 text-[10px] font-mono border rounded-lg transition ${
              isDark
                ? 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                : 'text-slate-800 hover:text-blue-950 bg-white hover:bg-slate-100 border-slate-300 font-bold'
            }`}
          >
            {copied ? (
              <>
                <Check className={`h-3 w-3 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
                <span className={`font-mono ${isDark ? 'text-cyan-400' : 'text-blue-900'}`}>Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-slate-500" />
                <span>Копировать</span>
              </>
            )}
          </button>
        </div>
        <div
          className={`p-3 border rounded-lg text-xs font-sans leading-relaxed ${
            isDark
              ? 'bg-[#080810] border-cyan-500/20 text-slate-200'
              : 'bg-white border-slate-300 text-slate-900 font-medium'
          }`}
        >
          {result.customer_response_draft}
        </div>
      </div>

      {/* Commit & Execution Actions */}
      <div className="pt-2 border-t border-slate-700/30 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>
          Режим выполнения:{' '}
          <span className={`font-mono font-extrabold ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
            {result.is_dry_run ? 'ТЕСТОВЫЙ РЕЖИМ (Черновик)' : 'ЖИВАЯ ЗАПИСЬ (Запись в БД)'}
          </span>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            id="commit-live-btn"
            type="button"
            onClick={onCommitLive}
            disabled={isCommitting || !result.ticket_payload}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-mono font-extrabold uppercase tracking-wider transition ${
              isCommitting || !result.ticket_payload
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                : 'bg-[#29263d] hover:bg-[#29263d] text-white shadow-none'
            }`}
          >
            {isCommitting ? (
              <span>Сохранение в БД...</span>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 fill-current" />
                <span>✅ Подтвердить</span>
              </>
            )}
          </button>
        </div>
      </div>

      {commitSuccessMsg && (
        <div className={`p-3 rounded-xl text-xs font-mono font-extrabold flex items-center gap-2 border ${
          isDark
            ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
            : 'bg-emerald-100 border-emerald-400 text-emerald-950'
        }`}>
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{commitSuccessMsg}</span>
        </div>
      )}
    </div>
  );
};
