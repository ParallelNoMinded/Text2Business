import React, { useState } from 'react';
import { DatabaseSchema } from '../mockDb';
import { Ticket } from '../types';
import { apiFetch } from '../api';
import { StatusBadge } from './ui/StatusBadge';
import { PageSection } from './layout/PageSection';
import { Send, X } from 'lucide-react';
import { ruPriority } from '../uiRu';

interface OperatorConsoleViewProps {
  db: DatabaseSchema | null;
  onUpdateDb: (updatedDb: DatabaseSchema) => void;
  theme?: 'dark' | 'light';
}

export const OperatorConsoleView: React.FC<OperatorConsoleViewProps> = ({ db, onUpdateDb }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [manualAssetCode, setManualAssetCode] = useState('ХУ-17');
  const [manualSiteId, setManualSiteId] = useState('S-MSK-01');

  if (!db) {
    return <p className="text-[11px] text-[var(--oc-muted)]">Загрузка очереди диспетчера…</p>;
  }

  const pendingTickets = db.open_tickets.filter(
    (t) => t.status === 'WAITING_DISPATCHER' || (t.missing_fields && t.missing_fields.length > 0)
  );
  const activeTickets = db.open_tickets.filter(
    (t) => t.status !== 'WAITING_DISPATCHER' && (!t.missing_fields || t.missing_fields.length === 0)
  );

  const handleOpenTicketInspector = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    const missingStr = (ticket.missing_fields || ['код оборудования (например, ХУ-17)']).join(', ');
    setReplyText(
      `Здравствуйте! Для автоматической регистрации вашей заявки уточните, пожалуйста: ${missingStr}.`
    );
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
        setStatusMessage('Уточнение отправлено клиенту.');
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
    setSelectedTicket(null);
  };

  return (
    <div id="operator-console-page" className="grid gap-3">
      <PageSection
        title="ИИ-диспетчер"
        description="Очередь оператора: входящее → пробелы в фактах → подтверждение → исполнение."
        status={
          pendingTickets.length
            ? { tone: 'warning', label: 'НА ПРОВЕРКЕ' }
            : { tone: 'success', label: 'В НОРМЕ' }
        }
      />

      <section className="oc-card" aria-label="Очередь оператора">
        <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">Ожидают диспетчера</h2>
          <StatusBadge
            tone={pendingTickets.length ? 'warning' : 'success'}
            label={pendingTickets.length ? 'ОЖИДАНИЕ' : 'В НОРМЕ'}
          />
        </div>
        <div className="table-scroll">
          <table className="oc-table min-w-[640px]">
            <thead>
              <tr>
                <th>ID заявки</th>
                <th>Приоритет</th>
                <th>Проблема</th>
                <th>Не хватает</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {pendingTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-[var(--oc-muted)]">
                    Нет заявок, требующих оператора
                  </td>
                </tr>
              )}
              {pendingTickets.map((ticket) => (
                <tr key={ticket.ticket_id} className="row-critical">
                  <td className="font-mono text-[11px]">{ticket.ticket_id}</td>
                  <td>
                    <StatusBadge
                      tone={ticket.priority === 'high' || ticket.priority === 'critical' ? 'danger' : 'warning'}
                      label={ruPriority(ticket.priority)}
                    />
                  </td>
                  <td className="max-w-[240px] truncate">{ticket.summary}</td>
                  <td className="text-[11px] text-[var(--oc-muted)]">
                    {(ticket.missing_fields || []).join(', ') || '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-[11px] text-[var(--oc-accent)] hover:underline"
                      onClick={() => handleOpenTicketInspector(ticket)}
                    >
                      Открыть
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="oc-card" aria-label="В работе">
        <div className="border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">В работе</h2>
        </div>
        <div className="table-scroll">
          <table className="oc-table min-w-[640px]">
            <thead>
              <tr>
                <th>ID заявки</th>
                <th>Оборудование</th>
                <th>Проблема</th>
                <th>Приоритет</th>
                <th>SLA</th>
                <th>Группа</th>
              </tr>
            </thead>
            <tbody>
              {activeTickets.map((t) => (
                <tr key={t.ticket_id}>
                  <td className="font-mono text-[11px]">{t.ticket_id}</td>
                  <td className="font-mono text-[11px]">{t.asset_id}</td>
                  <td className="max-w-[220px] truncate">{t.summary}</td>
                  <td>
                    <StatusBadge
                      tone={t.priority === 'high' || t.priority === 'critical' ? 'warning' : 'info'}
                      label={ruPriority(t.priority)}
                    />
                  </td>
                  <td className="font-mono text-[11px]">
                    {new Date(t.sla_deadline).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="text-[var(--oc-muted)]">{t.assigned_group}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="oc-card flex max-h-[90vh] w-full max-w-2xl flex-col"
            role="dialog"
            aria-labelledby="hitl-dialog-title"
          >
            <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
              <div>
                <h3 id="hitl-dialog-title" className="oc-section-title">
                  Подтверждение решения · {selectedTicket.ticket_id}
                </h3>
                <p className="text-[10px] text-[var(--oc-muted)]">
                  Входящее → пробелы в фактах → подтверждение → 1С
                </p>
              </div>
              <button type="button" onClick={() => setSelectedTicket(null)} className="p-1 text-[var(--oc-muted)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-2 overflow-y-auto px-3 py-2 text-[12px]">
              <div>
                <p className="text-[10px] uppercase text-[var(--oc-muted)]">Входящее</p>
                <p>{selectedTicket.description}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[var(--oc-muted)]">Не хватает / факты</p>
                <p>{(selectedTicket.missing_fields || []).join(', ') || 'заполнено'}</p>
              </div>
              <div className="max-h-36 space-y-1 overflow-y-auto rounded border border-[var(--oc-border)] bg-[var(--oc-bg)] p-2">
                {(selectedTicket.messages || []).map((msg) => (
                  <p key={msg.id} className="text-[11px]">
                    <span className="text-[var(--oc-muted)]">{msg.author_name}: </span>
                    {msg.text}
                  </p>
                ))}
              </div>
              <label className="block">
                <span className="text-[10px] uppercase text-[var(--oc-muted)]">Черновик ответа</span>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="mt-0.5 w-full rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] p-2 text-xs"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
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
            </div>

            <div className="flex flex-wrap gap-1.5 border-t border-[var(--oc-border)] px-3 py-2">
              <button
                type="button"
                onClick={handleSendClarification}
                disabled={isSending}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--oc-border)] px-3 py-1 text-[12px] hover:bg-[var(--oc-surface-2)] disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                Отправить
              </button>
              <button
                type="button"
                onClick={handleApproveAndCommitTicket}
                className="rounded-md bg-[var(--status-success-soft)] px-3 py-1 text-[12px] font-medium text-[var(--status-success)]"
              >
                Подтвердить
              </button>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-md bg-[var(--status-danger-soft)] px-3 py-1 text-[12px] font-medium text-[var(--status-danger)]"
              >
                Отклонить
              </button>
            </div>
            {statusMessage && (
              <p className="px-3 pb-2 text-[11px] text-[var(--oc-muted)]">{statusMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
