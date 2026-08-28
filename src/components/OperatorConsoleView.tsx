import React, { useEffect, useMemo, useState } from 'react';
import { DatabaseSchema } from '../mockDb';
import { Ticket } from '../types';
import { apiFetch } from '../api';
import { StatusBadge } from './ui/StatusBadge';
import { PageSection } from './layout/PageSection';
import { Phone, Play, Send } from 'lucide-react';
import { ruPriority } from '../uiRu';
import {
  channelLabel,
  clearTakeTicket,
  customerName,
  missingFieldLabel,
  peekTakeTicket,
  requestTakeTicket,
  ticketChannel,
} from '../opsDashboard';

interface OperatorConsoleViewProps {
  db: DatabaseSchema | null;
  onUpdateDb: (updatedDb: DatabaseSchema) => void;
  theme?: 'dark' | 'light';
  onStartTicket?: (ticketId: string) => void;
}

function formatHold(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function lastClientText(ticket: Ticket) {
  const fromClient = [...(ticket.messages || [])].reverse().find((m) => m.sender === 'client');
  return fromClient?.text || ticket.description || ticket.summary;
}

export const OperatorConsoleView: React.FC<OperatorConsoleViewProps> = ({ db, onUpdateDb, onStartTicket }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [manualAssetCode, setManualAssetCode] = useState('ХУ-17');
  const [manualSiteId, setManualSiteId] = useState('S-MSK-01');
  const [holdStartedAt, setHoldStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!holdStartedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [holdStartedAt]);

  const takeTicket = (ticket: Ticket) => {
    requestTakeTicket(ticket.ticket_id);
    setSelectedTicket(ticket);
    const missingStr = (ticket.missing_fields || ['код оборудования']).map(missingFieldLabel).join(', ');
    setReplyText(
      `Здравствуйте! Для автоматической регистрации вашей заявки уточните, пожалуйста: ${missingStr}.`
    );
    setStatusMessage(null);
    setHoldStartedAt(Date.now());
  };

  useEffect(() => {
    if (!db) return;
    const wanted = peekTakeTicket();
    if (!wanted) return;
    const ticket = db.open_tickets.find((t) => t.ticket_id === wanted);
    if (ticket && selectedTicket?.ticket_id !== wanted) takeTicket(ticket);
  }, [db, selectedTicket?.ticket_id]);

  const pendingTickets = useMemo(() => {
    if (!db) return [];
    return db.open_tickets.filter(
      (t) => t.status === 'WAITING_DISPATCHER' || (t.missing_fields && t.missing_fields.length > 0)
    );
  }, [db]);

  const activeTickets = useMemo(() => {
    if (!db) return [];
    return db.open_tickets.filter(
      (t) => t.status !== 'WAITING_DISPATCHER' && (!t.missing_fields || t.missing_fields.length === 0)
    );
  }, [db]);

  if (!db) {
    return <p className="text-[11px] text-[var(--oc-muted)]">Загрузка очереди диспетчера…</p>;
  }

  const hangUp = () => {
    clearTakeTicket();
    setSelectedTicket(null);
    setHoldStartedAt(null);
    setStatusMessage(null);
  };

  const handleSendClarification = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setIsSending(true);
    setStatusMessage(null);
    try {
      const res = await apiFetch('/api/operator/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket.ticket_id,
          chat_id: selectedTicket.chat_id,
          operator_message: replyText,
          channel: selectedTicket.channel || 'telegram',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Уточнение ушло клиенту. Линия ещё ваша.');
        const updatedTicket: Ticket = {
          ...selectedTicket,
          messages: [
            ...(selectedTicket.messages || []),
            {
              id: `m-${Date.now()}`,
              sender: 'operator',
              author_name: 'Дежурный Диспетчер',
              text: replyText,
              timestamp: new Date().toISOString(),
              channel: selectedTicket.channel,
            },
          ],
          history: [
            ...(selectedTicket.history || []),
            {
              timestamp: new Date().toISOString(),
              note: `Диспетчер направил запрос уточнения: "${replyText}"`,
              author: 'Оператор HITL',
            },
          ],
        };
        onUpdateDb({
          ...db,
          open_tickets: db.open_tickets.map((t) =>
            t.ticket_id === selectedTicket.ticket_id ? updatedTicket : t
          ),
        });
        setSelectedTicket(updatedTicket);
      } else {
        setStatusMessage(data.error || 'Не удалось связаться с ботом');
      }
    } catch (err: any) {
      setStatusMessage(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleApproveAndCommitTicket = () => {
    if (!selectedTicket) return;
    const completedTicket: Ticket = {
      ...selectedTicket,
      asset_id: manualAssetCode === 'ХУ-17' ? 'A-1001' : selectedTicket.asset_id,
      site_id: manualSiteId || selectedTicket.site_id,
      status: 'IN_PROGRESS',
      missing_fields: [],
      history: [
        ...(selectedTicket.history || []),
        {
          timestamp: new Date().toISOString(),
          note: 'Диспетчер вручную подтвердил данные. Заявка передана в 1С:ERP (Приоритет: HIGH).',
          author: 'Диспетчер',
        },
      ],
    };
    onUpdateDb({
      ...db,
      open_tickets: db.open_tickets.map((t) =>
        t.ticket_id === selectedTicket.ticket_id ? completedTicket : t
      ),
    });
    hangUp();
  };

  const applyQuick = (kind: 'facts' | 'when' | 'code') => {
    if (!selectedTicket) return;
    if (kind === 'facts') {
      const missingStr = (selectedTicket.missing_fields || ['код оборудования']).map(missingFieldLabel).join(', ');
      setReplyText(`Здравствуйте! Чтобы оформить заявку, уточните: ${missingStr}.`);
      return;
    }
    if (kind === 'when') {
      setReplyText('Когда удобен выезд инженера? Напишите день и окно по времени.');
      return;
    }
    setReplyText('Подскажите локальный код оборудования на шильдике — например, ХУ-17 или ЧИЛ-01.');
  };

  const live = selectedTicket;
  const waitingLine = pendingTickets.filter((t) => t.ticket_id !== live?.ticket_id);

  return (
    <div id="operator-console-page" className="grid gap-3">
      <PageSection
        title="Обращения"
        description="Входящие на линии — взять, уточнить, провести в 1С."
        status={
          pendingTickets.length
            ? { tone: 'warning', label: 'НА ЛИНИИ' }
            : { tone: 'success', label: 'СВОБОДНО' }
        }
      />

      {live && (
        <section className="oc-card overflow-hidden" aria-label="Вы на линии">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--oc-border)] px-3 py-2">
            <div className="min-w-0">
              <h2 className="oc-section-title">Вы на линии · {live.ticket_id}</h2>
              <p className="text-[11px] text-[var(--oc-muted)]">
                {channelLabel(ticketChannel(live))} · {customerName(db, live.customer_id)} · в эфире{' '}
                {holdStartedAt ? formatHold(now - holdStartedAt) : '0:00'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusBadge tone={live.priority === 'high' || live.priority === 'critical' ? 'danger' : 'warning'} label={ruPriority(live.priority)} />
              <button
                type="button"
                onClick={hangUp}
                className="rounded-md border border-[var(--oc-border)] px-2 py-1 text-[11px] hover:bg-[var(--oc-surface-2)]"
              >
                Вернуть в очередь
              </button>
            </div>
          </div>

          <div className="grid gap-3 p-3 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="min-w-0 space-y-2">
              <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Диалог</p>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] p-2">
                {(live.messages || []).length === 0 && (
                  <p className="rounded-md bg-[var(--oc-surface-2)] px-2 py-1.5 text-[12px] leading-snug">{lastClientText(live)}</p>
                )}
                {(live.messages || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[92%] rounded-md px-2 py-1.5 text-[12px] leading-snug ${
                      msg.sender === 'client'
                        ? 'bg-[var(--oc-surface-2)]'
                        : msg.sender === 'operator'
                          ? 'ml-auto bg-[var(--oc-accent-soft)] text-[var(--oc-accent)]'
                          : 'text-[var(--oc-muted)]'
                    }`}
                  >
                    <p className="text-[10px] opacity-70">{msg.author_name}</p>
                    <p className="break-words">{msg.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                <button type="button" className="rounded-md border border-[var(--oc-border)] px-2 py-0.5 text-[11px] hover:bg-[var(--oc-surface-2)]" onClick={() => applyQuick('facts')}>
                  Спросить недостающее
                </button>
                <button type="button" className="rounded-md border border-[var(--oc-border)] px-2 py-0.5 text-[11px] hover:bg-[var(--oc-surface-2)]" onClick={() => applyQuick('code')}>
                  Код камеры
                </button>
                <button type="button" className="rounded-md border border-[var(--oc-border)] px-2 py-0.5 text-[11px] hover:bg-[var(--oc-surface-2)]" onClick={() => applyQuick('when')}>
                  Окно выезда
                </button>
              </div>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Ответ клиенту</span>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="mt-0.5 w-full rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] p-2 text-xs leading-snug"
                />
              </label>
            </div>

            <div className="min-w-0 space-y-2">
              <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Не хватает</p>
              <div className="flex flex-wrap gap-1">
                {(live.missing_fields || []).length === 0 ? (
                  <StatusBadge tone="success" label="ФАКТЫ ЕСТЬ" />
                ) : (
                  (live.missing_fields || []).map((field) => (
                    <StatusBadge key={field} tone="warning" label={missingFieldLabel(field)} />
                  ))
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-[11px]">
                  Оборудование
                  <input
                    value={manualAssetCode}
                    onChange={(e) => setManualAssetCode(e.target.value)}
                    className="mt-0.5 h-7 w-full rounded border border-[var(--oc-border)] bg-[var(--oc-bg)] px-2 font-mono text-xs"
                  />
                </label>
                <label className="text-[11px]">
                  Объект
                  <input
                    value={manualSiteId}
                    onChange={(e) => setManualSiteId(e.target.value)}
                    className="mt-0.5 h-7 w-full rounded border border-[var(--oc-border)] bg-[var(--oc-bg)] px-2 font-mono text-xs"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleSendClarification}
                  disabled={isSending}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--oc-border)] px-3 py-1.5 text-[12px] hover:bg-[var(--oc-surface-2)] disabled:opacity-50"
                >
                  <Send className="h-3 w-3" />
                  Отправить
                </button>
                <button
                  type="button"
                  onClick={handleApproveAndCommitTicket}
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--status-success-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--status-success)]"
                >
                  Провести в 1С
                </button>
              </div>
              {statusMessage && <p className="text-[11px] text-[var(--oc-muted)]">{statusMessage}</p>}
            </div>
          </div>
        </section>
      )}

      <section className="oc-card overflow-hidden" aria-label="Очередь на линии">
        <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">{live ? 'Ещё ждут' : 'На линии'}</h2>
          <StatusBadge
            tone={pendingTickets.length ? 'warning' : 'success'}
            label={pendingTickets.length ? String(pendingTickets.length) : 'СВОБОДНО'}
          />
        </div>
        <div className="grid gap-2 p-3">
          {!pendingTickets.length && (
            <p className="py-4 text-center text-[12px] text-[var(--oc-muted)]">Линия свободна — входящих нет.</p>
          )}
          {(live ? waitingLine : pendingTickets).map((ticket) => (
            <article
              key={ticket.ticket_id}
              className={`oc-on-line rounded-lg border border-[var(--oc-border)] bg-[var(--oc-bg)] px-3 py-2.5 ${
                ticket.priority === 'critical' || ticket.priority === 'high' ? 'row-critical' : ''
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-[var(--oc-muted)]">
                    {channelLabel(ticketChannel(ticket))} · {ticket.ticket_id} · {customerName(db, ticket.customer_id)}
                  </p>
                  <p className="mt-1 text-[13px] leading-snug">{ticket.summary}</p>
                  <p className="mt-1 break-words text-[12px] leading-snug text-[var(--oc-muted)]">«{lastClientText(ticket)}»</p>
                  {(ticket.missing_fields || []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(ticket.missing_fields || []).map((field) => (
                        <StatusBadge key={field} tone="warning" label={missingFieldLabel(field)} />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--oc-accent-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--oc-accent)]"
                  onClick={() => takeTicket(ticket)}
                >
                  <Phone className="h-3 w-3" aria-hidden="true" />
                  Взять обращение
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="oc-card" aria-label="В работе">
        <div className="border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">В работе</h2>
        </div>
        <div className="table-scroll">
          <table className="oc-table oc-table-stack">
            <thead>
              <tr>
                <th>ID</th>
                <th>Оборудование</th>
                <th>Проблема</th>
                <th>Приоритет</th>
                <th>SLA</th>
                <th>Группа</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activeTickets.map((t) => (
                <tr key={t.ticket_id}>
                  <td className="font-mono text-[11px]" data-label="ID">
                    {t.ticket_id}
                  </td>
                  <td className="font-mono text-[11px]" data-label="Оборудование">
                    {t.asset_id}
                  </td>
                  <td data-label="Проблема">{t.summary}</td>
                  <td data-label="Приоритет">
                    <StatusBadge
                      tone={t.priority === 'high' || t.priority === 'critical' ? 'warning' : 'info'}
                      label={ruPriority(t.priority)}
                    />
                  </td>
                  <td className="font-mono text-[11px]" data-label="SLA">
                    {new Date(t.sla_deadline).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="text-[var(--oc-muted)]" data-label="Группа">
                    {t.assigned_group}
                  </td>
                  <td>
                    {onStartTicket && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--oc-accent)]"
                        onClick={() => onStartTicket(t.ticket_id)}
                      >
                        <Play className="h-3 w-3" aria-hidden="true" />
                        Приступить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
