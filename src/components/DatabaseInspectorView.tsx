import React, { useState } from 'react';
import { DatabaseSchema } from '../mockDb';
import {
  Database,
  Search,
  RotateCcw,
  Building,
  Cpu,
  FileText,
  AlertCircle,
  Users,
  CheckCircle2,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
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
  theme = 'dark',
  onUpdateDb,
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<
    'contractors' | 'sites' | 'assets' | 'contracts' | 'open_tickets' | 'closed_tickets'
  >('open_tickets');
  const [searchTerm, setSearchTerm] = useState('');

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
            ? 'bg-[#1C1B1B] border-[#2A2A2A] text-slate-500'
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
    (t) =>
      t.ticket_id.toLowerCase().includes(term) ||
      t.summary.toLowerCase().includes(term) ||
      t.asset_id.toLowerCase().includes(term)
  );

  const filteredClosedTickets = (db.closed_tickets || []).filter(
    (t) =>
      t.ticket_id.toLowerCase().includes(term) ||
      t.summary.toLowerCase().includes(term) ||
      t.asset_id.toLowerCase().includes(term)
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

  return (
    <div id="database-inspector-page" className="space-y-4 font-sans">
      {/* Header & Controls */}
      <div
        className={`rounded-2xl p-4 sm:p-5 transition-all border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? 'bg-[#1C1B1B] border-[#2A2A2A] shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white'
            : 'bg-white border-slate-300 shadow-sm text-slate-900'
        }`}
      >
        <div>
          <div className="flex items-center space-x-2">
            <Database className={`h-4 w-4 ${isDark ? 'text-slate-300' : 'text-blue-900'}`} />
            <h2 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-blue-950'}`}>
              Реестр Базы Данных (CRUD & Заявки)
            </h2>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
            Управление контрагентами, объектами, оборудованием, открытыми и закрытыми заявками в реальном времени.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-full md:w-64 font-mono">
            <input
              type="text"
              placeholder="Поиск по БД..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none transition ${
                isDark
                ? 'bg-[#222222] border-[#2A2A2A] text-white focus:border-slate-400'
                : 'bg-slate-50 border-slate-300 text-blue-950 font-bold focus:border-blue-900'
            }`}
            />
            <Search className={`absolute left-2.5 top-2 h-3.5 w-3.5 ${isDark ? 'text-slate-400' : 'text-blue-900'}`} />
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
            <RotateCcw className={`h-3.5 w-3.5 ${isDark ? 'text-slate-400' : 'text-blue-900'}`} />
            <span>Сбросить БД</span>
          </button>
        </div>
      </div>

      {/* Internal Nav Tabs with Add buttons */}
      <div className={`flex items-center justify-between border-b pb-2 font-mono overflow-x-auto gap-2 ${isDark ? 'border-slate-700/30' : 'border-slate-300'}`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('open_tickets')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === 'open_tickets'
                ? isDark
                  ? 'bg-[#222222] text-slate-100 border border-[#2A2A2A]'
                  : 'bg-blue-950 text-white shadow-md font-extrabold border border-blue-950'
                : isDark
                ? 'bg-[#222222]/60 text-slate-400 hover:text-white'
                : 'bg-slate-200 text-slate-900 border border-slate-300 hover:bg-slate-300 hover:text-slate-950 font-extrabold'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Открытые Заявки ({db.open_tickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('closed_tickets')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === 'closed_tickets'
                ? isDark
                  ? 'bg-[#222222] text-slate-100 border border-[#2A2A2A]'
                  : 'bg-blue-950 text-white shadow-md font-extrabold border border-blue-950'
                : isDark
                ? 'bg-[#222222]/60 text-slate-400 hover:text-white'
                : 'bg-slate-200 text-slate-900 border border-slate-300 hover:bg-slate-300 hover:text-slate-950 font-extrabold'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Закрытые Заявки ({(db.closed_tickets || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('contractors')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === 'contractors'
                ? isDark
                  ? 'bg-[#222222] text-slate-100 border border-[#2A2A2A]'
                  : 'bg-blue-950 text-white shadow-md font-extrabold border border-blue-950'
                : isDark
                ? 'bg-[#222222]/60 text-slate-400 hover:text-white'
                : 'bg-slate-200 text-slate-900 border border-slate-300 hover:bg-slate-300 hover:text-slate-950 font-extrabold'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Контрагенты ({(db.contractors || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sites')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === 'sites'
                ? isDark
                  ? 'bg-[#222222] text-slate-100 border border-[#2A2A2A]'
                  : 'bg-blue-950 text-white shadow-md font-extrabold border border-blue-950'
                : isDark
                ? 'bg-[#222222]/60 text-slate-400 hover:text-white'
                : 'bg-slate-200 text-slate-900 border border-slate-300 hover:bg-slate-300 hover:text-slate-950 font-extrabold'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Объекты ({db.sites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === 'assets'
                ? isDark
                  ? 'bg-[#222222] text-slate-100 border border-[#2A2A2A]'
                  : 'bg-blue-950 text-white shadow-md font-extrabold border border-blue-950'
                : isDark
                ? 'bg-[#222222]/60 text-slate-400 hover:text-white'
                : 'bg-slate-200 text-slate-900 border border-slate-300 hover:bg-slate-300 hover:text-slate-950 font-extrabold'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Оборудование ({db.assets.length})</span>
          </button>
        </div>

        {/* Action Button for Current Tab */}
        <div>
          {activeTab === 'contractors' && (
            <button
              onClick={() => setModalType('ADD_CONTRACTOR')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition text-xs ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2A2A2A] text-slate-200 border border-[#2A2A2A] hover:border-slate-500/50 font-bold'
                  : 'bg-blue-900 hover:bg-blue-950 text-white font-extrabold shadow-md border border-blue-950'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Добавить Контрагента</span>
            </button>
          )}

          {activeTab === 'sites' && (
            <button
              onClick={() => setModalType('ADD_SITE')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition text-xs ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2A2A2A] text-slate-200 border border-[#2A2A2A] hover:border-slate-500/50 font-bold'
                  : 'bg-blue-900 hover:bg-blue-950 text-white font-extrabold shadow-md border border-blue-950'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Добавить Объект</span>
            </button>
          )}

          {activeTab === 'assets' && (
            <button
              onClick={() => setModalType('ADD_ASSET')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition text-xs ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2A2A2A] text-slate-200 border border-[#2A2A2A] hover:border-slate-500/50 font-bold'
                  : 'bg-blue-900 hover:bg-blue-950 text-white font-extrabold shadow-md border border-blue-950'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Добавить Оборудование</span>
            </button>
          )}

          {activeTab === 'open_tickets' && (
            <button
              onClick={() => setModalType('ADD_TICKET')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition text-xs ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2A2A2A] text-slate-200 border border-[#2A2A2A] hover:border-slate-500/50 font-bold'
                  : 'bg-blue-900 hover:bg-blue-950 text-white font-extrabold shadow-md border border-blue-950'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Создать Открытую Заявку</span>
            </button>
          )}

          {activeTab === 'closed_tickets' && (
            <button
              onClick={() => setModalType('ADD_CLOSED_TICKET')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition text-xs ${
                isDark
                  ? 'bg-[#222222] hover:bg-[#2A2A2A] text-slate-200 border border-[#2A2A2A] hover:border-slate-500/50 font-bold'
                  : 'bg-blue-900 hover:bg-blue-950 text-white font-extrabold shadow-md border border-blue-950'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Добавить Закрытую Заявку</span>
            </button>
          )}
        </div>
      </div>

      {/* CONTRACTORS TABLE */}
      {activeTab === 'contractors' && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all overflow-x-auto ${
            isDark
            ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white shadow-md'
            : 'bg-white border-slate-300 text-slate-900 shadow-sm'
        }`}
      >
        <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
          <thead className={`font-mono uppercase text-[10px] tracking-wider border-b ${isDark ? 'bg-[#222222] text-slate-300 border-[#2A2A2A]' : 'bg-blue-50 text-blue-950 font-extrabold'}`}>
              <tr>
                <th className="p-3">ID Контрагента</th>
                <th className="p-3">Наименование</th>
                <th className="p-3">ИНН</th>
                <th className="p-3">Телефон</th>
                <th className="p-3">Email</th>
                <th className="p-3">Договор</th>
                <th className="p-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-sans ${isDark ? 'divide-slate-700/20' : 'divide-slate-200'}`}>
              {filteredContractors.map((c) => (
                <tr key={c.customer_id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-slate-200' : 'text-sky-800'}`}>{c.customer_id}</td>
                  <td className="p-3 font-bold">{c.name}</td>
                  <td className="p-3 font-mono">{c.inn}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{c.contact_phone}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{c.contact_email}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-300' : 'text-amber-800'}`}>{c.contract_number}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteContractor(c.customer_id)}
                      className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10"
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

      {/* SITES TABLE */}
      {activeTab === 'sites' && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all overflow-x-auto ${
            isDark
              ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white shadow-md'
              : 'bg-white border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            <thead className={`font-mono uppercase text-[10px] tracking-wider border-b ${isDark ? 'bg-[#222222] text-slate-300 border-[#2A2A2A]' : 'bg-blue-50 text-blue-950 font-extrabold'}`}>
              <tr>
                <th className="p-3">ID Объекта</th>
                <th className="p-3">Клиент</th>
                <th className="p-3">Адрес</th>
                <th className="p-3">Контактное Лицо</th>
                <th className="p-3">Регион</th>
                <th className="p-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-sans ${isDark ? 'divide-slate-700/20' : 'divide-slate-200'}`}>
              {filteredSites.map((site) => (
                <tr key={site.site_id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-slate-200' : 'text-blue-950'}`}>{site.site_id}</td>
                  <td className="p-3 font-bold">{site.customer_name}</td>
                  <td className="p-3">{site.address}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{site.contact_person}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{site.region}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteSite(site.site_id)}
                      className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10"
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

      {/* ASSETS TABLE */}
      {activeTab === 'assets' && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all overflow-x-auto ${
            isDark
              ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white shadow-md'
              : 'bg-white border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            <thead className={`font-mono uppercase text-[10px] tracking-wider border-b ${isDark ? 'bg-[#222222] text-slate-300 border-[#2A2A2A]' : 'bg-blue-50 text-blue-950 font-extrabold'}`}>
              <tr>
                <th className="p-3">ID Ассета</th>
                <th className="p-3">Код Объекта</th>
                <th className="p-3">Локальный Код</th>
                <th className="p-3">Наименование Оборудования</th>
                <th className="p-3">Критичность</th>
                <th className="p-3">Статус</th>
                <th className="p-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-sans ${isDark ? 'divide-slate-700/20' : 'divide-slate-200'}`}>
              {filteredAssets.map((asset) => (
                <tr key={asset.asset_id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{asset.asset_id}</td>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-slate-200' : 'text-blue-950'}`}>{asset.site_id}</td>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-slate-300' : 'text-amber-800'}`}>{asset.local_code}</td>
                  <td className="p-3 font-semibold">{asset.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${isDark ? 'bg-red-500/10 text-red-300 border-red-500/25' : 'bg-red-100 text-red-900 border-red-300'}`}>
                      {asset.criticality}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${isDark ? 'bg-[#222222] text-slate-300 border-[#2A2A2A]' : 'bg-emerald-100 text-emerald-900 border-emerald-300'}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteAsset(asset.asset_id)}
                      className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10"
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

      {/* OPEN TICKETS TABLE */}
      {activeTab === 'open_tickets' && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all overflow-x-auto ${
            isDark
              ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white shadow-md'
              : 'bg-white border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            <thead className={`font-mono uppercase text-[10px] tracking-wider border-b ${isDark ? 'bg-[#222222] text-slate-300 border-[#2A2A2A]' : 'bg-blue-50 text-blue-950 font-extrabold'}`}>
              <tr>
                <th className="p-3">ID Заявки</th>
                <th className="p-3">ID Ассета</th>
                <th className="p-3">Суть Инцидента</th>
                <th className="p-3">Приоритет</th>
                <th className="p-3">Статус</th>
                <th className="p-3">Группа</th>
                <th className="p-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-sans ${isDark ? 'divide-slate-700/20' : 'divide-slate-200'}`}>
              {filteredOpenTickets.map((t) => (
                <tr key={t.ticket_id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-slate-200' : 'text-amber-800'}`}>{t.ticket_id}</td>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-slate-300' : 'text-blue-950'}`}>{t.asset_id}</td>
                  <td className="p-3 font-semibold">{t.summary}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded border font-mono font-bold text-[10px] ${isDark ? 'bg-red-500/10 text-red-300 border-red-500/25' : 'bg-red-100 text-red-900 border-red-300'}`}>
                      {t.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-slate-300' : 'text-blue-950'}`}>{t.status}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.assigned_group}</td>
                  <td className="p-3 text-right flex items-center justify-end space-x-1">
                    <button
                      onClick={() => handleCloseTicket(t.ticket_id)}
                      className={`px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 font-mono text-[10px] flex items-center space-x-1 ${
                        isDark ? 'text-emerald-300 font-bold' : 'text-emerald-950 font-extrabold'
                      }`}
                      title="Завершить и перенести в архив"
                    >
                      <Check className="h-3 w-3" />
                      <span>Завершить</span>
                    </button>
                    <button
                      onClick={() => handleDeleteOpenTicket(t.ticket_id)}
                      className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10"
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

      {/* CLOSED TICKETS TABLE */}
      {activeTab === 'closed_tickets' && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all overflow-x-auto ${
            isDark
              ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white shadow-md'
              : 'bg-white border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            <thead className={`font-mono uppercase text-[10px] tracking-wider border-b ${isDark ? 'bg-[#222222] text-slate-300 border-[#2A2A2A]' : 'bg-blue-50 text-blue-950 font-extrabold'}`}>
              <tr>
                <th className="p-3">ID Заявки</th>
                <th className="p-3">ID Ассета</th>
                <th className="p-3">Суть Заявки</th>
                <th className="p-3">Приоритет</th>
                <th className="p-3">Дата Завершения</th>
                <th className="p-3">Статус</th>
                <th className="p-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-sans ${isDark ? 'divide-slate-700/20' : 'divide-slate-200'}`}>
              {filteredClosedTickets.map((t) => (
                <tr key={t.ticket_id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-slate-200' : 'text-emerald-800'}`}>{t.ticket_id}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.asset_id}</td>
                  <td className={`p-3 font-semibold line-through ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.summary}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.priority}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {t.updated_at ? new Date(t.updated_at).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded border font-mono font-bold text-[10px] ${isDark ? 'bg-[#222222] text-slate-300 border-[#2A2A2A]' : 'bg-emerald-100 text-emerald-900 border-emerald-300'}`}>
                      CLOSED
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteClosedTicket(t.ticket_id)}
                      className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10"
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

      {/* MODAL DIALOGS FOR ADDING DATA */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl p-6 border shadow-2xl ${isDark ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
            <div className={`flex items-center justify-between mb-4 border-b pb-3 ${isDark ? 'border-slate-700/30' : 'border-slate-200'}`}>
              <h3 className={`text-sm font-mono font-bold uppercase ${isDark ? 'text-slate-100' : 'text-blue-950'}`}>
                {modalType === 'ADD_CONTRACTOR' && 'Добавить нового Контрагента'}
                {modalType === 'ADD_SITE' && 'Добавить новый Объект'}
                {modalType === 'ADD_ASSET' && 'Добавить новое Оборудование'}
                {modalType === 'ADD_TICKET' && 'Создать Открытую Заявку'}
                {modalType === 'ADD_CLOSED_TICKET' && 'Добавить Завершенную Заявку'}
              </h3>
              <button onClick={() => setModalType(null)} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contractor Form */}
            {modalType === 'ADD_CONTRACTOR' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Наименование компании:</label>
                  <input
                    type="text"
                    placeholder="ООO «СеверТранс»"
                    value={contractorForm.name}
                    onChange={(e) => setContractorForm({ ...contractorForm, name: e.target.value })}
                    className={`w-full p-2 rounded-lg border ${isDark ? 'bg-black/60 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>ИНН Компании:</label>
                  <input
                    type="text"
                    placeholder="7701998877"
                    value={contractorForm.inn}
                    onChange={(e) => setContractorForm({ ...contractorForm, inn: e.target.value })}
                    className={`w-full p-2 rounded-lg border ${isDark ? 'bg-black/60 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Контактный телефон:</label>
                  <input
                    type="text"
                    placeholder="+7 (495) 777-88-99"
                    value={contractorForm.contact_phone}
                    onChange={(e) => setContractorForm({ ...contractorForm, contact_phone: e.target.value })}
                    className={`w-full p-2 rounded-lg border ${isDark ? 'bg-black/60 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
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
                  <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Адрес Объекта:</label>
                  <input
                    type="text"
                    placeholder="г. Москва, ул. Ленина 45"
                    value={siteForm.address}
                    onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
                    className={`w-full p-2 rounded-lg border ${isDark ? 'bg-black/60 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Контактное Лицо:</label>
                  <input
                    type="text"
                    placeholder="Иван (главный энергетик)"
                    value={siteForm.contact_person}
                    onChange={(e) => setSiteForm({ ...siteForm, contact_person: e.target.value })}
                    className={`w-full p-2 rounded-lg border ${isDark ? 'bg-black/60 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
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
                  <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Локальный Код (например ХУ-19):</label>
                  <input
                    type="text"
                    placeholder="ХУ-19"
                    value={assetForm.local_code}
                    onChange={(e) => setAssetForm({ ...assetForm, local_code: e.target.value })}
                    className={`w-full p-2 rounded-lg border ${isDark ? 'bg-black/60 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Наименование Оборудования:</label>
                  <input
                    type="text"
                    placeholder="Компрессорная станция №4"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    className={`w-full p-2 rounded-lg border ${isDark ? 'bg-black/60 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
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
                  <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Суть Инцидента:</label>
                  <input
                    type="text"
                    placeholder="Утечка фреона на компрессоре ХУ-17"
                    value={ticketForm.summary}
                    onChange={(e) => setTicketForm({ ...ticketForm, summary: e.target.value })}
                    className={`w-full p-2 rounded-lg border ${isDark ? 'bg-black/60 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Группа Исполнителей:</label>
                  <input
                    type="text"
                    placeholder="Группа №2 (Холод-МСК)"
                    value={ticketForm.assigned_group}
                    onChange={(e) => setTicketForm({ ...ticketForm, assigned_group: e.target.value })}
                    className={`w-full p-2 rounded-lg border ${isDark ? 'bg-black/60 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
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
