import React, { useState } from 'react';
import { DatabaseSchema } from '../mockDb';
import {
  Search,
  RotateCcw,
  Plus,
  Trash2,
  X,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Site, Asset, Contract, Ticket, Contractor } from '../types';

interface DatabaseInspectorViewProps {
  db: DatabaseSchema | null;
  onResetDatabase: () => void;
  isLoading: boolean;
  theme?: 'dark' | 'light';
  onUpdateDb?: (updatedDb: DatabaseSchema) => void;
}

export const DatabaseInspectorView: React.FC<DatabaseInspectorViewProps> = ({
  db,
  onResetDatabase,
  isLoading,
  theme = 'light',
  onUpdateDb,
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<
    'contractors' | 'sites' | 'assets' | 'contracts' | 'open_tickets' | 'closed_tickets'
  >('open_tickets');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterGroup('all');
    setCurrentPage(1);
  };

  // CRUD Modal State
  const [modalType, setModalType] = useState<
    'ADD_CONTRACTOR' | 'ADD_SITE' | 'ADD_ASSET' | 'ADD_TICKET' | 'ADD_CLOSED_TICKET' | null
  >(null);

  // Form States
  const [contractorForm, setContractorForm] = useState<Partial<Contractor>>({
    customer_id: '',
    name: '',
    inn: '',
    contact_phone: '',
    contact_email: '',
    contract_number: '',
    status: 'ACTIVE',
  });

  const [siteForm, setSiteForm] = useState<Partial<Site>>({
    site_id: '',
    customer_id: 'C-101',
    customer_name: 'ООО "СеверФуд"',
    address: '',
    contact_person: '',
    region: 'Москва и МО',
    timezone: 'Europe/Moscow',
  });

  const [assetForm, setAssetForm] = useState<Partial<Asset>>({
    asset_id: '',
    site_id: 'S-MSK-01',
    local_code: 'ХУ-19',
    name: '',
    criticality: 'HIGH',
    status: 'OK',
  });

  const [ticketForm, setTicketForm] = useState<Partial<Ticket>>({
    ticket_id: '',
    customer_id: 'C-101',
    site_id: 'S-MSK-01',
    asset_id: 'A-1001',
    priority: 'high',
    summary: '',
    description: '',
    assigned_group: 'Дежурная служба',
    status: 'NEW',
  });

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

  const filteredContractors = (db.contractors || []).filter(
    (c) =>
      c.name.toLowerCase().includes(term) ||
      c.inn.includes(term) ||
      c.customer_id.toLowerCase().includes(term)
  );

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

  const filteredOpenTickets = db.open_tickets.filter(
    (t) => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterPriority !== 'all' && t.priority.toLowerCase() !== filterPriority.toLowerCase()) return false;
      if (filterGroup !== 'all' && !t.assigned_group.toLowerCase().includes(filterGroup.toLowerCase())) return false;
      return (
      t.ticket_id.toLowerCase().includes(term) ||
      t.summary.toLowerCase().includes(term) ||
      t.asset_id.toLowerCase().includes(term)
      );
    }
  );

  const filteredClosedTickets = (db.closed_tickets || []).filter(
    (t) => {
      if (filterPriority !== 'all' && t.priority.toLowerCase() !== filterPriority.toLowerCase()) return false;
      if (filterGroup !== 'all' && !t.assigned_group.toLowerCase().includes(filterGroup.toLowerCase())) return false;
      return (
      t.ticket_id.toLowerCase().includes(term) ||
      t.summary.toLowerCase().includes(term) ||
      t.asset_id.toLowerCase().includes(term)
      );
    }
  );

  // Helper to commit DB update
  const commitDbChange = (newDb: DatabaseSchema) => {
    if (onUpdateDb) {
      onUpdateDb(newDb);
    }
  };

  // Close Ticket Handler
  const handleCloseTicket = (ticketId: string) => {
    const ticketToClose = db.open_tickets.find((t) => t.ticket_id === ticketId);
    if (!ticketToClose) return;

    const updatedTicket: Ticket = {
      ...ticketToClose,
      status: 'CLOSED',
      updated_at: new Date().toISOString(),
      history: [
        ...(ticketToClose.history || []),
        {
          timestamp: new Date().toISOString(),
          note: 'Заявка закрыта из интерфейса Реестра БД.',
          author: 'Диспетчер',
        },
      ],
    };

    const newDb: DatabaseSchema = {
      ...db,
      open_tickets: db.open_tickets.filter((t) => t.ticket_id !== ticketId),
      closed_tickets: [updatedTicket, ...(db.closed_tickets || [])],
    };

    commitDbChange(newDb);
  };

  // Delete Item Handlers
  const handleDeleteContractor = (id: string) => {
    commitDbChange({
      ...db,
      contractors: db.contractors.filter((c) => c.customer_id !== id),
    });
  };

  const handleDeleteSite = (id: string) => {
    commitDbChange({
      ...db,
      sites: db.sites.filter((s) => s.site_id !== id),
    });
  };

  const handleDeleteAsset = (id: string) => {
    commitDbChange({
      ...db,
      assets: db.assets.filter((a) => a.asset_id !== id),
    });
  };

  const handleDeleteOpenTicket = (id: string) => {
    commitDbChange({
      ...db,
      open_tickets: db.open_tickets.filter((t) => t.ticket_id !== id),
    });
  };

  const handleDeleteClosedTicket = (id: string) => {
    commitDbChange({
      ...db,
      closed_tickets: db.closed_tickets.filter((t) => t.ticket_id !== id),
    });
  };

  // Add Item Handlers
  const handleSaveContractor = () => {
    if (!contractorForm.name || !contractorForm.inn) return;
    const newContractor: Contractor = {
      customer_id: contractorForm.customer_id || `C-${Math.floor(Math.random() * 800 + 100)}`,
      name: contractorForm.name,
      inn: contractorForm.inn,
      contact_phone: contractorForm.contact_phone || '+7 (495) 000-00-00',
      contact_email: contractorForm.contact_email || 'info@company.ru',
      contract_number: contractorForm.contract_number || `ДОГ-${Date.now().toString().slice(-4)}`,
      status: 'ACTIVE',
    };

    commitDbChange({
      ...db,
      contractors: [newContractor, ...(db.contractors || [])],
    });
    setModalType(null);
  };

  const handleSaveSite = () => {
    if (!siteForm.address) return;
    const newSite: Site = {
      site_id: siteForm.site_id || `S-MSK-${Math.floor(Math.random() * 80 + 10)}`,
      customer_id: siteForm.customer_id || 'C-101',
      customer_name: siteForm.customer_name || 'ООО "СеверФуд"',
      address: siteForm.address,
      contact_person: siteForm.contact_person || 'Инженер объекта',
      timezone: siteForm.timezone || 'Europe/Moscow',
      region: siteForm.region || 'Москва и МО',
    };

    commitDbChange({
      ...db,
      sites: [newSite, ...db.sites],
    });
    setModalType(null);
  };

  const handleSaveAsset = () => {
    if (!assetForm.name) return;
    const newAsset: Asset = {
      asset_id: assetForm.asset_id || `A-${Math.floor(Math.random() * 8000 + 1000)}`,
      site_id: assetForm.site_id || 'S-MSK-01',
      local_code: assetForm.local_code || 'ХУ-20',
      name: assetForm.name,
      criticality: assetForm.criticality || 'HIGH',
      status: assetForm.status || 'OK',
    };

    commitDbChange({
      ...db,
      assets: [newAsset, ...db.assets],
    });
    setModalType(null);
  };

  const handleSaveTicket = (isClosed = false) => {
    if (!ticketForm.summary) return;
    const id = ticketForm.ticket_id || `T-${Math.floor(Math.random() * 800 + 100)}`;
    const newTicket: Ticket = {
      ticket_id: id,
      customer_id: ticketForm.customer_id || 'C-101',
      site_id: ticketForm.site_id || 'S-MSK-01',
      asset_id: ticketForm.asset_id || 'A-1001',
      priority: ticketForm.priority || 'high',
      summary: ticketForm.summary,
      description: ticketForm.description || 'Создано вручную через Реестр БД.',
      sla_deadline: new Date(Date.now() + 7200000).toISOString(),
      assigned_group: ticketForm.assigned_group || 'Дежурная служба',
      status: isClosed ? 'CLOSED' : 'NEW',
      created_at: new Date().toISOString(),
      history: [
        {
          timestamp: new Date().toISOString(),
          note: isClosed ? 'Заявка добавлена в Реестр Закрытых заявок.' : 'Заявка создана вручную.',
          author: 'Диспетчер БД',
        },
      ],
    };

    if (isClosed) {
      commitDbChange({
        ...db,
        closed_tickets: [newTicket, ...(db.closed_tickets || [])],
      });
    } else {
      commitDbChange({
        ...db,
        open_tickets: [newTicket, ...db.open_tickets],
      });
    }
    setModalType(null);
  };

  const renderPriorityBadge = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'high' || p === 'critical') {
      return (
        <span className="inline-flex min-w-[88px] items-center justify-center rounded-lg bg-[#EF4444] px-3.5 py-1.5 text-sm font-bold text-white shadow-sm">
          {p === 'critical' ? 'Критический' : 'Высокий'}
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="inline-flex min-w-[88px] items-center justify-center rounded-lg bg-[#F59E0B] px-3.5 py-1.5 text-sm font-bold text-white shadow-sm">
          Средний
        </span>
      );
    }
    return (
      <span className="inline-flex min-w-[88px] items-center justify-center rounded-lg bg-[#10B981] px-3.5 py-1.5 text-sm font-bold text-white shadow-sm">
        Низкий
      </span>
    );
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex min-w-[94px] items-center justify-center rounded-lg bg-[#3B82F6] px-3.5 py-1.5 text-sm font-bold text-white shadow-sm">
            В работе
          </span>
        );
      case 'WAITING_DISPATCHER':
        return (
          <span className="inline-flex min-w-[94px] items-center justify-center rounded-lg bg-[#6366F1] px-3.5 py-1.5 text-sm font-bold text-white shadow-sm">
            Диспетчер
          </span>
        );
      case 'WAITING_CLIENT':
        return (
          <span className="inline-flex min-w-[94px] items-center justify-center rounded-lg bg-[#8B5CF6] px-3.5 py-1.5 text-sm font-bold text-white shadow-sm">
            Клиент
          </span>
        );
      case 'NEW':
        return (
          <span className="inline-flex min-w-[94px] items-center justify-center rounded-lg bg-[#64748B] px-3.5 py-1.5 text-sm font-bold text-white shadow-sm">
            Новая
          </span>
        );
      case 'CLOSED':
      case 'RESOLVED':
        return (
          <span className="inline-flex min-w-[94px] items-center justify-center rounded-lg bg-[#0D9488] px-3.5 py-1.5 text-sm font-bold text-white shadow-sm">
            Закрыта
          </span>
        );
      default:
        return (
          <span className="inline-flex min-w-[94px] items-center justify-center rounded-lg bg-[#64748B] px-3.5 py-1.5 text-sm font-bold text-white shadow-sm">
            {status}
          </span>
        );
    }
  };

  const getCurrentTabTotal = () => {
    switch (activeTab) {
      case 'open_tickets':
        return filteredOpenTickets.length;
      case 'closed_tickets':
        return filteredClosedTickets.length;
      case 'contractors':
        return filteredContractors.length;
      case 'sites':
        return filteredSites.length;
      case 'assets':
        return filteredAssets.length;
      default:
        return 0;
    }
  };

  const totalItems = getCurrentTabTotal();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const pagedOpenTickets = filteredOpenTickets.slice(startIndex, endIndex);
  const pagedClosedTickets = filteredClosedTickets.slice(startIndex, endIndex);
  const pagedContractors = filteredContractors.slice(startIndex, endIndex);
  const pagedSites = filteredSites.slice(startIndex, endIndex);
  const pagedAssets = filteredAssets.slice(startIndex, endIndex);

  return (
    <div id="database-inspector-page" className="mx-auto w-full max-w-[1780px] pb-24 pt-2 sm:pt-4 lg:pb-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-black tracking-tight sm:text-[30px]">Реестр</h1>
        <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
          Управление контрагентами, объектами, оборудованием и заявками.
        </p>
      </div>

      {/* Main Registry Card */}
      <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-slate-700 bg-[#242438]' : 'border-[#c8c8c8] bg-white'}`}>
        {/* Top Tabs Bar */}
        <div className={`flex flex-col gap-4 border-b px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between ${isDark ? 'border-slate-700' : 'border-[#e0e0e0]'}`}>
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            {[
              { key: 'open_tickets' as const, label: 'Открытые заявки' },
              { key: 'closed_tickets' as const, label: 'Закрытые заявки' },
              { key: 'contractors' as const, label: 'Контрагенты' },
              { key: 'sites' as const, label: 'Объекты' },
              { key: 'assets' as const, label: 'Оборудование' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setCurrentPage(1);
                }}
                className={`relative pb-1 text-sm font-extrabold transition ${
                  activeTab === tab.key
                    ? isDark ? 'text-white' : 'text-black'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-[#686868] hover:text-black'
                }`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.key && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#2d7a7a]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'open_tickets' && (
              <button
                type="button"
                onClick={() => setModalType('ADD_TICKET')}
                className="flex items-center gap-1.5 rounded-lg bg-[#2d7a7a] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#236565]"
              >
                <Plus className="h-4 w-4" />
                <span>Создать заявку</span>
              </button>
            )}
            {activeTab === 'closed_tickets' && (
              <button
                type="button"
                onClick={() => setModalType('ADD_CLOSED_TICKET')}
                className="flex items-center gap-1.5 rounded-lg bg-[#2d7a7a] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#236565]"
              >
                <Plus className="h-4 w-4" />
                <span>Добавить заявку</span>
              </button>
            )}
            {activeTab === 'contractors' && (
              <button
                type="button"
                onClick={() => setModalType('ADD_CONTRACTOR')}
                className="flex items-center gap-1.5 rounded-lg bg-[#2d7a7a] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#236565]"
              >
                <Plus className="h-4 w-4" />
                <span>Добавить контрагента</span>
              </button>
            )}
            {activeTab === 'sites' && (
              <button
                type="button"
                onClick={() => setModalType('ADD_SITE')}
                className="flex items-center gap-1.5 rounded-lg bg-[#2d7a7a] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#236565]"
              >
                <Plus className="h-4 w-4" />
                <span>Добавить объект</span>
              </button>
            )}
            {activeTab === 'assets' && (
              <button
                type="button"
                onClick={() => setModalType('ADD_ASSET')}
                className="flex items-center gap-1.5 rounded-lg bg-[#2d7a7a] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#236565]"
              >
                <Plus className="h-4 w-4" />
                <span>Добавить оборудование</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className={`grid grid-cols-1 gap-3 border-b p-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#e0e0e0] bg-white'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по реестру..."
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
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full rounded-lg border px-3 py-2 text-xs font-bold outline-none ${
                isDark ? 'border-slate-700 bg-[#242438] text-white' : 'border-[#c8c8c8] bg-white text-black'
              }`}
            >
              <option value="all">Статус: Все</option>
              <option value="NEW">Статус: Новая</option>
              <option value="IN_PROGRESS">Статус: В работе</option>
              <option value="WAITING_DISPATCHER">Статус: Диспетчер</option>
              <option value="WAITING_CLIENT">Статус: Клиент</option>
              <option value="CLOSED">Статус: Закрыта</option>
            </select>
          </div>

          <div>
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full rounded-lg border px-3 py-2 text-xs font-bold outline-none ${
                isDark ? 'border-slate-700 bg-[#242438] text-white' : 'border-[#c8c8c8] bg-white text-black'
              }`}
            >
              <option value="all">Приоритет: Все</option>
              <option value="critical">Приоритет: Критический</option>
              <option value="high">Приоритет: Высокий</option>
              <option value="medium">Приоритет: Средний</option>
              <option value="low">Приоритет: Низкий</option>
            </select>
          </div>

          <div>
            <select
              value={filterGroup}
              onChange={(e) => {
                setFilterGroup(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full rounded-lg border px-3 py-2 text-xs font-bold outline-none ${
                isDark ? 'border-slate-700 bg-[#242438] text-white' : 'border-[#c8c8c8] bg-white text-black'
              }`}
            >
              <option value="all">Группа: Все</option>
              <option value="Холод-МСК">Группа: Холод-МСК</option>
              <option value="СПб Сервис">Группа: СПб Сервис</option>
              <option value="Урал">Группа: Урал Сервис</option>
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

        {/* Open Tickets Table */}
        {activeTab === 'open_tickets' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-[11px] font-bold ${isDark ? 'border-slate-700 bg-[#1c1a2e] text-slate-400' : 'border-[#e0e0e0] bg-[#fafafa] text-[#707070]'}`}>
                <tr>
                  <th className="px-5 py-3">ID заявки</th>
                  <th className="px-4 py-3">ID актива</th>
                  <th className="px-4 py-3">Суть обращения</th>
                  <th className="px-4 py-3 text-center">Приоритет</th>
                  <th className="px-4 py-3 text-center">Статус</th>
                  <th className="px-4 py-3">Группа</th>
                  <th className="px-4 py-3">Обновлено</th>
                  <th className="px-5 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium dark:divide-slate-700">
                {pagedOpenTickets.map((t) => (
                  <tr key={t.ticket_id} className={`transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    <td className="px-5 py-4 font-black">{t.ticket_id}</td>
                    <td className="px-4 py-4 font-extrabold text-[#2d7a7a]">{t.asset_id}</td>
                    <td className="px-4 py-4 font-extrabold leading-snug">{t.summary}</td>
                    <td className="px-4 py-4 text-center">{renderPriorityBadge(t.priority)}</td>
                    <td className="px-4 py-4 text-center">{renderStatusBadge(t.status)}</td>
                    <td className={`px-4 py-4 font-semibold ${isDark ? 'text-slate-300' : 'text-[#505050]'}`}>
                      <div>{t.assigned_group}</div>
                    </td>
                    <td className={`px-4 py-4 text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
                      <div>{new Date(t.created_at).toLocaleDateString('ru-RU')}</div>
                      <div>{new Date(t.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleCloseTicket(t.ticket_id)}
                          className={`rounded border px-2.5 py-1 text-xs font-extrabold transition ${
                            isDark ? 'border-slate-700 bg-transparent text-slate-200 hover:bg-white/10' : 'border-[#c8c8c8] bg-white text-black hover:bg-slate-50'
                          }`}
                        >
                          Закрыть
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOpenTicket(t.ticket_id)}
                          className="p-1 text-slate-400 transition hover:text-red-500"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedOpenTickets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-xs font-semibold text-slate-400">
                      Нет заявок по заданным критериям
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Closed Tickets Table */}
        {activeTab === 'closed_tickets' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-[11px] font-bold ${isDark ? 'border-slate-700 bg-[#1c1a2e] text-slate-400' : 'border-[#e0e0e0] bg-[#fafafa] text-[#707070]'}`}>
                <tr>
                  <th className="px-5 py-3">ID заявки</th>
                  <th className="px-4 py-3">ID актива</th>
                  <th className="px-4 py-3">Суть заявки</th>
                  <th className="px-4 py-3 text-center">Приоритет</th>
                  <th className="px-4 py-3 text-center">Статус</th>
                  <th className="px-4 py-3">Группа</th>
                  <th className="px-4 py-3">Дата закрытия</th>
                  <th className="px-5 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium dark:divide-slate-700">
                {pagedClosedTickets.map((t) => (
                  <tr key={t.ticket_id} className={`transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    <td className="px-5 py-4 font-black">{t.ticket_id}</td>
                    <td className="px-4 py-4 font-extrabold text-[#2d7a7a]">{t.asset_id}</td>
                    <td className="px-4 py-4 font-extrabold leading-snug">{t.summary}</td>
                    <td className="px-4 py-4 text-center">{renderPriorityBadge(t.priority)}</td>
                    <td className="px-4 py-4 text-center">{renderStatusBadge(t.status)}</td>
                    <td className={`px-4 py-4 font-semibold ${isDark ? 'text-slate-300' : 'text-[#505050]'}`}>{t.assigned_group}</td>
                    <td className={`px-4 py-4 text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
                      {t.updated_at ? new Date(t.updated_at).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteClosedTicket(t.ticket_id)}
                        className="p-1 text-slate-400 transition hover:text-red-500"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {pagedClosedTickets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-xs font-semibold text-slate-400">
                      Нет закрытых заявок
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Contractors Table */}
        {activeTab === 'contractors' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-[11px] font-bold ${isDark ? 'border-slate-700 bg-[#1c1a2e] text-slate-400' : 'border-[#e0e0e0] bg-[#fafafa] text-[#707070]'}`}>
                <tr>
                  <th className="px-5 py-3">ID Контрагента</th>
                  <th className="px-4 py-3">Наименование</th>
                  <th className="px-4 py-3">ИНН</th>
                  <th className="px-4 py-3">Телефон</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Договор</th>
                  <th className="px-5 py-3 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium dark:divide-slate-700">
                {pagedContractors.map((c) => (
                  <tr key={c.customer_id} className={`transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    <td className="px-5 py-4 font-black text-[#2d7a7a]">{c.customer_id}</td>
                    <td className="px-4 py-4 font-extrabold">{c.name}</td>
                    <td className="px-4 py-4 font-mono font-bold">{c.inn}</td>
                    <td className={`px-4 py-4 ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>{c.contact_phone}</td>
                    <td className={`px-4 py-4 ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>{c.contact_email}</td>
                    <td className="px-4 py-4 font-bold text-[#d56600]">{c.contract_number}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteContractor(c.customer_id)}
                        className="p-1 text-slate-400 transition hover:text-red-500"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sites Table */}
        {activeTab === 'sites' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-[11px] font-bold ${isDark ? 'border-slate-700 bg-[#1c1a2e] text-slate-400' : 'border-[#e0e0e0] bg-[#fafafa] text-[#707070]'}`}>
                <tr>
                  <th className="px-5 py-3">ID Объекта</th>
                  <th className="px-4 py-3">Клиент</th>
                  <th className="px-4 py-3">Адрес</th>
                  <th className="px-4 py-3">Контактное лицо</th>
                  <th className="px-4 py-3">Регион</th>
                  <th className="px-5 py-3 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium dark:divide-slate-700">
                {pagedSites.map((site) => (
                  <tr key={site.site_id} className={`transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    <td className="px-5 py-4 font-black text-[#2d7a7a]">{site.site_id}</td>
                    <td className="px-4 py-4 font-extrabold">{site.customer_name}</td>
                    <td className="px-4 py-4 font-medium">{site.address}</td>
                    <td className={`px-4 py-4 ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>{site.contact_person}</td>
                    <td className={`px-4 py-4 font-bold ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>{site.region}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSite(site.site_id)}
                        className="p-1 text-slate-400 transition hover:text-red-500"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Assets Table */}
        {activeTab === 'assets' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
             <thead className={`border-b text-[11px] font-bold ${isDark ? 'border-slate-700 bg-[#1c1a2e] text-slate-400' : 'border-[#e0e0e0] bg-[#fafafa] text-[#707070]'}`}>
                <tr>
                  <th className="px-5 py-3">ID Ассета</th>
                  <th className="px-4 py-3">Код объекта</th>
                  <th className="px-4 py-3">Локальный код</th>
                  <th className="px-4 py-3">Наименование оборудования</th>
                  <th className="px-4 py-3 text-center">Критичность</th>
                  <th className="px-4 py-3 text-center">Статус</th>
                  <th className="px-5 py-3 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium dark:divide-slate-700">
                {pagedAssets.map((asset) => (
                  <tr key={asset.asset_id} className={`transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    <td className="px-5 py-4 font-mono font-bold text-slate-400">{asset.asset_id}</td>
                    <td className="px-4 py-4 font-black text-[#2d7a7a]">{asset.site_id}</td>
                    <td className="px-4 py-4 font-black text-[#d56600]">{asset.local_code}</td>
                    <td className="px-4 py-4 font-extrabold">{asset.name}</td>
                    <td className="px-4 py-4 text-center">{renderPriorityBadge(asset.criticality)}</td>
                    <td className="px-4 py-4 text-center">{renderStatusBadge(asset.status)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(asset.asset_id)}
                        className="p-1 text-slate-400 transition hover:text-red-500"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination Footer */}
        <div className={`flex flex-col gap-3 border-t px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${isDark ? 'border-slate-700 text-slate-400' : 'border-[#e0e0e0] text-[#707070]'}`}>
          <span className="text-xs font-semibold">
            Показано 1-{activeTab === 'open_tickets' ? pagedOpenTickets.length : activeTab === 'closed_tickets' ? pagedClosedTickets.length : pagedContractors.length} из {totalItems}
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

      {/* MODAL DIALOGS FOR ADDING DATA */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl p-6 border shadow-2xl ${isDark ? 'bg-[#0a0a16] border-cyan-500/40 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-700/30">
              <h3 className="text-sm font-mono font-bold uppercase text-cyan-400">
                {modalType === 'ADD_CONTRACTOR' && 'Добавить нового Контрагента'}
                {modalType === 'ADD_SITE' && 'Добавить новый Объект'}
                {modalType === 'ADD_ASSET' && 'Добавить новое Оборудование'}
                {modalType === 'ADD_TICKET' && 'Создать Открытую Заявку'}
                {modalType === 'ADD_CLOSED_TICKET' && 'Добавить Завершенную Заявку'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contractor Form */}
            {modalType === 'ADD_CONTRACTOR' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Наименование компании:</label>
                  <input
                    type="text"
                    placeholder="ООO «СеверТранс»"
                    value={contractorForm.name}
                    onChange={(e) => setContractorForm({ ...contractorForm, name: e.target.value })}
                    className="w-full p-2 rounded-lg bg-black/60 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">ИНН Компании:</label>
                  <input
                    type="text"
                    placeholder="7701998877"
                    value={contractorForm.inn}
                    onChange={(e) => setContractorForm({ ...contractorForm, inn: e.target.value })}
                    className="w-full p-2 rounded-lg bg-black/60 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Контактный телефон:</label>
                  <input
                    type="text"
                    placeholder="+7 (495) 777-88-99"
                    value={contractorForm.contact_phone}
                    onChange={(e) => setContractorForm({ ...contractorForm, contact_phone: e.target.value })}
                    className="w-full p-2 rounded-lg bg-black/60 border border-slate-700 text-white"
                  />
                </div>
                <button
                  onClick={handleSaveContractor}
                  className="w-full py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold mt-2 border border-emerald-700 shadow-md"
                >
                  Сохранить Контрагента
                </button>
              </div>
            )}

            {/* Site Form */}
            {modalType === 'ADD_SITE' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Адрес Объекта:</label>
                  <input
                    type="text"
                    placeholder="г. Москва, ул. Ленина 45"
                    value={siteForm.address}
                    onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
                    className="w-full p-2 rounded-lg bg-black/60 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Контактное Лицо:</label>
                  <input
                    type="text"
                    placeholder="Иван (главный энергетик)"
                    value={siteForm.contact_person}
                    onChange={(e) => setSiteForm({ ...siteForm, contact_person: e.target.value })}
                    className="w-full p-2 rounded-lg bg-black/60 border border-slate-700 text-white"
                  />
                </div>
                <button
                  onClick={handleSaveSite}
                  className="w-full py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold mt-2 border border-emerald-700 shadow-md"
                >
                  Сохранить Объект
                </button>
              </div>
            )}

            {/* Asset Form */}
            {modalType === 'ADD_ASSET' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Локальный Код (например ХУ-19):</label>
                  <input
                    type="text"
                    placeholder="ХУ-19"
                    value={assetForm.local_code}
                    onChange={(e) => setAssetForm({ ...assetForm, local_code: e.target.value })}
                    className="w-full p-2 rounded-lg bg-black/60 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Наименование Оборудования:</label>
                  <input
                    type="text"
                    placeholder="Компрессорная станция №4"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    className="w-full p-2 rounded-lg bg-black/60 border border-slate-700 text-white"
                  />
                </div>
                <button
                  onClick={handleSaveAsset}
                  className="w-full py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold mt-2 border border-emerald-700 shadow-md"
                >
                  Сохранить Оборудование
                </button>
              </div>
            )}

            {/* Ticket Form */}
            {(modalType === 'ADD_TICKET' || modalType === 'ADD_CLOSED_TICKET') && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Суть Инцидента:</label>
                  <input
                    type="text"
                    placeholder="Утечка фреона на компрессоре ХУ-17"
                    value={ticketForm.summary}
                    onChange={(e) => setTicketForm({ ...ticketForm, summary: e.target.value })}
                    className="w-full p-2 rounded-lg bg-black/60 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Группа Исполнителей:</label>
                  <input
                    type="text"
                    placeholder="Группа №2 (Холод-МСК)"
                    value={ticketForm.assigned_group}
                    onChange={(e) => setTicketForm({ ...ticketForm, assigned_group: e.target.value })}
                    className="w-full p-2 rounded-lg bg-black/60 border border-slate-700 text-white"
                  />
                </div>
                <button
                  onClick={() => handleSaveTicket(modalType === 'ADD_CLOSED_TICKET')}
                  className="w-full py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold mt-2 border border-emerald-700 shadow-md"
                >
                  {modalType === 'ADD_CLOSED_TICKET' ? 'Сохранить Закрытую Заявку' : 'Создать Открытую Заявку'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
