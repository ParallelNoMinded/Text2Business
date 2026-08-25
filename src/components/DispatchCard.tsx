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
  isDryRun?: boolean;
  onReject?: () => void;
  onEdit?: () => void;
  onToggleDryRun?: () => void;
}

export const DispatchCard: React.FC<DispatchCardProps> = ({
  result,
  onCommitLive,
  isCommitting,
  commitSuccessMsg,
  theme = 'dark',
  isDryRun = true,
  onReject,
  onEdit,
  onToggleDryRun,
}) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div
        className={`oc-card p-5 text-center text-xs font-mono text-oc-muted`}
      >
        // Ожидание выполнения пайплайна...
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
        return 'bg-oc-success/10 text-oc-success border-oc-success/30';
      case 'UPDATE_TICKET':
        return 'bg-oc-warning/10 text-oc-warning border-oc-warning/30';
      case 'REQUEST_CLARIFICATION':
        return 'bg-oc-accent/10 text-oc-accent border-oc-accent/30';
      case 'ESCALATE_TO_HUMAN':
        return 'bg-oc-ai/10 text-oc-ai border-oc-ai/30';
      default:
        return 'bg-oc-critical/10 text-oc-critical border-oc-critical/30';
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
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono font-medium text-xs border bg-oc-warning/10 text-oc-warning border-oc-warning/30`}
        >
          <AlertTriangle className="h-4 w-4" />
          ТРЕБУЕТСЯ ПОДТВЕРЖДЕНИЕ
        </span>
      );
    }
    return (
      <span
        className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono font-medium text-xs border bg-oc-critical/10 text-oc-critical border-oc-critical/30`}
      >
        <XCircle className="h-4 w-4" />
        ЗАБЛОКИРОВАНО СИСТЕМОЙ ЗАЩИТЫ
      </span>
    );
  };

  return (
    <div
      id="dispatch-decision-card"
      className="oc-card p-5 space-y-4"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-oc-border">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-oc-accent" />
            <h2 className="text-xs font-mono font-medium uppercase tracking-wider text-oc-accent">
              STEP 2 — Decision
            </h2>
          </div>
          <p className="text-xs mt-1 font-sans text-oc-secondary">
            Решение графа состояний на основе извлеченных фактов и сверки с реестром.
          </p>
        </div>

        <div>{getStatusBadge(result.status)}</div>
      </div>

      {/* Main Action & SLA Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Business Action Box */}
        <div
          className={`border rounded-lg p-3 flex flex-col justify-between bg-oc-bg-2 border-oc-border`}
        >
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-oc-accent">
            Рекомендуемое Бизнес-Действие
          </span>
          <div className="my-2">
            <span
              className={`inline-block px-3 py-1.5 rounded-md border text-xs font-semibold font-mono tracking-wider ${getActionBadgeClass(
                result.recommended_action
              )}`}
            >
              {formatActionLabel(result.recommended_action)}
            </span>
          </div>
          <div className="text-[11px] font-mono flex items-center justify-between pt-2 border-t border-oc-border">
            <span className="text-oc-secondary">Уверенность AI:</span>
            <span className="font-mono font-semibold text-oc-accent">
              {Math.round(result.confidence_score * 100)}%
            </span>
          </div>
        </div>

        {/* Matched Asset & Site */}
        <div
          className={`border rounded-lg p-3 space-y-2 bg-oc-bg-2 border-oc-border`}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium uppercase text-oc-accent">
            <Building className="h-3.5 w-3.5 text-oc-accent" />
            <span>Привязка в БД</span>
          </div>
          <div>
            <p className="text-xs font-semibold font-mono text-oc-text">
              {result.matched_site ? (
                `${result.matched_site.customer_name} (${result.matched_site.site_id})`
              ) : (
                <span className="text-oc-warning font-sans font-semibold">Объект не привязан</span>
              )}
            </p>
            <p className="text-[11px] line-clamp-1 mt-0.5 font-sans text-oc-secondary">
              {result.matched_site?.address || 'Необходим запрос уточнения'}
            </p>
          </div>
          <div className="pt-1.5 border-t border-oc-border text-[11px] font-mono flex items-center justify-between">
            <span className="text-oc-secondary">Оборудование:</span>
            <span className="font-mono font-semibold text-oc-accent">
              {result.matched_asset ? result.matched_asset.local_code : 'Не определено'}
            </span>
          </div>
        </div>

        {/* SLA & Deadlines */}
        <div
          className={`border rounded-lg p-3 space-y-2 bg-oc-bg-2 border-oc-border`}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium uppercase text-oc-accent">
            <Clock className="h-3.5 w-3.5 text-oc-accent" />
            <span>SLA и Сроки (Договор)</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-oc-warning font-mono">
              План: {result.matched_contract?.plan || 'Gold (24x7)'}
            </p>
            <p className="text-[11px] mt-0.5 font-mono text-oc-secondary">
              Дедлайн:{' '}
              {result.ticket_payload?.sla_deadline ? (
                <span className="font-mono font-semibold text-oc-accent">
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
          <div className="pt-1.5 border-t border-oc-border text-[11px] font-mono flex items-center justify-between">
            <span className="text-oc-secondary">Неустойка:</span>
            <span className="font-mono text-xs text-oc-critical font-semibold">
              {result.matched_contract?.penalty_per_hour || '50 000 руб./час'}
            </span>
          </div>
        </div>
      </div>

      {/* Decision Rationale */}
      <div
        className={`border rounded-lg p-3 bg-oc-bg-2 border-oc-border`}
      >
        <h3 className="text-[10px] font-mono font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5 text-oc-accent">
          <Shield className="h-3.5 w-3.5 text-oc-accent" />
          STEP 3 — AI Reasoning
        </h3>
        <ul className="space-y-1.5 text-xs font-sans text-oc-text">
          {result.decision_reasoning.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 bg-oc-accent"></span>
              <span className="leading-relaxed">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* AI Customer Reply Draft */}
      <div
        className={`border rounded-lg p-3 bg-oc-bg-2 border-oc-border`}
      >
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-mono font-medium uppercase tracking-wider flex items-center gap-1.5 text-oc-accent">
            <Send className="h-3.5 w-3.5 text-oc-accent" />
            STEP 4 — Response
          </label>
          <button
            type="button"
            onClick={handleCopyReply}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono border rounded-md transition bg-oc-bg-3 hover:bg-oc-hover border-oc-border text-oc-secondary hover:text-oc-text"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-oc-accent" />
                <span className="font-mono text-oc-accent">Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-oc-muted" />
                <span>Копировать</span>
              </>
            )}
          </button>
        </div>
        <div
          className="p-3 border rounded-md text-xs font-sans leading-relaxed bg-oc-bg-3 border-oc-border text-oc-text"
        >
          {result.customer_response_draft}
        </div>
      </div>

      {/* Commit & Execution Actions */}
      <div className="pt-3 border-t border-oc-border flex flex-col gap-3">
        <div className="text-xs text-oc-secondary">
          Режим:{' '}
          <span className="font-mono text-oc-accent">
            {result.is_dry_run || isDryRun ? 'DRY RUN' : 'LIVE'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="commit-live-btn"
            type="button"
            onClick={onCommitLive}
            disabled={isCommitting || !result.ticket_payload}
            className="h-9 px-4 rounded-md bg-oc-success text-white text-xs font-semibold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-oc-success/90 transition-all"
          >
            {isCommitting ? 'Saving…' : 'Approve & Execute'}
          </button>
          <button type="button" onClick={onReject} className="h-9 px-3 rounded-md border border-oc-border text-xs text-oc-secondary hover:text-oc-text hover:bg-oc-hover transition-all">
            Reject
          </button>
          <button type="button" onClick={onEdit} className="h-9 px-3 rounded-md border border-oc-border text-xs text-oc-secondary hover:text-oc-text hover:bg-oc-hover transition-all">
            Edit
          </button>
          <button type="button" onClick={onToggleDryRun} className="h-9 px-3 rounded-md border border-oc-border text-xs font-mono text-oc-accent hover:bg-oc-hover transition-all">
            Dry Run {isDryRun ? 'ON' : 'OFF'}
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
