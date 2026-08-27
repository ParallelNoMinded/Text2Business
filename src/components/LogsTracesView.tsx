import React, { useState, useEffect, useCallback } from 'react';
import {
  Terminal,
  Activity,
  Layers,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Cpu,
  Shield,
  Zap,
  RefreshCw,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { SystemLogEntry } from '../types';
import { apiFetch } from '../api';
import { DatabaseSchema } from '../mockDb';

interface LogsTracesViewProps {
  theme?: 'dark' | 'light';
  db?: DatabaseSchema | null;
}

export const LogsTracesView: React.FC<LogsTracesViewProps> = ({ theme = 'dark', db }) => {
  const isDark = theme === 'dark';
  const [logFilter, setLogFilter] = useState<'ALL' | 'TELEGRAM' | 'EMAIL' | 'VOICE' | 'SYSTEM' | '1C' | 'REST'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'traces' | 'analytics'>('logs');

  const fetchLogs = useCallback(async () => {
    try {
      const res = await apiFetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      // backend not available — keep current list
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = logs.filter((l) => {
    const matchesChannel = logFilter === 'ALL' || l.channel === logFilter;
    const matchesSearch =
      l.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.channel || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const handleRefreshLogs = () => {
    fetchLogs();
  };

  const totalRequests = (db?.open_tickets?.length || 0) + (db?.closed_tickets?.length || 0);
  const pendingHITL = (db?.open_tickets || []).filter(
    (t) => t.status === 'WAITING_DISPATCHER' || (t.missing_fields && t.missing_fields.length > 0)
  ).length;
  const autoRate = totalRequests > 0 ? Math.round(((totalRequests - pendingHITL) / totalRequests) * 1000) / 10 : 100;
  const avgLatencyMs = logs.length > 0
    ? Math.round(logs.reduce((acc, l) => acc + (l.duration_ms || 0), 0) / logs.length)
    : 0;

  return (
    <div id="logs-traces-page" className="space-y-6">
      {/* Top Banner */}
      <div
        className={`rounded-2xl p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark
            ? 'bg-[#222222]/90 border-cyan-500/30 text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
            : 'bg-white border-slate-300 text-slate-950 shadow-md'
        }`}
      >
        <div>
          <div className="flex items-center space-x-2">
            <Activity className={`h-5 w-5 ${isDark ? 'text-cyan-400' : 'text-blue-950'}`} />
            <h2 className={`text-sm font-mono font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-blue-950 font-extrabold'}`}>
              Мониторинг, Логи и Трейсы Выполнения
            </h2>
          </div>
          <p className={`text-xs mt-1 font-sans ${isDark ? 'text-slate-300' : 'text-slate-900 font-semibold'}`}>
            Сквозное логирование входящих запросов, трассировка OpenTelemetry / Arize AI и дашборды метрик работы AI-Диспетчера.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'logs'
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-blue-950 text-white shadow-md font-extrabold border border-blue-950'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'bg-slate-200 text-slate-900 border border-slate-300 hover:bg-slate-300 hover:text-slate-950 font-extrabold'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Логи Системы</span>
          </button>

          <button
            onClick={() => setActiveTab('traces')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'traces'
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-blue-950 text-white shadow-md font-extrabold border border-blue-950'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'bg-slate-200 text-slate-900 border border-slate-300 hover:bg-slate-300 hover:text-slate-950 font-extrabold'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>OpenTelemetry Трейсы</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'analytics'
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-blue-950 text-white shadow-md font-extrabold border border-blue-950'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'bg-slate-200 text-slate-900 border border-slate-300 hover:bg-slate-300 hover:text-slate-950 font-extrabold'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Дашборды Метрик</span>
          </button>
        </div>
      </div>

      {/* METRICS SUMMARY CARDS (по данным прототипа) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white' : 'bg-white border-slate-300 shadow-md text-slate-950'}`}>
          <div className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-900 font-extrabold'}`}>Всего Заявок</div>
          <div className={`text-xl font-black ${isDark ? 'text-slate-100' : 'text-blue-950'}`}>{totalRequests}</div>
          <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-800 font-bold'}`}>открыто: {db?.open_tickets?.length || 0} • закрыто: {db?.closed_tickets?.length || 0}</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white' : 'bg-white border-slate-300 shadow-md text-slate-950'}`}>
          <div className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-900 font-extrabold'}`}>Авто-Диспетчеризация</div>
          <div className={`text-xl font-black ${isDark ? 'text-slate-100' : 'text-blue-950'}`}>{autoRate}%</div>
          <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-800 font-bold'}`}>SLA-дедлайн по контракту + бизнес-часам</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white' : 'bg-white border-slate-300 shadow-md text-slate-950'}`}>
          <div className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-900 font-extrabold'}`}>Ожидают HITL</div>
          <div className={`text-xl font-black ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{pendingHITL}</div>
          <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-800 font-bold'}`}>требуют уточнения диспетчера</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white' : 'bg-white border-slate-300 shadow-md text-slate-950'}`}>
          <div className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-900 font-extrabold'}`}>Средний Latency</div>
          <div className={`text-xl font-black ${isDark ? 'text-slate-100' : 'text-blue-950'}`}>{avgLatencyMs} ms</div>
          <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-800 font-bold'}`}>по последним событиям логов</div>
        </div>
      </div>

      {/* TAB 1: REALTIME SYSTEM LOGS */}
      {activeTab === 'logs' && (
        <div
          className={`rounded-2xl p-5 border transition-all ${
            isDark
              ? 'bg-[#222222] border-cyan-500/30 text-slate-200'
              : 'bg-white border-slate-300 text-slate-800 shadow-sm'
          }`}
        >
          {/* Controls */}
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b font-mono text-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Канал:</span>
              <select
                value={logFilter}
                onChange={(e: any) => setLogFilter(e.target.value)}
                className={`rounded-lg p-1.5 text-xs focus:outline-none ${isDark ? 'bg-black/80 border border-slate-700 text-cyan-400' : 'bg-white border border-slate-300 text-blue-950 font-bold'}`}
              >
                <option value="ALL">Все Каналы</option>
                <option value="TELEGRAM">Telegram</option>
                <option value="EMAIL">Email</option>
                <option value="VOICE">Телефония</option>
                <option value="SYSTEM">Система / AI</option>
                <option value="REST">REST / Диспетчер</option>
                <option value="1C">1C:ERP</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Поиск по логам..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none ${isDark ? 'bg-black/80 border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900 font-semibold'}`}
                />
                <Search className={`absolute left-2.5 top-2 h-3.5 w-3.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </div>

              <button
                onClick={handleRefreshLogs}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap flex items-center space-x-1 ${isDark ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40' : 'bg-blue-50 hover:bg-blue-100 text-blue-950 border-blue-300'}`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Обновить</span>
              </button>
            </div>
          </div>

          {/* Terminal Console Stream */}
          <div className="font-mono text-xs space-y-2 max-h-96 overflow-y-auto pr-2">
            {filteredLogs.length === 0 && (
              <div className={`p-6 text-center border border-dashed rounded-xl ${isDark ? 'text-slate-400 border-slate-700' : 'text-slate-600 border-slate-300'}`}>
                Событий пока нет. Выполните обращение через демо-стенд (вкладка «Диспетчер») — логи появятся здесь из GET /api/logs.
              </div>
            )}
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${isDark ? 'bg-black/50 border-slate-800/80 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                      log.level === 'SUCCESS'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : log.level === 'WARN'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {log.channel}
                  </span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(log.timestamp).toLocaleTimeString('ru-RU')}</span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>{log.message}</span>
                </div>
                {log.duration_ms && (
                  <span className={`text-[10px] px-2 py-0.5 rounded border whitespace-nowrap self-end sm:self-auto ${isDark ? 'text-slate-400 bg-[#222222] border-[#2A2A2A]' : 'text-slate-700 bg-slate-100 border-slate-300 font-bold'}`}>
                    {log.duration_ms} ms
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OPENTELEMETRY TRACES */}
      {activeTab === 'traces' && (
        <div
          className={`rounded-2xl p-5 border transition-all ${
            isDark
              ? 'bg-[#222222]/90 border-cyan-500/30 text-white shadow-md'
              : 'bg-white border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <div className={`flex items-center justify-between mb-4 border-b pb-3 font-mono ${isDark ? 'border-slate-700/30' : 'border-slate-200'}`}>
            <div className="flex items-center space-x-2">
              <Layers className={`h-5 w-5 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
              <h3 className={`text-sm font-bold uppercase ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
                Trace ID: trace_ot_891823719_tg
              </h3>
            </div>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-700 font-bold'}`}>Суммарно: 482 ms • 6 Spans</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Span 1 */}
            <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>1. Inbound Webhook Ingress (Telegram)</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-bold'}>12 ms</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div className="bg-slate-400 h-full w-[5%]" />
              </div>
            </div>

            {/* Span 2 */}
            <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>2. PII Sanitizer & Masking Guardrails</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-bold'}>4 ms</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div className="bg-slate-400 h-full w-[2%]" />
              </div>
            </div>

            {/* Span 3 */}
            <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>3. Gemini 3.6 Flash Structured Perception</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-bold'}>435 ms</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div className="bg-cyan-500/70 h-full w-[85%]" />
              </div>
            </div>

            {/* Span 4 */}
            <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>4. Deterministic Rule Match & SLA Evaluation</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-bold'}>9 ms</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div className="bg-slate-400 h-full w-[4%]" />
              </div>
            </div>

            {/* Span 5 */}
            <div className={`p-3 rounded-xl border space-y-1 ${isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>5. 1C:ERP Document Commit via OData REST</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-700 font-bold'}>22 ms</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div className="bg-slate-400 h-full w-[4%]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS DASHBOARDS */}
      {activeTab === 'analytics' && (
        <div
          className={`rounded-2xl p-5 border transition-all ${
            isDark
              ? 'bg-[#222222]/90 border-cyan-500/30 text-white shadow-md'
              : 'bg-white border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <h3 className={`text-sm font-mono font-bold uppercase mb-4 ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
            Распределение Обращений по Каналам и Аналитика AI
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>Распределение по Каналам</div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Telegram Bot</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>48% (616 заявок)</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="bg-slate-400 h-full w-[48%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Email IMAP / MCP</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>32% (410 заявок)</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="bg-slate-500 h-full w-[32%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Голосовая Телефония</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>14% (180 заявок)</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="bg-slate-600 h-full w-[14%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>REST Swagger API</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>6% (78 заявок)</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="bg-slate-700 h-full w-[6%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>Точность Идентификации Фактов</div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Код Оборудования (RAG BM25)</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>98.4%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="bg-slate-400 h-full w-[98%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Объект / Контрагент</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>99.1%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="bg-slate-400 h-full w-[99%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Оценка SLA Дедлайна</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>100.0%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="bg-cyan-500/70 h-full w-[100%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
