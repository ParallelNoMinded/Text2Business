import React, { useState } from 'react';
import {
  AlertTriangle,
  Send,
  MessageSquare,
  RefreshCw,
  X,
  FileCheck,
  ChevronRight,
  RotateCcw,
  ChevronLeft,
} from 'lucide-react';
import { DatabaseSchema } from '../mockDb';
import { Ticket, TicketMessage } from '../types';
import { apiFetch } from '../api';

interface OperatorConsoleViewProps {
  db: DatabaseSchema | null;
  onUpdateDb: (updatedDb: DatabaseSchema) => void;
  theme?: 'dark' | 'light';
}

export const OperatorConsoleView: React.FC<OperatorConsoleViewProps> = ({
  db,
  onUpdateDb,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Manual completion form states inside modal
  const [manualAssetCode, setManualAssetCode] = useState('ХУ-17');
  const [manualSiteId, setManualSiteId] = useState('S-MSK-01');

  // Filter states
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleResetFilters = () => {
    setFilterChannel('all');
    setFilterPriority('all');
    setFilterStatus('all');
  };

  if (!db) {
    return (
      <div className="p-6 text-center text-xs font-mono text-slate-400">
        // Загрузка данных Диспетчера...
      </div>
    );
  }

  // Pending HITL tickets (status WAITING_DISPATCHER or action REQUEST_CLARIFICATION or has missing_fields)
  const allPendingTickets = db.open_tickets.filter(
    (t) => t.status === 'WAITING_DISPATCHER' || (t.missing_fields && t.missing_fields.length > 0)
  );

  const allActiveTickets = db.open_tickets.filter(
    (t) => t.status !== 'WAITING_DISPATCHER' && (!t.missing_fields || t.missing_fields.length === 0)
  );

  const filterTicket = (t: Ticket) => {
    if (filterChannel !== 'all' && t.channel && t.channel.toLowerCase() !== filterChannel.toLowerCase()) return false;
    if (filterPriority !== 'all' && t.priority.toLowerCase() !== filterPriority.toLowerCase()) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'pending' && !(t.status === 'WAITING_DISPATCHER' || (t.missing_fields && t.missing_fields.length > 0))) return false;
      if (filterStatus === 'active' && (t.status === 'WAITING_DISPATCHER' || (t.missing_fields && t.missing_fields.length > 0))) return false;
    }
    return true;
  };

  const pendingTickets = allPendingTickets.filter(filterTicket);
  const activeTickets = allActiveTickets.filter(filterTicket);

  const handleOpenTicketInspector = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    const missingStr = (ticket.missing_fields || ['код оборудования (например, ХУ-17)']).join(', ');
    setReplyText(
      `Здравствуйте! Для автоматической регистрации вашей заявки уточните, пожалуйста: ${missingStr}.`
    );
    setStatusMessage(null);
  };

  // Send clarification reply to client in Bot & DB
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
        setStatusMessage('✅ Уточнение успешно отправлено клиенту в Telegram бот!');

        // Update local state DB
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

        const newOpenTickets = db.open_tickets.map((t) =>
          t.ticket_id === selectedTicket.ticket_id ? updatedTicket : t
        );
        onUpdateDb({ ...db, open_tickets: newOpenTickets });
        setSelectedTicket(updatedTicket);
      } else {
        setStatusMessage(`❌ Ошибка отправки: ${data.error || 'Не удалось связаться с ботом'}`);
      }
    } catch (err: any) {
      setStatusMessage(`❌ Ошибка сервера: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Complete & Approve Ticket in 1C
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
          note: `Диспетчер вручную подтвердил данные. Заявка передана в 1С:ERP (Приоритет: HIGH).`,
          author: 'Диспетчер',
        },
      ],
    };

    const newOpenTickets = db.open_tickets.map((t) =>
      t.ticket_id === selectedTicket.ticket_id ? completedTicket : t
    );
    onUpdateDb({ ...db, open_tickets: newOpenTickets });
    setSelectedTicket(null);
  };

  return (
    <div id="operator-console-page" className="mx-auto w-full max-w-[1780px] pb-24 pt-2 sm:pt-4 lg:pb-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-[30px]">Рабочее место диспетчера</h1>
          <p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
            Разрешение неопределенностей, интерактивный диалог с клиентом и ручное дообучение данных
          </p>
        </div>
        {allPendingTickets.length > 0 && (
          <div className="flex items-center gap-2 self-start rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 sm:self-auto">
            <span>▲</span>
            <span>{allPendingTickets.length} обращение требует внимания</span>
          </div>
        )}
      </div>

      {/* Top Grid: Requests (left) + Filters (right) */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Pending requests */}
        <div className={`rounded-xl border p-5 sm:p-6 ${isDark ? 'border-slate-700 bg-[#242438]' : 'border-[#c8c8c8] bg-white'}`}>
          <h2 className="mb-4 text-base font-extrabold">
            Обращения, требующие уточнения ({pendingTickets.length})
          </h2>

          {pendingTickets.length === 0 ? (
            <div className={`rounded-xl border border-dashed py-12 text-center text-sm font-semibold ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-700'}`}>
              Нет обращений, требующих уточнения
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTickets.map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  className={`rounded-xl border p-5 transition ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#d0d0d0] bg-white'}`}
                >
                  <div className="mb-3">
                    <span className="inline-block rounded-md bg-red-50 px-2.5 py-1 text-xs font-extrabold text-red-600">
                      {ticket.ticket_id}
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-extrabold leading-snug">
                    {ticket.summary || 'Неполное обращение'}
                  </h3>
                  <p className={`mb-3 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
                    {ticket.description}
                  </p>
                  {ticket.missing_fields && ticket.missing_fields.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className={isDark ? 'text-slate-400' : 'text-[#686868]'}>Отсутствует:</span>
                      {ticket.missing_fields.map((field) => (
                        <span
                          key={field}
                          className="rounded-md bg-[#fff4e6] px-2.5 py-1 text-[11px] font-extrabold text-[#d56600]"
                        >
                          {field === 'asset_code' ? 'Код оборудования' : field === 'preferred_time' ? 'Срок ожидания' : field}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={`flex items-center justify-between border-t pt-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <button
                      type="button"
                      onClick={() => handleOpenTicketInspector(ticket)}
                      className="text-xs font-extrabold text-[#06439b] transition hover:text-[#2b7777]"
                    >
                      Открыть интерактивный диалог
                    </button>
                    <MessageSquare className="h-4 w-4 text-[#06439b]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Filters */}
        <div className={`rounded-xl border p-5 sm:p-6 ${isDark ? 'border-slate-700 bg-[#242438]' : 'border-[#c8c8c8] bg-white'}`}>
          <h2 className="mb-4 text-base font-extrabold">Фильтры</h2>
          <div className="space-y-4 text-xs font-bold">
            <div>
              <label className={`mb-1 block ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>Канал</label>
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 outline-none ${isDark ? 'border-slate-700 bg-[#1c1a2e] text-white' : 'border-[#c8c8c8] bg-white text-black'}`}
              >
                <option value="all">Все каналы</option>
                <option value="telegram">Telegram</option>
                <option value="email">Email</option>
                <option value="voice">Голос / Телефония</option>
                <option value="call_transcript">Транскрипт</option>
                <option value="portal">Портал</option>
              </select>
            </div>
            <div>
              <label className={`mb-1 block ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>Приоритет</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 outline-none ${isDark ? 'border-slate-700 bg-[#1c1a2e] text-white' : 'border-[#c8c8c8] bg-white text-black'}`}
              >
                <option value="all">Все</option>
                <option value="critical">Критический (CRITICAL)</option>
                <option value="high">Высокий (HIGH)</option>
                <option value="medium">Средний (MEDIUM)</option>
                <option value="low">Низкий (LOW)</option>
              </select>
            </div>
            <div>
              <label className={`mb-1 block ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>Статус</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 outline-none ${isDark ? 'border-slate-700 bg-[#1c1a2e] text-white' : 'border-[#c8c8c8] bg-white text-black'}`}
              >
                <option value="all">Все статусы</option>
                <option value="pending">Требуют уточнения</option>
                <option value="active">В работе</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className={`flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-extrabold transition ${isDark ? 'border-slate-700 bg-transparent text-slate-300 hover:bg-white/5' : 'border-[#c8c8c8] bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Сбросить фильтры</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: All Active Tickets Table */}
      <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-slate-700 bg-[#242438]' : 'border-[#c8c8c8] bg-white'}`}>
        <div className="px-5 py-4 sm:px-6">
          <h2 className="text-base font-extrabold">Все укомплектованные заявки в работе ({activeTickets.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-y text-[11px] font-bold ${isDark ? 'border-slate-700 bg-[#1c1a2e] text-slate-400' : 'border-[#e0e0e0] bg-[#fafafa] text-[#707070]'}`}>
              <tr>
                <th className="px-5 py-3">ID заявки</th>
                <th className="px-4 py-3">Объект / Asset</th>
                <th className="px-4 py-3">Суть обращения</th>
                <th className="px-4 py-3 text-center">Приоритет</th>
                <th className="px-4 py-3">SLA дедлайн</th>
                <th className="px-4 py-3">Группа</th>
                <th className="px-5 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium dark:divide-slate-700">
              {activeTickets.map((t) => (
                <tr
                  key={t.ticket_id}
                  onClick={() => handleOpenTicketInspector(t)}
                  className={`cursor-pointer transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-5 py-4 font-black">{t.ticket_id}</td>
                  <td className="px-4 py-4 font-extrabold text-[#2d7a7a]">{t.asset_id}</td>
                  <td className="px-4 py-4 font-extrabold leading-snug">{t.summary}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-block rounded-md bg-red-50 px-3 py-1 font-extrabold text-red-600">
                      {t.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-extrabold">
                    {new Date(t.sla_deadline).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className={`px-4 py-4 font-semibold ${isDark ? 'text-slate-300' : 'text-[#505050]'}`}>{t.assigned_group}</td>
                  <td className="px-5 py-4 text-right">
                    <ChevronRight className="inline-block h-4 w-4 text-slate-400" />
                  </td>
                </tr>
              ))}
              {activeTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs font-semibold text-slate-400">
                    Нет заявок, соответствующих фильтрам
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className={`flex flex-col gap-3 border-t px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${isDark ? 'border-slate-700 text-slate-400' : 'border-[#e0e0e0] text-[#707070]'}`}>
          <span className="text-xs font-semibold">Показано 1 из {activeTickets.length || 1}</span>
          <div className="flex items-center gap-1.5 self-end text-xs font-bold sm:self-auto">
            <button type="button" disabled className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 opacity-50 dark:border-slate-700">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button type="button" className="flex h-7 min-w-7 items-center justify-center rounded border border-[#2d7a7a] bg-[#2d7a7a]/10 px-2 font-extrabold text-[#2d7a7a]">
              1
            </button>
            <button type="button" disabled className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 opacity-50 dark:border-slate-700">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* INTERACTIVE DIALOGUE & CLARIFICATION INSPECTOR MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl p-6 border shadow-2xl flex flex-col max-h-[90vh] ${
              isDark ? 'bg-[#090918] border-cyan-500/40 text-white' : 'bg-white border-slate-400 text-slate-950 shadow-2xl'
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-700/30' : 'border-slate-300'}`}>
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl border ${
                  isDark
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-amber-100 text-amber-950 border-amber-400 font-extrabold'
                }`}>
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-mono font-bold uppercase ${
                    isDark ? 'text-amber-400' : 'text-amber-900 font-extrabold'
                  }`}>
                    Интерактивный Диалог Диспетчера (Заявка {selectedTicket.ticket_id})
                  </h3>
                  <span className={`text-[11px] font-mono ${
                    isDark ? 'text-slate-400' : 'text-slate-700 font-bold'
                  }`}>
                    Канал: {selectedTicket.channel || 'Telegram Bot'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-700 hover:text-slate-950'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Messages History Stream */}
            <div className={`flex-1 overflow-y-auto my-4 space-y-3 p-3 rounded-xl border font-sans text-xs ${
              isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}>
              {(selectedTicket.messages || [
                {
                  id: 'm-0',
                  sender: 'client',
                  author_name: 'Клиент',
                  text: selectedTicket.description,
                  timestamp: selectedTicket.created_at,
                },
              ]).map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl max-w-[85%] ${
                    msg.sender === 'operator'
                      ? isDark
                        ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 ml-auto'
                        : 'bg-blue-100 border border-blue-400 text-blue-950 font-semibold ml-auto shadow-sm'
                      : msg.sender === 'bot'
                      ? isDark
                        ? 'bg-purple-950/60 border border-purple-500/40 text-purple-200 ml-auto'
                        : 'bg-purple-100 border border-purple-400 text-purple-950 font-semibold ml-auto shadow-sm'
                      : isDark
                      ? 'bg-slate-800/80 border border-slate-700 text-slate-200 mr-auto'
                      : 'bg-white border border-slate-300 text-slate-950 font-semibold mr-auto shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1 opacity-90">
                    <span>{msg.author_name}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString('ru-RU')}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Operator Manual Entry / Clarification Controls */}
            <div className={`space-y-3 font-mono text-xs border-t pt-3 ${isDark ? 'border-slate-700/30' : 'border-slate-300'}`}>
              {/* Missing Information Highlight */}
              <div className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between ${
                isDark
                  ? 'bg-red-950/40 border-red-500/30 text-red-300'
                  : 'bg-red-100 border-red-400 text-red-950 font-extrabold'
              }`}>
                <span>⚠️ Требуется уточнить: Код Оборудования / Складской Цех</span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>AI Confidence: 65%</span>
              </div>

              {/* Operator Reply Input */}
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-950 font-extrabold'
                }`}>
                  Текст запроса клиенту в бот Telegram:
                </label>
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs focus:outline-none transition ${
                    isDark
                      ? 'bg-black/60 border border-slate-700 text-white focus:ring-1 focus:ring-cyan-500'
                      : 'bg-white border border-slate-400 text-slate-950 font-semibold focus:border-blue-950 focus:ring-1 focus:ring-blue-950'
                  }`}
                />
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleSendClarification}
                  disabled={isSending}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition ${
                    isDark
                      ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                      : 'bg-sky-600 hover:bg-sky-700 text-white font-extrabold shadow-sm'
                  }`}
                >
                  {isSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Отправить клиенту в бот</span>
                </button>

                <button
                  onClick={handleApproveAndCommitTicket}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition ${
                    isDark
                      ? 'bg-emerald-900 hover:bg-emerald-800 text-white border border-emerald-700 shadow-md'
                      : 'bg-emerald-900 hover:bg-emerald-800 text-white font-extrabold shadow-md border border-emerald-950'
                  }`}
                >
                  <FileCheck className="h-4 w-4" />
                  <span>Утвердить & Передать в 1С</span>
                </button>
              </div>

              {statusMessage && (
                <div className={`p-2 rounded-lg text-[11px] font-bold ${
                  isDark
                    ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
                    : 'bg-blue-100 border border-blue-400 text-blue-950'
                }`}>
                  {statusMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
