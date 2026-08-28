import React, { useEffect, useRef } from 'react';
import { Send, RefreshCw, X, FileCheck } from 'lucide-react';
import { Ticket } from '../types';
import { formatFieldLabels } from '../fieldLabels';

/**
 * Бланк уточнения по заявке: переписка с клиентом и подтверждение данных.
 *
 * Компонент презентационный — вся работа с сетью и откатами остаётся
 * в рабочем месте диспетчера. Здесь только бланк, ловушка фокуса и
 * клавиатурные сокращения самого бланка.
 */

interface ClarifyDialogProps {
  ticket: Ticket;
  replyText: string;
  onChangeReply: (value: string) => void;
  onClose: () => void;
  onSend: () => void;
  onCommit: () => void;
  isSending: boolean;
  isWaitingForClient: boolean;
  isCommitting: boolean;
  statusMessage: string | null;
  statusKind: 'ok' | 'error';
}

export const ClarifyDialog: React.FC<ClarifyDialogProps> = ({
  ticket,
  replyText,
  onChangeReply,
  onClose,
  onSend,
  onCommit,
  isSending,
  isWaitingForClient,
  isCommitting,
  statusMessage,
  statusKind,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Фокус переходит в бланк при открытии и возвращается по Esc.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Ловушка фокуса: Tab не уводит из бланка, Esc закрывает.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }

    // Ctrl+Enter — подтвердить и передать: диспетчер не тянется к мыши.
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onCommit();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusables = sheetRef.current?.querySelectorAll<HTMLElement>(
      'button, textarea, input, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const hasMissingFields = (ticket.missing_fields || []).length > 0;
  const currentStep = !hasMissingFields ? 4 : isWaitingForClient ? 3 : ticket.messages?.some((message) => message.sender === 'operator') ? 2 : 1;
  const steps = ['Данные', 'Запрос', 'Ответ', 'Подтверждение'];

  const messages =
    ticket.messages && ticket.messages.length > 0
      ? ticket.messages
      : [
          {
            id: 'm-0',
            sender: 'client' as const,
            author_name: 'Клиент',
            text: ticket.description,
            timestamp: ticket.created_at,
          },
        ];

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4 scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clarify-dialog-title"
      onKeyDown={handleKeyDown}
    >
      <div ref={sheetRef} className="sheet flex max-h-[90vh] w-full max-w-2xl flex-col">
        {/* Шапка бланка */}
        <div className="flex items-start justify-between gap-3 border-b border-rule-strong px-4 py-3">
          <div className="min-w-0">
            <h2 id="clarify-dialog-title" className="font-sans text-sm font-semibold text-ink">
              Уточнение по заявке{' '}
              <span className="font-mono tabular-nums">{ticket.ticket_id}</span>
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-ink-3">
              Канал: {ticket.channel || 'Telegram'}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Закрыть уточнение"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-rule text-ink-2 hover:bg-panel-2 hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <ol className="grid grid-cols-4 border-b border-rule bg-panel" aria-label="Этапы уточнения">
          {steps.map((step, index) => {
            const number = index + 1;
            const isCurrent = number === currentStep;
            return (
              <li
                key={step}
                aria-current={isCurrent ? 'step' : undefined}
                className={`border-r border-rule px-2 py-2 text-center font-sans text-xs last:border-r-0 ${
                  isCurrent ? 'bg-accent-bg font-semibold text-ink' : number < currentStep ? 'text-accent' : 'text-ink-3'
                }`}
              >
                {step}
              </li>
            );
          })}
        </ol>

        {/* Переписка */}
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-paper px-4 py-3">
          {messages.map((msg) => {
            const fromUs = msg.sender === 'operator' || msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`max-w-[85%] border px-3 py-2 ${
                  fromUs ? 'ml-auto border-accent-bg bg-accent-bg' : 'mr-auto border-rule bg-panel'
                }`}
              >
                <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] text-ink-3">
                  <span>{msg.author_name}</span>
                  <span className="tabular-nums">
                    {new Date(msg.timestamp).toLocaleTimeString('ru-RU')}
                  </span>
                </div>
                <p className="mt-1 font-sans text-xs leading-relaxed text-ink">{msg.text}</p>
              </div>
            );
          })}
        </div>

        {/* Действия диспетчера */}
        <div className="flex flex-col gap-3 border-t border-rule-strong px-4 py-3">
          {ticket.missing_fields && ticket.missing_fields.length > 0 ? (
            <p className="font-sans text-xs text-warn">
              {isWaitingForClient
                ? 'Запрос отправлен — ожидаем ответ клиента.'
                : `Требуется уточнить: ${formatFieldLabels(ticket.missing_fields)}.`}
            </p>
          ) : (
            <p className="border border-accent-bg bg-accent-bg px-3 py-2 font-sans text-xs text-ink">
              Данные дополнены ответом клиента. Заявку можно подтвердить и передать в 1С.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="operator-reply-input" className="font-sans text-xs font-medium text-ink-2">
              Текст запроса клиенту
            </label>
            <textarea
              id="operator-reply-input"
              rows={2}
              value={replyText}
              onChange={(e) => onChangeReply(e.target.value)}
              className="w-full border border-rule bg-paper px-3 py-2 font-sans text-xs leading-relaxed text-ink"
            />
          </div>

          {hasMissingFields ? (
            <button
              type="button"
              onClick={onSend}
              disabled={isSending || isWaitingForClient || isCommitting || !replyText.trim()}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-accent px-4 font-sans text-sm font-medium text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending || isWaitingForClient ? (
                <RefreshCw className={`h-4 w-4 ${isSending ? 'animate-spin' : ''}`} aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isWaitingForClient ? 'Ожидаем ответ клиента' : 'Запросить данные'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCommit}
              disabled={isCommitting || isSending}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-accent px-4 font-sans text-sm font-medium text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCommitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileCheck className="h-4 w-4" aria-hidden="true" />
              )}
              <span>Проверить и передать в 1С</span>
              <span className="kbd ml-1">Ctrl+↵</span>
            </button>
          )}

          {statusMessage && (
            <p
              role="status"
              aria-live="polite"
              className={`border px-3 py-2 font-sans text-xs ${
                statusKind === 'error'
                  ? 'border-danger-bg bg-danger-bg text-danger'
                  : 'border-accent-bg bg-accent-bg text-ink'
              }`}
            >
              {statusMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
