import React, { useState } from 'react';
import {
  AlertTriangle,
  UserCheck,
  Send,
  MessageSquare,
  CheckCircle,
  Clock,
  ShieldAlert,
  Edit,
  Building,
  Cpu,
  RefreshCw,
  X,
  FileCheck,
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
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Manual completion form states inside modal
  const [manualAssetCode, setManualAssetCode] = useState('ХУ-17');
  const [manualSiteId, setManualSiteId] = useState('S-MSK-01');

  if (!db) {
    return (
      <div className={`p-6 text-center text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        // Загрузка данных Диспетчера...
      </div>
    );
  }

  // Pending HITL tickets (status WAITING_DISPATCHER or action REQUEST_CLARIFICATION or has missing_fields)
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

    // Resolve asset_id from db.assets by local_code (no hardcoded mapping)
    const matchedAsset = db.assets.find(
      (a) => a.local_code.toLowerCase() === manualAssetCode.trim().toLowerCase()
    );
    const resolvedAssetId = matchedAsset ? matchedAsset.asset_id : selectedTicket.asset_id;

    const completedTicket: Ticket = {
      ...selectedTicket,
      asset_id: resolvedAssetId,
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
    <div id="operator-console-page" className="space-y-6">
      {/* Top Banner */}
      <div
        className={`rounded-2xl p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark
            ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
            : 'bg-white border-slate-300 text-slate-950 shadow-md'
        }`}
      >
        <div>
          <div className="flex items-center space-x-2">
            <UserCheck className={`h-5 w-5 ${isDark ? 'text-slate-300' : 'text-blue-950'}`} />
            <h2 className={`text-sm font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-blue-950 font-extrabold'}`}>
              Рабочее Место Диспетчера
            </h2>
          </div>
          <p className={`text-xs mt-1 font-sans ${isDark ? 'text-slate-300' : 'text-slate-900 font-semibold'}`}>
            Разрешение неопределенностей, интерактивный диалог с клиентом в боте, ручное дообогащение данных и передача в 1С:ERP.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          {pendingTickets.length > 0 ? (
            <span className={`px-3 py-1.5 rounded-xl border font-bold flex items-center space-x-1.5 ${
              isDark
                ? 'bg-red-500/10 text-red-300 border-red-500/30'
                : 'bg-red-100 text-red-950 border-red-400 font-extrabold'
            }`}>
              <AlertTriangle className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-700'}`} />
              <span>{pendingTickets.length} Заявок требуют внимания</span>
            </span>
          ) : (
            <span className={`px-3 py-1.5 rounded-xl border font-bold flex items-center space-x-1.5 ${
              isDark
                ? 'bg-[#222222] text-slate-300 border-[#2A2A2A]'
                : 'bg-slate-100 text-slate-700 border-slate-300 font-extrabold'
            }`}>
              <CheckCircle className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              <span>Все обращения укомплектованы</span>
            </span>
          )}
        </div>
      </div>

      {/* SECTION 1: PENDING HITL TICKETS (RED GLOW ATTENTION) */}
      <div className="space-y-3">
        <h3 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 ${
          isDark ? 'text-slate-300' : 'text-slate-800 font-extrabold'
        }`}>
          <ShieldAlert className="h-4 w-4" />
          <span>Обращения, Требующие Уточнения Данных Диспетчером ({pendingTickets.length})</span>
        </h3>

        {pendingTickets.length === 0 ? (
          <div className={`p-5 rounded-2xl border text-center text-xs font-mono ${isDark ? 'bg-[#222222] border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-300 text-slate-900 font-semibold'}`}>
            // Нет неполных обращений. AI-Диспетчер автоматически обработал 100% поступивших сообщений.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                onClick={() => handleOpenTicketInspector(ticket)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                  isDark
                    ? 'bg-[#1C1B1B] border-red-500/25 hover:border-red-500/50'
                    : 'bg-white border-red-400 hover:border-red-600 shadow-md text-slate-950'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                    isDark
                      ? 'text-slate-200 bg-[#222222] border-[#2A2A2A]'
                      : 'text-slate-800 bg-slate-100 border-slate-300 font-extrabold'
                  }`}>
                    {ticket.ticket_id}
                  </span>
                  <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border flex items-center space-x-1 ${
                    isDark
                      ? 'text-red-300 bg-red-500/10 border-red-500/25'
                      : 'text-red-950 bg-red-100 border-red-400 font-extrabold'
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
                    <span>Уточнение Данных</span>
                  </span>
                </div>

                <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-950 font-extrabold'}`}>
                  {ticket.summary || 'Неполное обращение без кода оборудования'}
                </h4>
                <p className={`text-[11px] mb-3 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-900 font-medium'}`}>
                  {ticket.description}
                </p>

                {ticket.missing_fields && (
                  <div className="mb-3 flex flex-wrap gap-1 font-mono text-[10px]">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-900 font-bold'}>Отсутствует:</span>
                    {ticket.missing_fields.map((field) => (
                      <span key={field} className={`px-2 py-0.5 rounded border font-bold ${
                        isDark
                          ? 'bg-red-500/10 text-red-300 border-red-500/25'
                          : 'bg-red-100 text-red-950 border-red-400 font-extrabold'
                      }`}>
                        ⚠️ {field}
                      </span>
                    ))}
                  </div>
                )}

                <div className={`flex items-center justify-between pt-2 border-t text-[11px] font-mono font-bold ${
                  isDark
                    ? 'border-slate-700/30 text-slate-300'
                    : 'border-slate-200 text-blue-950 font-extrabold'
                }`}>
                  <span>Открыть интерактивный диалог</span>
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: REGULAR IN-PROGRESS TICKETS */}
      <div className="space-y-3 pt-4">
        <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${
          isDark ? 'text-slate-400' : 'text-slate-900 font-extrabold'
        }`}>
          Все Укомплектованные Заявки в Работе ({activeTickets.length})
        </h3>

        <div className={`rounded-2xl p-4 border overflow-x-auto ${isDark ? 'bg-[#1C1B1B] border-[#2A2A2A]' : 'bg-white border-slate-300 shadow-sm'}`}>
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-950'}`}>
            <thead className={`font-mono uppercase text-[10px] border-b ${isDark ? 'bg-[#222222] text-slate-300 border-[#2A2A2A]' : 'bg-slate-200 text-slate-950 font-extrabold border-slate-300'}`}>
              <tr>
                <th className="p-3">ID Заявки</th>
                <th className="p-3">Объект / Ассет</th>
                <th className="p-3">Суть Обращения</th>
                <th className="p-3">Приоритет</th>
                <th className="p-3">SLA Дедлайн</th>
                <th className="p-3">Группа</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-sans ${isDark ? 'divide-slate-700/20' : 'divide-slate-200'}`}>
              {activeTickets.map((t) => (
                <tr key={t.ticket_id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100/80'}>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-900 font-extrabold'}`}>{t.ticket_id}</td>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-800 font-extrabold'}`}>{t.asset_id}</td>
                  <td className="p-3 font-semibold">{t.summary}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded border font-mono font-bold text-[10px] ${
                      isDark
                        ? 'bg-red-500/10 text-red-300 border-red-500/25'
                        : 'bg-red-100 text-red-950 border-red-400 font-extrabold'
                    }`}>
                      {t.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-semibold">
                    {new Date(t.sla_deadline).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-800 font-bold'}`}>{t.assigned_group}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INTERACTIVE DIALOGUE & CLARIFICATION INSPECTOR MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl p-6 border shadow-2xl flex flex-col max-h-[90vh] ${
              isDark ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white' : 'bg-white border-slate-400 text-slate-950 shadow-2xl'
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-700/30' : 'border-slate-300'}`}>
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl border ${
                  isDark
                    ? 'bg-[#222222] text-slate-300 border-[#2A2A2A]'
                    : 'bg-amber-100 text-amber-950 border-amber-400 font-extrabold'
                }`}>
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-mono font-bold uppercase ${
                    isDark ? 'text-slate-100' : 'text-amber-900 font-extrabold'
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
              isDark ? 'bg-[#222222]/60 border-[#2A2A2A]' : 'bg-slate-100 border-slate-300'
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
                        ? 'bg-cyan-500/10 border border-cyan-500/25 text-cyan-100/90 ml-auto'
                        : 'bg-blue-100 border border-blue-400 text-blue-950 font-semibold ml-auto shadow-sm'
                      : msg.sender === 'bot'
                      ? isDark
                        ? 'bg-[#262626] border border-[#2A2A2A] text-slate-300 ml-auto'
                        : 'bg-purple-100 border border-purple-400 text-purple-950 font-semibold ml-auto shadow-sm'
                      : isDark
                      ? 'bg-[#262626] border border-[#2A2A2A] text-slate-200 mr-auto'
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
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-200/90'
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
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition border ${
                    isDark
                      ? 'bg-[#222222] hover:bg-[#2A2A2A] text-slate-200 border-[#2A2A2A] hover:border-cyan-500/40'
                      : 'bg-sky-600 hover:bg-sky-700 text-white font-extrabold shadow-sm'
                  }`}
                >
                  {isSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Отправить клиенту в бот</span>
                </button>

                <button
                  onClick={handleApproveAndCommitTicket}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition border ${
                    isDark
                      ? 'bg-[#222222] hover:bg-[#2A2A2A] text-slate-200 border-[#2A2A2A] hover:border-emerald-500/40'
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
                    ? 'bg-[#222222] border border-[#2A2A2A] text-slate-300'
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
