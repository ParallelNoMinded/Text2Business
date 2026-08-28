import React, { useState } from 'react';
import { DatabaseSchema } from '../mockDb';
import { nextTicketId } from '../ticketNumber';
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
  onUpdateDb,
}) => {
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
className="sheet p-5 text-center font-mono text-xs text-ink-3"
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
    const id = nextTicketId(db);
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
      <div className="flex flex-col gap-5 border-b border-rule pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-ink-3" />
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Реестр заявок и справочников
            </h1>
          </div>
          <p className="mt-2 text-base leading-relaxed text-ink-2">
            Контрагенты, объекты, оборудование и заявки — открытые и закрытые.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-full md:w-64 font-mono">
            <label htmlFor="db-search" className="sr-only">Поиск по базе данных</label>
            <input
              id="db-search"
              type="text"
              placeholder="Поиск по БД..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="control w-full py-2 pl-9 pr-3 text-base text-ink placeholder:text-ink-3 focus:border-rule-strong focus:outline-none" 
            />
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-ink-3" />
          </div>

          <button
            id="reset-db-btn"
            type="button"
            onClick={() => { if (window.confirm('Сбросить реестр и восстановить исходные данные? Это действие нельзя отменить.')) onResetDatabase(); }}
            disabled={isLoading}
            className="flex items-center gap-1.5 border border-rule-strong px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-2 hover:bg-panel-2 hover:text-ink disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Сбросить БД</span>
          </button>
        </div>
      </div>

      {/* Internal Nav Tabs with Add buttons */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto border-b border-rule-strong font-mono">
        <div className="flex items-end">
          <button
            onClick={() => setActiveTab('open_tickets')}
            aria-current={activeTab === 'open_tickets' ? 'page' : undefined}
            className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-semibold tracking-wider transition ${
              activeTab === 'open_tickets'
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-3 hover:text-ink-2'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Открытые Заявки ({db.open_tickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('closed_tickets')}
            aria-current={activeTab === 'closed_tickets' ? 'page' : undefined}
            className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-semibold tracking-wider transition ${
              activeTab === 'closed_tickets'
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-3 hover:text-ink-2'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Закрытые Заявки ({(db.closed_tickets || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('contractors')}
            aria-current={activeTab === 'contractors' ? 'page' : undefined}
            className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-semibold tracking-wider transition ${
              activeTab === 'contractors'
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-3 hover:text-ink-2'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Контрагенты ({(db.contractors || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sites')}
            aria-current={activeTab === 'sites' ? 'page' : undefined}
            className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-semibold tracking-wider transition ${
              activeTab === 'sites'
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-3 hover:text-ink-2'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Объекты ({db.sites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            aria-current={activeTab === 'assets' ? 'page' : undefined}
            className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-semibold tracking-wider transition ${
              activeTab === 'assets'
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-3 hover:text-ink-2'
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
              className="flex items-center gap-1.5 border border-accent bg-accent px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-on-accent hover:bg-accent-hover"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Добавить Контрагента</span>
            </button>
          )}

          {activeTab === 'sites' && (
            <button
              onClick={() => setModalType('ADD_SITE')}
              className="flex items-center gap-1.5 border border-accent bg-accent px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-on-accent hover:bg-accent-hover"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Добавить Объект</span>
            </button>
          )}

          {activeTab === 'assets' && (
            <button
              onClick={() => setModalType('ADD_ASSET')}
              className="flex items-center gap-1.5 border border-accent bg-accent px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-on-accent hover:bg-accent-hover"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Добавить Оборудование</span>
            </button>
          )}

          {activeTab === 'open_tickets' && (
            <button
              onClick={() => setModalType('ADD_TICKET')}
              className="flex items-center gap-1.5 border border-accent bg-accent px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-on-accent hover:bg-accent-hover"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Создать Открытую Заявку</span>
            </button>
          )}

          {activeTab === 'closed_tickets' && (
            <button
              onClick={() => setModalType('ADD_CLOSED_TICKET')}
              className="flex items-center gap-1.5 border border-accent bg-accent px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-on-accent hover:bg-accent-hover"
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
          className="sheet overflow-x-auto"
        >
          <table className="ledger">
            <thead>
              <tr>
                <th>ID Контрагента</th>
                <th>Наименование</th>
                <th>ИНН</th>
                <th>Телефон</th>
                <th>Email</th>
                <th>Договор</th>
                <th className="text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {filteredContractors.map((c) => (
                <tr key={c.customer_id}>
                  <td>{c.customer_id}</td>
                  <td className="cell-key">{c.name}</td>
                  <td className="cell-mono">{c.inn}</td>
                  <td className="cell-mono">{c.contact_phone}</td>
                  <td className="cell-mono">{c.contact_email}</td>
                  <td className="cell-mono">{c.contract_number}</td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDeleteContractor(c.customer_id)}
                      className="p-2.5 text-ink-3 hover:text-danger hover:bg-danger-bg"
                      aria-label={`Удалить контрагента ${c.name}`}
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
          className="sheet overflow-x-auto"
        >
          <table className="ledger">
            <thead>
              <tr>
                <th>ID Объекта</th>
                <th>Клиент</th>
                <th>Адрес</th>
                <th>Контактное Лицо</th>
                <th>Регион</th>
                <th className="text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map((site) => (
                <tr key={site.site_id}>
                  <td className="cell-key cell-mono">{site.site_id}</td>
                  <td className="cell-key">{site.customer_name}</td>
                  <td>{site.address}</td>
                  <td className="cell-mono">{site.contact_person}</td>
                  <td className="cell-mono">{site.region}</td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDeleteSite(site.site_id)}
                      className="p-2.5 text-ink-3 hover:text-danger hover:bg-danger-bg"
                      aria-label={`Удалить объект ${site.address}`}
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
          className="sheet overflow-x-auto"
        >
          <table className="ledger">
            <thead>
              <tr>
                <th>ID Ассета</th>
                <th>Код Объекта</th>
                <th>Локальный Код</th>
                <th>Наименование Оборудования</th>
                <th>Критичность</th>
                <th>Статус</th>
                <th className="text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.asset_id}>
                  <td className="cell-mono">{asset.asset_id}</td>
                  <td className="cell-key cell-mono">{asset.site_id}</td>
                  <td className="cell-key cell-mono">{asset.local_code}</td>
                  <td className="cell-key">{asset.name}</td>
                  <td>
                    <span className="stamp text-warn">
                      {asset.criticality}
                    </span>
                  </td>
                  <td>
                    <span className="stamp text-ink-3">
                      {asset.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDeleteAsset(asset.asset_id)}
                      className="p-2.5 text-ink-3 hover:text-danger hover:bg-danger-bg"
                      aria-label={`Удалить оборудование ${asset.name}`}
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
          className="sheet overflow-x-auto"
        >
          <table className="ledger">
            <thead>
              <tr>
                <th>ID Заявки</th>
                <th>ID Ассета</th>
                <th>Суть Инцидента</th>
                <th>Приоритет</th>
                <th>Статус</th>
                <th>Группа</th>
                <th className="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpenTickets.map((t) => (
                <tr key={t.ticket_id}>
                  <td className="cell-key cell-mono">{t.ticket_id}</td>
                  <td className="cell-key cell-mono">{t.asset_id}</td>
                  <td className="cell-key">{t.summary}</td>
                  <td>
                    <span className="stamp text-warn">
                      {t.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="cell-key cell-mono">{t.status}</td>
                  <td className="cell-mono">{t.assigned_group}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleCloseTicket(t.ticket_id)}
                        className="flex items-center gap-1 border border-rule-strong px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-2 hover:bg-panel-2 hover:text-ink"
                        title="Завершить и перенести в архив"
                      >
                        <Check className="h-3 w-3" />
                        <span>Завершить</span>
                      </button>
                      <button
                        onClick={() => handleDeleteOpenTicket(t.ticket_id)}
                        className="p-2.5 text-ink-3 hover:bg-danger-bg hover:text-danger"
                        aria-label={`Удалить заявку ${t.ticket_id}`}
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
          className="sheet overflow-x-auto"
        >
          <table className="ledger">
            <thead>
              <tr>
                <th>ID Заявки</th>
                <th>ID Ассета</th>
                <th>Суть Заявки</th>
                <th>Приоритет</th>
                <th>Дата Завершения</th>
                <th>Статус</th>
                <th className="text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {filteredClosedTickets.map((t) => (
                <tr key={t.ticket_id}>
                  <td>{t.ticket_id}</td>
                  <td className="cell-mono">{t.asset_id}</td>
                  <td className="line-through text-ink-3">{t.summary}</td>
                  <td className="cell-mono">{t.priority}</td>
                  <td className="cell-mono">
                    {t.updated_at ? new Date(t.updated_at).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td>
                    <span className="stamp text-ink-3">
                      CLOSED
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDeleteClosedTicket(t.ticket_id)}
                      className="p-2.5 text-ink-3 hover:text-danger hover:bg-danger-bg"
                      aria-label={`Удалить архивную заявку ${t.ticket_id}`}
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
        <div className="fixed inset-0 z-50 scrim flex items-center justify-center p-4">
          <div className="sheet w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-rule">
              <h3 className="font-mono text-sm uppercase tracking-[0.14em] text-ink">
                {modalType === 'ADD_CONTRACTOR' && 'Добавить нового Контрагента'}
                {modalType === 'ADD_SITE' && 'Добавить новый Объект'}
                {modalType === 'ADD_ASSET' && 'Добавить новое Оборудование'}
                {modalType === 'ADD_TICKET' && 'Создать Открытую Заявку'}
                {modalType === 'ADD_CLOSED_TICKET' && 'Добавить Завершенную Заявку'}
              </h3>
              <button onClick={() => setModalType(null)} aria-label="Закрыть" className="p-1 text-ink-3 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contractor Form */}
            {modalType === 'ADD_CONTRACTOR' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label htmlFor="contractor-name" className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">Наименование компании:</label>
                  <input
                    id="contractor-name"
                    type="text"
                    placeholder="ООO «СеверТранс»"
                    value={contractorForm.name}
                    onChange={(e) => setContractorForm({ ...contractorForm, name: e.target.value })}
                    className="w-full p-2 rounded-[2px] bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label htmlFor="contractor-inn" className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">ИНН Компании:</label>
                  <input
                    id="contractor-inn"
                    type="text"
                    placeholder="7701998877"
                    value={contractorForm.inn}
                    onChange={(e) => setContractorForm({ ...contractorForm, inn: e.target.value })}
                    className="w-full p-2 rounded-[2px] bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label htmlFor="contractor-phone" className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">Контактный телефон:</label>
                  <input
                    id="contractor-phone"
                    type="text"
                    placeholder="+7 (495) 777-88-99"
                    value={contractorForm.contact_phone}
                    onChange={(e) => setContractorForm({ ...contractorForm, contact_phone: e.target.value })}
                    className="w-full p-2 rounded-[2px] bg-paper border border-rule text-ink"
                  />
                </div>
                <button
                  onClick={handleSaveContractor}
                  className="mt-2 w-full border border-accent bg-accent py-2.5 font-mono text-xs uppercase tracking-wider text-on-accent hover:bg-accent-hover"
                >
                  Сохранить Контрагента
                </button>
              </div>
            )}

            {/* Site Form */}
            {modalType === 'ADD_SITE' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label htmlFor="site-address" className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">Адрес Объекта:</label>
                  <input
                    id="site-address"
                    type="text"
                    placeholder="г. Москва, ул. Ленина 45"
                    value={siteForm.address}
                    onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
                    className="w-full p-2 rounded-[2px] bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label htmlFor="site-contact" className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">Контактное Лицо:</label>
                  <input
                    id="site-contact"
                    type="text"
                    placeholder="Иван (главный энергетик)"
                    value={siteForm.contact_person}
                    onChange={(e) => setSiteForm({ ...siteForm, contact_person: e.target.value })}
                    className="w-full p-2 rounded-[2px] bg-paper border border-rule text-ink"
                  />
                </div>
                <button
                  onClick={handleSaveSite}
                  className="mt-2 w-full border border-accent bg-accent py-2.5 font-mono text-xs uppercase tracking-wider text-on-accent hover:bg-accent-hover"
                >
                  Сохранить Объект
                </button>
              </div>
            )}

            {/* Asset Form */}
            {modalType === 'ADD_ASSET' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label htmlFor="asset-code" className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">Локальный Код (например ХУ-19):</label>
                  <input
                    id="asset-code"
                    type="text"
                    placeholder="ХУ-19"
                    value={assetForm.local_code}
                    onChange={(e) => setAssetForm({ ...assetForm, local_code: e.target.value })}
                    className="w-full p-2 rounded-[2px] bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label htmlFor="asset-name" className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">Наименование Оборудования:</label>
                  <input
                    id="asset-name"
                    type="text"
                    placeholder="Компрессорная станция №4"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    className="w-full p-2 rounded-[2px] bg-paper border border-rule text-ink"
                  />
                </div>
                <button
                  onClick={handleSaveAsset}
                  className="mt-2 w-full border border-accent bg-accent py-2.5 font-mono text-xs uppercase tracking-wider text-on-accent hover:bg-accent-hover"
                >
                  Сохранить Оборудование
                </button>
              </div>
            )}

            {/* Ticket Form */}
            {(modalType === 'ADD_TICKET' || modalType === 'ADD_CLOSED_TICKET') && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label htmlFor="ticket-summary" className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">Суть Инцидента:</label>
                  <input
                    id="ticket-summary"
                    type="text"
                    placeholder="Утечка фреона на компрессоре ХУ-17"
                    value={ticketForm.summary}
                    onChange={(e) => setTicketForm({ ...ticketForm, summary: e.target.value })}
                    className="w-full p-2 rounded-[2px] bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label htmlFor="ticket-group" className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">Группа Исполнителей:</label>
                  <input
                    id="ticket-group"
                    type="text"
                    placeholder="Группа №2 (Холод-МСК)"
                    value={ticketForm.assigned_group}
                    onChange={(e) => setTicketForm({ ...ticketForm, assigned_group: e.target.value })}
                    className="w-full p-2 rounded-[2px] bg-paper border border-rule text-ink"
                  />
                </div>
                <button
                  onClick={() => handleSaveTicket(modalType === 'ADD_CLOSED_TICKET')}
                  className="mt-2 w-full border border-accent bg-accent py-2.5 font-mono text-xs uppercase tracking-wider text-on-accent hover:bg-accent-hover"
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
