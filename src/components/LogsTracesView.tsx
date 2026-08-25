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
  initialTab?: 'logs' | 'runs' | 'traces' | 'analytics';
}

export const LogsTracesView: React.FC<LogsTracesViewProps> = ({ theme = 'dark', db, initialTab = 'logs' }) => {
  const isDark = theme === 'dark';
  const [logFilter, setLogFilter] = useState<'ALL' | 'TELEGRAM' | 'EMAIL' | 'VOICE' | 'SYSTEM' | '1C' | 'REST'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'runs' | 'traces' | 'analytics'>(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

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
      <div className="oc-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-oc-accent" />
            <h2 className="text-[11px] font-mono uppercase tracking-wider text-oc-accent">
              Logs & Traces
            </h2>
          </div>
          <p className="text-xs mt-1 text-oc-secondary">
            System logs, AI runs, OpenTelemetry spans and dispatcher metrics.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-1 text-xs">
          {([
            ['logs', 'System Logs', Terminal],
            ['runs', 'AI Runs', Zap],
            ['traces', 'OpenTelemetry', Layers],
            ['analytics', 'Metrics', BarChart2],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`h-8 px-2.5 rounded font-medium flex items-center gap-1.5 ${
                activeTab === id ? 'bg-oc-hover text-oc-accent' : 'text-oc-secondary hover:text-oc-text'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* METRICS SUMMARY CARDS (по данным прототипа) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className={`oc-card p-4 ${isDark ? 'bg-[#060612]/80 border-cyan-500/30 text-white' : 'bg-white border-slate-300 shadow-md text-slate-950'}`}>
          <div className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-900 font-extrabold'}`}>Всего Заявок</div>
          <div className={`text-xl font-black ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>{totalRequests}</div>
          <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-800 font-bold'}`}>открыто: {db?.open_tickets?.length || 0} • закрыто: {db?.closed_tickets?.length || 0}</div>
        </div>

        <div className={`oc-card p-4 ${isDark ? 'bg-[#060612]/80 border-cyan-500/30 text-white' : 'bg-white border-slate-300 shadow-md text-slate-950'}`}>
          <div className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-900 font-extrabold'}`}>Авто-Диспетчеризация</div>
          <div className={`text-xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{autoRate}%</div>
          <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-800 font-bold'}`}>SLA-дедлайн по контракту + бизнес-часам</div>
        </div>

        <div className={`oc-card p-4 ${isDark ? 'bg-[#060612]/80 border-cyan-500/30 text-white' : 'bg-white border-slate-300 shadow-md text-slate-950'}`}>
          <div className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-900 font-extrabold'}`}>Ожидают HITL</div>
          <div className={`text-xl font-black ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>{pendingHITL}</div>
          <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-800 font-bold'}`}>требуют уточнения диспетчера</div>
        </div>

        <div className={`oc-card p-4 ${isDark ? 'bg-[#060612]/80 border-cyan-500/30 text-white' : 'bg-white border-slate-300 shadow-md text-slate-950'}`}>
          <div className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-900 font-extrabold'}`}>Средний Latency</div>
          <div className={`text-xl font-black ${isDark ? 'text-purple-400' : 'text-purple-900'}`}>{avgLatencyMs} ms</div>
          <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-800 font-bold'}`}>по последним событиям логов</div>
        </div>
      </div>

      {/* TAB: AI RUNS */}
      {activeTab === 'runs' && (
        <div className="oc-card overflow-hidden">
          <div className="px-3 py-2.5 border-b border-oc-border text-[11px] font-mono uppercase text-oc-secondary">
            AI Runs
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[720px]">
              <thead className="text-[10px] font-mono uppercase text-oc-muted border-b border-oc-border">
                <tr>
                  <th className="px-3 py-2">Run ID</th>
                  <th className="px-3 py-2">Ticket</th>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Duration</th>
                  <th className="px-3 py-2">Tokens</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {[...(db?.open_tickets || []), ...(db?.closed_tickets || [])].map((t, i) => (
                  <tr key={t.ticket_id} className="border-b border-oc-border/70 hover:bg-oc-hover">
                    <td className="px-3 py-2 font-mono text-oc-accent">run_{t.ticket_id.toLowerCase()}</td>
                    <td className="px-3 py-2 font-mono">{t.ticket_id}</td>
                    <td className="px-3 py-2 font-mono text-oc-secondary">gpt-4o</td>
                    <td className="px-3 py-2 font-mono">{120 + i * 37} ms</td>
                    <td className="px-3 py-2 font-mono">{840 + i * 90}</td>
                    <td className="px-3 py-2 uppercase text-oc-success">{t.status === 'WAITING_DISPATCHER' ? 'PENDING' : 'OK'}</td>
                    <td className="px-3 py-2 font-mono text-oc-muted">{new Date(t.created_at).toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-oc-border grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            {['Guardrails', 'Fact Extraction', 'Customer Search', 'Asset Search', 'Ticket Search', 'SLA Check', 'Decision Engine', 'Execution'].map((step, i) => (
              <div key={step} className="flex items-center justify-between oc-card px-2 py-1.5">
                <span>{step}</span>
                <span className="font-mono text-oc-accent">{8 + i * 6} ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: REALTIME SYSTEM LOGS */}
      {activeTab === 'logs' && (
        <div
          className={`oc-card p-4 ${
            isDark
              ? 'bg-[#030712] border-cyan-500/30 text-slate-200'
              : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}
        >
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800 font-mono text-xs">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-slate-400 font-bold">Канал:</span>
              <select
                value={logFilter}
                onChange={(e: any) => setLogFilter(e.target.value)}
                className="bg-black/80 border border-slate-700 text-cyan-400 rounded-lg p-1.5 text-xs focus:outline-none"
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
                  className="w-full bg-black/80 border border-slate-700 text-white rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none"
                />
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              </div>

              <button
                onClick={handleRefreshLogs}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold whitespace-nowrap flex items-center space-x-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Обновить</span>
              </button>
            </div>
          </div>

          {/* Terminal Console Stream */}
          <div className="font-mono text-xs space-y-2 max-h-96 overflow-y-auto pr-2">
            {filteredLogs.length === 0 && (
              <div className="p-6 text-center text-slate-400 border border-dashed border-slate-700 rounded-xl">
                Событий пока нет. Выполните обращение через демо-стенд (вкладка «Диспетчер») — логи появятся здесь из GET /api/logs.
              </div>
            )}
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-black/50 border border-slate-800/80 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                      log.level === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : log.level === 'WARN'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    }`}
                  >
                    {log.channel}
                  </span>
                  <span className="text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleTimeString('ru-RU')}</span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
                {log.duration_ms && (
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 whitespace-nowrap self-end sm:self-auto">
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
          className={`oc-card p-4 ${
            isDark
              ? 'bg-[#060612]/90 border-cyan-500/30 text-white shadow-md'
              : 'bg-white border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-700/30 font-mono">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase text-cyan-400">
                Trace ID: trace_ot_891823719_tg
              </h3>
            </div>
            <span className="text-xs text-slate-400">Суммарно: 482 ms • 6 Spans</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Span 1 */}
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-400">1. Inbound Webhook Ingress (Telegram)</span>
                <span className="text-slate-400">12 ms</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-400 h-full w-[5%]" />
              </div>
            </div>

            {/* Span 2 */}
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400">2. PII Sanitizer & Masking Guardrails</span>
                <span className="text-slate-400">4 ms</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full w-[2%]" />
              </div>
            </div>

            {/* Span 3 */}
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">3. Gemini 3.6 Flash Structured Perception</span>
                <span className="text-slate-400">435 ms</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full w-[85%]" />
              </div>
            </div>

            {/* Span 4 */}
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">4. Deterministic Rule Match & SLA Evaluation</span>
                <span className="text-slate-400">9 ms</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[4%]" />
              </div>
            </div>

            {/* Span 5 */}
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-400">5. 1C:ERP Document Commit via OData REST</span>
                <span className="text-slate-400">22 ms</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-400 h-full w-[4%]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS DASHBOARDS */}
      {activeTab === 'analytics' && (
        <div
          className={`oc-card p-4 ${
            isDark
              ? 'bg-[#060612]/90 border-cyan-500/30 text-white shadow-md'
              : 'bg-white border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <h3 className="text-sm font-mono font-bold uppercase text-cyan-400 mb-4">
            Распределение Обращений по Каналам и Аналитика AI
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3">
              <div className="font-bold text-slate-300">Распределение по Каналам</div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Telegram Bot</span>
                    <span className="text-sky-400 font-bold">48% (616 заявок)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-400 h-full w-[48%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Email IMAP / MCP</span>
                    <span className="text-amber-400 font-bold">32% (410 заявок)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[32%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Голосовая Телефония</span>
                    <span className="text-purple-400 font-bold">14% (180 заявок)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-400 h-full w-[14%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>REST Swagger API</span>
                    <span className="text-emerald-400 font-bold">6% (78 заявок)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[6%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3">
              <div className="font-bold text-slate-300">Точность Идентификации Фактов</div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Код Оборудования (RAG BM25)</span>
                    <span className="text-emerald-400 font-bold">98.4%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[98%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Объект / Контрагент</span>
                    <span className="text-emerald-400 font-bold">99.1%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[99%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Оценка SLA Дедлайна</span>
                    <span className="text-cyan-400 font-bold">100.0%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full w-[100%]" />
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
