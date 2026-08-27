import React, { useEffect, useState } from 'react';
import { ProcessingResult, Ticket } from '../types';
import { StatusBadge, StatusTone } from './ui/StatusBadge';
import { Copy, Check } from 'lucide-react';

interface DispatchCardProps {
  result: ProcessingResult | null;
  onCommitLive: (payloadOverride?: Partial<Ticket>) => void;
  onReject?: () => void;
  isCommitting: boolean;
  commitSuccessMsg: string | null;
  theme?: 'dark' | 'light';
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    CREATE_TICKET: 'СОЗДАТЬ ЗАЯВКУ',
    UPDATE_TICKET: 'ОБНОВИТЬ ЗАЯВКУ',
    REQUEST_CLARIFICATION: 'ЗАПРОСИТЬ УТОЧНЕНИЕ',
    ESCALATE_TO_HUMAN: 'ЭСКАЛАЦИЯ ОПЕРАТОРУ',
    REJECT: 'ОТКЛОНИТЬ',
  };
  return map[action] || action;
}

function actionTone(action: string): StatusTone {
  if (action === 'CREATE_TICKET') return 'success';
  if (action === 'UPDATE_TICKET') return 'warning';
  if (action === 'ESCALATE_TO_HUMAN' || action === 'REQUEST_CLARIFICATION') return 'warning';
  return 'danger';
}

export const DispatchCard: React.FC<DispatchCardProps> = ({
  result,
  onCommitLive,
  onReject,
  isCommitting,
  commitSuccessMsg,
}) => {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftApproved, setDraftApproved] = useState(false);
  const [editPriority, setEditPriority] = useState<Ticket['priority']>('medium');

  useEffect(() => {
    setDraft(result?.customer_response_draft || '');
    setDraftApproved(false);
    setEditing(false);
    setEditPriority((result?.ticket_payload?.priority as Ticket['priority']) || 'medium');
  }, [result]);

  if (!result) {
    return (
      <>
        <section className="oc-card px-3 py-6 text-center text-[11px] text-[var(--oc-muted)]">
          Движок решений — ожидание запуска пайплайна.
        </section>
        <section className="oc-card px-3 py-6 text-center text-[11px] text-[var(--oc-muted)]">
          Действие оператора — появится после решения.
        </section>
        <section className="oc-card px-3 py-6 text-center text-[11px] text-[var(--oc-muted)]">
          Черновик ответа — появится после решения.
        </section>
      </>
    );
  }

  const ticketId = result.target_ticket_id || result.ticket_payload?.ticket_id || '—';
  const slaMin = result.matched_contract?.sla_minutes;
  const needsConfirm =
    result.status === 'REQUIRES_HUMAN_CONFIRMATION' || result.status === 'AUTO_APPROVED';
  const statusTone: StatusTone =
    result.status === 'BLOCKED' ? 'danger' : result.status === 'AUTO_APPROVED' ? 'success' : 'warning';
  const statusLabel =
    result.status === 'BLOCKED' ? 'СБОЙ' : result.status === 'AUTO_APPROVED' ? 'ГОТОВО' : 'НА ПРОВЕРКЕ';

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirm = () => {
    onCommitLive({
      priority: editPriority,
      summary: result.ticket_payload?.summary,
      description: draft
        ? `${result.ticket_payload?.description || ''}\n\n[Черновик утверждён]\n${draft}`
        : result.ticket_payload?.description,
    });
  };

  return (
    <>
      <section id="dispatch-decision-card" className="oc-card" aria-label="Движок решений">
        <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">Движок решений</h2>
          <div className="flex items-center gap-1.5">
            {result.is_dry_run && <StatusBadge tone="warning" label="ЧЕРНОВИК" />}
            <StatusBadge tone={statusTone} label={statusLabel} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-3 py-2 text-[12px] sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase text-[var(--oc-muted)]">Рекомендуемое действие</p>
            <StatusBadge tone={actionTone(result.recommended_action)} label={actionLabel(result.recommended_action)} />
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--oc-muted)]">Уверенность</p>
            <p className="font-mono tabular-nums">{Math.round(result.confidence_score * 100)}%</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--oc-muted)]">Клиент</p>
            <p>{result.matched_site?.customer_name || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--oc-muted)]">Оборудование</p>
            <p className="font-mono">{result.matched_asset?.local_code || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--oc-muted)]">Договор</p>
            <p>{result.matched_contract?.plan || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--oc-muted)]">SLA / приоритет</p>
            <p>
              {slaMin ? `${slaMin} мин` : '—'} · {(result.ticket_payload?.priority || 'medium').toUpperCase()}
            </p>
          </div>
        </div>
        <div className="border-t border-[var(--oc-border)] px-3 py-2">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">
            Правила и источники (без цепочки рассуждений модели)
          </p>
          <ul className="space-y-0.5 text-[11px] text-[var(--oc-text)]">
            {result.guardrail_triggered && (
              <li>Защитное правило · {result.guardrail_reason}</li>
            )}
            {result.matched_site && (
              <li>
                Реестр · объект {result.matched_site.site_id} / {result.matched_site.address}
              </li>
            )}
            {result.matched_asset && (
              <li>
                Реестр · оборудование {result.matched_asset.asset_id} ({result.matched_asset.local_code})
              </li>
            )}
            {result.matched_contract && (
              <li>
                Договор · {result.matched_contract.plan}, окно {result.matched_contract.working_hours}
              </li>
            )}
            {result.target_ticket_id && <li>Открытые заявки · дедупликация {result.target_ticket_id}</li>}
            {(result.decision_reasoning || []).slice(0, 4).map((r, i) => (
              <li key={i} className="text-[var(--oc-muted)]">
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="oc-card" aria-label="Действие оператора">
        <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">Требуется подтверждение</h2>
          <StatusBadge
            tone={needsConfirm && result.status !== 'BLOCKED' ? 'warning' : statusTone}
            label={result.status === 'BLOCKED' ? 'СБОЙ' : 'НА ПРОВЕРКЕ'}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 px-3 py-2 text-[12px] sm:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase text-[var(--oc-muted)]">Действие</p>
            <p className="font-medium">{actionLabel(result.recommended_action)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--oc-muted)]">Заявка</p>
            <p className="font-mono">{ticketId}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--oc-muted)]">Приоритет</p>
            {editing ? (
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Ticket['priority'])}
                className="h-7 rounded border border-[var(--oc-border)] bg-[var(--oc-bg)] text-xs"
              >
                <option value="low">низкий</option>
                <option value="medium">средний</option>
                <option value="high">высокий</option>
                <option value="critical">критичный</option>
              </select>
            ) : (
              <p className="uppercase">{editPriority}</p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--oc-muted)]">SLA</p>
            <p>{slaMin ? `${slaMin} мин` : '—'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-[var(--oc-border)] px-3 py-2">
          <button
            id="commit-live-btn"
            type="button"
            onClick={confirm}
            disabled={isCommitting || !result.ticket_payload || result.status === 'BLOCKED'}
            className="rounded-md bg-[var(--status-success-soft)] px-3 py-1 text-[12px] font-medium text-[var(--status-success)] hover:opacity-90 disabled:opacity-50"
          >
            {isCommitting ? 'Сохранение…' : 'Подтвердить'}
          </button>
          <button
            type="button"
            onClick={onReject}
            className="rounded-md bg-[var(--status-danger-soft)] px-3 py-1 text-[12px] font-medium text-[var(--status-danger)] hover:opacity-90"
          >
            Отклонить
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-md border border-[var(--oc-border)] px-3 py-1 text-[12px] hover:bg-[var(--oc-surface-2)]"
          >
            {editing ? 'Закрепить' : 'Изменить'}
          </button>
        </div>
        {commitSuccessMsg && (
          <p className="border-t border-[var(--oc-border)] px-3 py-2 text-[11px] text-[var(--oc-muted)]">{commitSuccessMsg}</p>
        )}
      </section>

      <section className="oc-card" aria-label="Ответ клиенту">
        <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">Ответ клиенту</h2>
          {draftApproved && <StatusBadge tone="success" label="УТВЕРЖДЁН" />}
        </div>
        <div className="px-3 py-2">
          <textarea
            rows={4}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setDraftApproved(false);
            }}
            className="w-full resize-none rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] p-2 text-xs leading-relaxed"
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--oc-border)] px-2 py-1 text-[11px] hover:bg-[var(--oc-surface-2)]"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
            <button
              type="button"
              onClick={() => setDraft(result.customer_response_draft)}
              className="rounded-md border border-[var(--oc-border)] px-2 py-1 text-[11px] hover:bg-[var(--oc-surface-2)]"
            >
              Сбросить черновик
            </button>
            <button
              type="button"
              onClick={() => setDraftApproved(true)}
              className="rounded-md bg-[var(--oc-accent-soft)] px-2 py-1 text-[11px] text-[var(--oc-accent)]"
            >
              Утвердить
            </button>
          </div>
        </div>
      </section>
    </>
  );
};
