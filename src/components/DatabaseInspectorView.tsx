import React, { useState } from 'react';
import { DatabaseSchema } from '../mockDb';
import { Database, Search, RotateCcw, Building, Cpu, FileText, AlertCircle } from 'lucide-react';

interface DatabaseInspectorViewProps {
  db: DatabaseSchema | null;
  onResetDatabase: () => void;
  isLoading: boolean;
  theme?: 'dark' | 'light';
}

export const DatabaseInspectorView: React.FC<DatabaseInspectorViewProps> = ({
  db,
  onResetDatabase,
  isLoading,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'sites' | 'assets' | 'contracts' | 'tickets'>('sites');
  const [searchTerm, setSearchTerm] = useState('');

  if (!db) {
    return (
      <div
        className={`rounded-2xl p-5 text-center text-xs font-mono border transition-all ${
          isDark
            ? 'bg-[#06060e]/80 border-cyan-500/20 text-slate-500'
            : 'bg-white border-slate-300 text-slate-700 font-semibold shadow-sm'
        }`}
      >
        // Загрузка базы данных...
      </div>
    );
  }

  const term = searchTerm.toLowerCase();

  const filteredSites = db.sites.filter(
    (s) =>
      s.customer_name.toLowerCase().includes(term) ||
      s.address.toLowerCase().includes(term) ||
      s.site_id.toLowerCase().includes(term)
  );

  const filteredAssets = db.assets.filter(
    (a) =>
      a.local_code.toLowerCase().includes(term) ||
      a.name.toLowerCase().includes(term) ||
      a.asset_id.toLowerCase().includes(term)
  );

  const filteredContracts = db.contracts.filter(
    (c) => c.site_id.toLowerCase().includes(term) || c.plan.toLowerCase().includes(term)
  );

  const filteredTickets = db.open_tickets.filter(
    (t) =>
      t.ticket_id.toLowerCase().includes(term) ||
      t.summary.toLowerCase().includes(term) ||
      t.asset_id.toLowerCase().includes(term)
  );

  return (
    <div id="database-inspector-page" className="space-y-4">
      {/* Header & Controls */}
      <div
        className={`rounded-2xl p-4 sm:p-5 transition-all border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? 'bg-[#06060e]/90 border-cyan-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white'
            : 'bg-white border-slate-300 shadow-sm text-slate-900'
        }`}
      >
        <div>
          <div className="flex items-center space-x-2">
            <Database className={`h-4 w-4 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
            <h2 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
              Реестр Базы Данных
            </h2>
          </div>
          <p className={`text-xs mt-0.5 font-sans ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
            Просмотр актуальных записей объектов, оборудования, договоров и открытых заявок в реальном времени.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-full md:w-64 font-mono">
            <input
              type="text"
              placeholder="Поиск по реестру..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none transition ${
                isDark
                  ? 'bg-[#020204]/90 border-cyan-500/30 text-white focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-300 text-blue-950 font-bold focus:border-blue-900'
              }`}
            />
            <Search className={`absolute left-2.5 top-2 h-3.5 w-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
          </div>

          <button
            id="reset-db-btn"
            type="button"
            onClick={onResetDatabase}
            disabled={isLoading}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-900'}`} />
            <span>Сбросить БД</span>
          </button>
        </div>
      </div>

      {/* Internal Nav Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-700/30 pb-2 font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('sites')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'sites'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                : 'bg-blue-900 text-white shadow-sm'
              : isDark
              ? 'bg-[#020204]/60 text-slate-400 hover:text-white border border-transparent'
              : 'bg-slate-100 text-slate-700 hover:text-blue-950 border border-slate-200'
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Объекты ({db.sites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'assets'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                : 'bg-blue-900 text-white shadow-sm'
              : isDark
              ? 'bg-[#020204]/60 text-slate-400 hover:text-white border border-transparent'
              : 'bg-slate-100 text-slate-700 hover:text-blue-950 border border-slate-200'
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>Оборудование ({db.assets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'contracts'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                : 'bg-blue-900 text-white shadow-sm'
              : isDark
              ? 'bg-[#020204]/60 text-slate-400 hover:text-white border border-transparent'
              : 'bg-slate-100 text-slate-700 hover:text-blue-950 border border-slate-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Договоры ({db.contracts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'tickets'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                : 'bg-blue-900 text-white shadow-sm'
              : isDark
              ? 'bg-[#020204]/60 text-slate-400 hover:text-white border border-transparent'
              : 'bg-slate-100 text-slate-700 hover:text-blue-950 border border-slate-200'
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Открытые Заявки ({db.open_tickets.length})</span>
        </button>
      </div>

      {/* Sites View */}
      {activeTab === 'sites' && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all overflow-x-auto ${
            isDark
              ? 'bg-[#06060e]/90 border-cyan-500/20 text-white shadow-md'
              : 'bg-white border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            <thead
              className={`font-mono uppercase text-[10px] tracking-wider border-b ${
                isDark
                  ? 'bg-[#020204] text-cyan-400 border-cyan-500/20'
                  : 'bg-blue-50 text-blue-950 border-slate-300 font-extrabold'
              }`}
            >
              <tr>
                <th className="p-3">ID Объекта</th>
                <th className="p-3">Клиент</th>
                <th className="p-3">Адрес</th>
                <th className="p-3">Контактное Лицо</th>
                <th className="p-3">Регион</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20 font-sans">
              {filteredSites.map((site) => (
                <tr key={site.site_id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>{site.site_id}</td>
                  <td className={`p-3 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{site.customer_name}</td>
                  <td className={`p-3 ${isDark ? 'text-slate-200' : 'text-slate-800 font-medium'}`}>{site.address}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{site.contact_person}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{site.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assets View */}
      {activeTab === 'assets' && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all overflow-x-auto ${
            isDark
              ? 'bg-[#06060e]/90 border-cyan-500/20 text-white shadow-md'
              : 'bg-white border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            <thead
              className={`font-mono uppercase text-[10px] tracking-wider border-b ${
                isDark
                  ? 'bg-[#020204] text-cyan-400 border-cyan-500/20'
                  : 'bg-blue-50 text-blue-950 border-slate-300 font-extrabold'
              }`}
            >
              <tr>
                <th className="p-3">ID Ассета</th>
                <th className="p-3">Код Объекта</th>
                <th className="p-3">Локальный Код</th>
                <th className="p-3">Наименование Оборудования</th>
                <th className="p-3">Критичность</th>
                <th className="p-3">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20 font-sans">
              {filteredAssets.map((asset) => (
                <tr key={asset.asset_id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className="p-3 font-mono text-slate-400">{asset.asset_id}</td>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>{asset.site_id}</td>
                  <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{asset.local_code}</td>
                  <td className={`p-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                        asset.criticality === 'CRITICAL'
                          ? isDark
                            ? 'bg-red-950/80 text-red-300 border-red-500/40'
                            : 'bg-red-100 text-red-950 border-red-300 font-extrabold'
                          : isDark
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                          : 'bg-blue-100 text-blue-950 border-blue-300 font-extrabold'
                      }`}
                    >
                      {asset.criticality}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                        asset.status === 'WARNING'
                          ? isDark
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                            : 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold'
                          : isDark
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contracts View */}
      {activeTab === 'contracts' && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all overflow-x-auto ${
            isDark
              ? 'bg-[#06060e]/90 border-cyan-500/20 text-white shadow-md'
              : 'bg-white border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            <thead
              className={`font-mono uppercase text-[10px] tracking-wider border-b ${
                isDark
                  ? 'bg-[#020204] text-cyan-400 border-cyan-500/20'
                  : 'bg-blue-50 text-blue-950 border-slate-300 font-extrabold'
              }`}
            >
              <tr>
                <th className="p-3">ID Объекта</th>
                <th className="p-3">План SLA</th>
                <th className="p-3">SLA Отклика</th>
                <th className="p-3">График Работы</th>
                <th className="p-3">Неустойка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20 font-sans">
              {filteredContracts.map((c) => (
                <tr key={c.site_id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>{c.site_id}</td>
                  <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{c.plan}</td>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.sla_minutes} мин.</td>
                  <td className="p-3 font-mono">{c.working_hours}</td>
                  <td className="p-3 text-rose-600 dark:text-rose-400 font-mono font-bold">{c.penalty_per_hour || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Open Tickets View */}
      {activeTab === 'tickets' && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all overflow-x-auto ${
            isDark
              ? 'bg-[#06060e]/90 border-cyan-500/20 text-white shadow-md'
              : 'bg-white border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            <thead
              className={`font-mono uppercase text-[10px] tracking-wider border-b ${
                isDark
                  ? 'bg-[#020204] text-cyan-400 border-cyan-500/20'
                  : 'bg-blue-50 text-blue-950 border-slate-300 font-extrabold'
              }`}
            >
              <tr>
                <th className="p-3">ID Заявки</th>
                <th className="p-3">ID Ассета</th>
                <th className="p-3">Суть Инцидента</th>
                <th className="p-3">Приоритет</th>
                <th className="p-3">Дедлайн SLA</th>
                <th className="p-3">Группа Исполнителей</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20 font-sans">
              {filteredTickets.map((t) => (
                <tr key={t.ticket_id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{t.ticket_id}</td>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>{t.asset_id}</td>
                  <td className={`p-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.summary}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded border font-mono font-bold text-[10px] ${
                        isDark
                          ? 'bg-red-950/80 text-red-300 border-red-500/40'
                          : 'bg-red-100 text-red-950 border-red-300 font-extrabold'
                      }`}
                    >
                      {t.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 font-mono">
                    {new Date(t.sla_deadline).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.assigned_group}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
