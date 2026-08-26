import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RotateCcw,
  Download,
  ChevronLeft,
  ChevronRight,
  Layers,
  Activity,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { SystemLogEntry } from '../types';
import { apiFetch } from '../api';
import { DatabaseSchema } from '../mockDb';

interface LogsTracesViewProps {
  theme?: 'dark' | 'light';
  db?: DatabaseSchema | null;
}

export const LogsTracesView: React.FC<LogsTracesViewProps> = ({ theme = 'light', db }) => {
  const isDark = theme === 'dark';
  const [logFilterChannel, setLogFilterChannel] = useState<string>('ALL');
  const [logFilterLevel, setLogFilterLevel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const fetchLogs = useCallback(async () => {
    try {
      const res = await apiFetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setLogFilterChannel('ALL');
    setLogFilterLevel('ALL');
    setCurrentPage(1);
  };

  const filteredLogs = logs.filter((l) => {
    const matchesChannel = logFilterChannel === 'ALL' || l.channel === logFilterChannel;
    const matchesLevel = logFilterLevel === 'ALL' || l.level === logFilterLevel;
    const matchesSearch =
      l.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.channel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.service || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesChannel && matchesLevel && matchesSearch;
  });

  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedLogs = filteredLogs.slice(startIndex, endIndex);

  const renderLevelBadge = (level: string) => {
    switch (level) {
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-extrabold bg-[#10B981]/15 text-[#10B981]">
            <CheckCircle2 className="h-3 w-3" />
            INFO
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-extrabold bg-[#F59E0B]/15 text-[#D97706]">
            <AlertTriangle className="h-3 w-3" />
            WARN
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-extrabold bg-rose-500/15 text-rose-600">
            <XCircle className="h-3 w-3" />
            ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-extrabold bg-slate-500/15 text-slate-600">
            {level}
          </span>
        );
    }
  };

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `system_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="logs-traces-page" className="mx-auto w-full max-w-[1780px] pb-24 pt-2 sm:pt-4 lg:pb-8 font-sans">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-[30px]">Логи и трейсы</h1>
          <p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
            Журнал событий, входящих запросов и трассировка исполнения решений AI
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportLogs}
          className="flex h-[44px] items-center gap-2 rounded-xl bg-[#2D7A7A] px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#236565] self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Экспорт логов</span>
        </button>
      </div>

      {/* Main Container */}
      <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-slate-700 bg-[#242438]' : 'border-[#c8c8c8] bg-white'}`}>
        {/* Filters Bar */}
        <div className={`grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_auto] ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#e0e0e0] bg-white'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по логам..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full rounded-lg border py-2 pl-9 pr-3 text-xs font-bold outline-none ${
                isDark ? 'border-slate-700 bg-[#242438] text-white' : 'border-[#c8c8c8] bg-white text-black'
              }`}
            />
          </div>

          <div>
            <select
              value={logFilterLevel}
              onChange={(e) => {
                setLogFilterLevel(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full rounded-lg border px-3 py-2 text-xs font-bold outline-none ${
                isDark ? 'border-slate-700 bg-[#242438] text-white' : 'border-[#c8c8c8] bg-white text-black'
              }`}
            >
              <option value="ALL">Уровень: Все</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          <div>
            <select
              value={logFilterChannel}
              onChange={(e) => {
                setLogFilterChannel(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full rounded-lg border px-3 py-2 text-xs font-bold outline-none ${
                isDark ? 'border-slate-700 bg-[#242438] text-white' : 'border-[#c8c8c8] bg-white text-black'
              }`}
            >
              <option value="ALL">Канал: Все</option>
              <option value="TELEGRAM">Telegram</option>
              <option value="EMAIL">Email</option>
              <option value="VOICE">Голос</option>
              <option value="SYSTEM">Система</option>
              <option value="1C">1C OData</option>
              <option value="REST">REST API</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-extrabold transition ${
              isDark ? 'border-slate-700 bg-[#242438] text-slate-300 hover:bg-white/5' : 'border-[#c8c8c8] bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Сбросить</span>
          </button>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[11px] font-bold ${isDark ? 'border-slate-700 bg-[#1c1a2e] text-slate-400' : 'border-[#e0e0e0] bg-[#fafafa] text-[#707070]'}`}>
              <tr>
                <th className="px-5 py-3">Время</th>
                <th className="px-4 py-3 text-center">Уровень</th>
                <th className="px-4 py-3">Канал</th>
                <th className="px-4 py-3">Событие / Трассировка</th>
                <th className="px-5 py-3 text-right">Длительность</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium dark:divide-slate-700">
              {pagedLogs.map((log) => (
                <tr key={log.id} className={`transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                  <td className="px-5 py-4 font-mono text-[11px] font-bold text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {renderLevelBadge(log.level)}
                  </td>
                  <td className="px-4 py-4 font-extrabold text-[#2d7a7a]">
                    {log.channel || 'SYSTEM'}
                  </td>
                  <td className="px-4 py-4 font-bold leading-snug">
                    <div className={isDark ? 'text-white' : 'text-black'}>{log.message}</div>
                    {log.service && (
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{log.service}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-xs font-bold text-[#2d7a7a]">
                    {log.duration_ms ? `${log.duration_ms} мс` : '—'}
                  </td>
                </tr>
              ))}
              {pagedLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs font-semibold text-slate-400">
                    Нет записей логов по выбранным фильтрам
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className={`flex flex-col gap-3 border-t px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${isDark ? 'border-slate-700 text-slate-400' : 'border-[#e0e0e0] text-[#707070]'}`}>
          <span className="text-xs font-semibold">
            Показано {totalItems > 0 ? `${startIndex + 1}-${endIndex}` : '0'} из {totalItems}
          </span>
          <div className="flex items-center gap-1.5 self-end text-xs font-bold sm:self-auto">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`flex h-7 w-7 items-center justify-center rounded border transition ${
                safeCurrentPage <= 1
                  ? 'cursor-not-allowed border-slate-300 opacity-50 dark:border-slate-700'
                  : isDark ? 'border-slate-700 hover:bg-white/10' : 'border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNumber = idx + 1;
              const isActive = pageNumber === safeCurrentPage;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`flex h-7 min-w-7 items-center justify-center rounded border px-2 font-extrabold transition ${
                    isActive
                      ? 'border-[#2d7a7a] bg-[#2d7a7a]/10 text-[#2d7a7a]'
                      : isDark
                      ? 'border-slate-700 text-slate-300 hover:bg-white/10'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`flex h-7 w-7 items-center justify-center rounded border transition ${
                safeCurrentPage >= totalPages
                  ? 'cursor-not-allowed border-slate-300 opacity-50 dark:border-slate-700'
                  : isDark ? 'border-slate-700 hover:bg-white/10' : 'border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
