import React, { useEffect, useRef, useState } from 'react';
import { DatabaseSchema } from '../mockDb';
import { Asset, Contractor, Site, Ticket } from '../types';
import { PageSection } from './layout/PageSection';
import { StatusBadge } from './ui/StatusBadge';
import {
  clearStartTicket,
  customerName,
  formatSla,
  peekStartTicket,
  priorityTone,
  requestStartTicket,
  slaBucket,
  statusLabel,
  wasAutoDispatched,
} from '../opsDashboard';
import { ruPriority, ruTicketStatus, ruAssetStatus } from '../uiRu';
import { Search, RotateCcw, Plus, X, ChevronDown, Play } from 'lucide-react';

interface DatabaseInspectorViewProps {
  db: DatabaseSchema | null;
  onResetDatabase: () => void;
  isLoading: boolean;
  theme?: 'dark' | 'light';
  onUpdateDb?: (updatedDb: DatabaseSchema) => void;
  canResetDatabase?: boolean;
  ticketsOnly?: boolean;
}

type RegistryTab = 'open_tickets' | 'closed_tickets' | 'contractors' | 'sites' | 'assets';
type ModalType = 'ADD_CONTRACTOR' | 'ADD_SITE' | 'ADD_ASSET' | 'ADD_TICKET' | 'ADD_CLOSED_TICKET' | null;
type SortKey = 'updated' | 'priority' | 'sla' | 'id';

const PAGE_SIZE = 12;
const inputCls =
  'h-7 w-full rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] px-2 text-xs';
const btnCls =
  'rounded-md border border-[var(--oc-border)] px-2 py-1 text-[11px] hover:bg-[var(--oc-surface-2)] disabled:opacity-50';
const PRIORITY_RANK: Record<Ticket['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function fmtTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function markTicketInProgress(ticket: Ticket): Ticket {
  return {
    ...ticket,
    status: 'IN_PROGRESS',
    missing_fields: [],
    updated_at: new Date().toISOString(),
    history: [
      ...(ticket.history || []),
      {
        timestamp: new Date().toISOString(),
        note: 'Диспетчер приступил к заявке.',
        author: 'Диспетчер',
      },
    ],
  };
}

export const DatabaseInspectorView: React.FC<DatabaseInspectorViewProps> = ({
  db,
  onResetDatabase,
  isLoading,
  onUpdateDb,
  canResetDatabase = true,
  ticketsOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<RegistryTab>('open_tickets');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [page, setPage] = useState(0);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: string; id: string; label: string } | null>(null);
  const [slaMinutes, setSlaMinutes] = useState(120);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [workNote, setWorkNote] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirm) {
        setConfirm(null);
        return;
      }
      if (modalType) {
        setModalType(null);
        setEditingId(null);
        return;
      }
      setDetailId(null);
      setWorkingId(null);
      clearStartTicket();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm, modalType]);

  useEffect(() => {
    if (ticketsOnly && activeTab !== 'open_tickets' && activeTab !== 'closed_tickets') {
      setActiveTab('open_tickets');
    }
  }, [ticketsOnly, activeTab]);

  useEffect(() => {
    if (!db) return;
    const id = peekStartTicket();
    if (!id) return;
    const open = db.open_tickets.find((t) => t.ticket_id === id);
    const closed = (db.closed_tickets || []).find((t) => t.ticket_id === id);
    if (!open && !closed) return;
    setActiveTab(open ? 'open_tickets' : 'closed_tickets');
    setDetailId(id);
    if (!open) return;
    setWorkingId(id);
    const needsStart = open.status !== 'IN_PROGRESS' || Boolean(open.missing_fields && open.missing_fields.length);
    if (!needsStart || !onUpdateDb) return;
    const updated = markTicketInProgress(open);
    onUpdateDb({
      ...db,
      open_tickets: db.open_tickets.map((t) => (t.ticket_id === id ? updated : t)),
    });
  }, [db, onUpdateDb]);

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
    channel: 'rest',
  });

  if (!db) {
    return (
      <div id="database-inspector-page" className="oc-card px-4 py-8 text-center text-xs text-[var(--oc-muted)]">
        Загрузка реестра…
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

  const matchTicket = (t: Ticket) =>
    t.ticket_id.toLowerCase().includes(term) ||
    t.summary.toLowerCase().includes(term) ||
    t.asset_id.toLowerCase().includes(term) ||
    customerName(db, t.customer_id).toLowerCase().includes(term) ||
    (t.description || '').toLowerCase().includes(term);

  const filterTickets = (list: Ticket[]) => {
    let rows = list.filter(matchTicket);
    if (statusFilter !== 'all') rows = rows.filter((t) => t.status === statusFilter);
    if (priorityFilter !== 'all') rows = rows.filter((t) => t.priority === priorityFilter);
    rows = [...rows].sort((a, b) => {
      if (sortKey === 'priority') return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (sortKey === 'sla') return new Date(a.sla_deadline).getTime() - new Date(b.sla_deadline).getTime();
      if (sortKey === 'id') return a.ticket_id.localeCompare(b.ticket_id);
      const ua = new Date(a.updated_at || a.created_at).getTime();
      const ub = new Date(b.updated_at || b.created_at).getTime();
      return ub - ua;
    });
    return rows;
  };

  const filteredOpenTickets = filterTickets(db.open_tickets);
  const filteredClosedTickets = filterTickets(db.closed_tickets || []);

  const ticketRows = activeTab === 'closed_tickets' ? filteredClosedTickets : filteredOpenTickets;
  const pagedTickets = ticketRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(ticketRows.length / PAGE_SIZE));

  const allTickets = [...db.open_tickets, ...(db.closed_tickets || [])];
  const detailTicket = allTickets.find((t) => t.ticket_id === detailId) || null;
  const related = detailTicket
    ? allTickets.filter(
        (t) =>
          t.ticket_id !== detailTicket.ticket_id &&
          (t.customer_id === detailTicket.customer_id || t.site_id === detailTicket.site_id)
      )
    : [];

  const commitDbChange = (newDb: DatabaseSchema) => {
    if (onUpdateDb) onUpdateDb(newDb);
  };

  const closeDetail = () => {
    clearStartTicket();
    setWorkingId(null);
    setWorkNote('');
    setDetailId(null);
  };

  const startWork = (ticket: Ticket) => {
    requestStartTicket(ticket.ticket_id);
    setActiveTab('open_tickets');
    setDetailId(ticket.ticket_id);
    setWorkingId(ticket.ticket_id);
    const open = db.open_tickets.find((t) => t.ticket_id === ticket.ticket_id);
    if (!open) return;
    const needsStart = open.status !== 'IN_PROGRESS' || Boolean(open.missing_fields && open.missing_fields.length);
    if (!needsStart) return;
    const updated = markTicketInProgress(open);
    commitDbChange({
      ...db,
      open_tickets: db.open_tickets.map((t) => (t.ticket_id === open.ticket_id ? updated : t)),
    });
  };

  const addWorkNote = () => {
    const text = workNote.trim();
    if (!text || !workingId) return;
    const ticket = db.open_tickets.find((t) => t.ticket_id === workingId);
    if (!ticket) return;
    commitDbChange({
      ...db,
      open_tickets: db.open_tickets.map((t) =>
        t.ticket_id === workingId
          ? {
              ...t,
              updated_at: new Date().toISOString(),
              history: [
                ...(t.history || []),
                { timestamp: new Date().toISOString(), note: text, author: 'Диспетчер' },
              ],
            }
          : t
      ),
    });
    setWorkNote('');
  };

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
    commitDbChange({
      ...db,
      open_tickets: db.open_tickets.filter((t) => t.ticket_id !== ticketId),
      closed_tickets: [updatedTicket, ...(db.closed_tickets || [])],
    });
    setConfirm(null);
    if (workingId === ticketId) {
      clearStartTicket();
      setWorkingId(null);
    }
    if (detailId === ticketId) setDetailId(ticketId);
  };

  const handleDeleteContractor = (id: string) => {
    commitDbChange({ ...db, contractors: db.contractors.filter((c) => c.customer_id !== id) });
  };
  const handleDeleteSite = (id: string) => {
    commitDbChange({ ...db, sites: db.sites.filter((s) => s.site_id !== id) });
  };
  const handleDeleteAsset = (id: string) => {
    commitDbChange({ ...db, assets: db.assets.filter((a) => a.asset_id !== id) });
  };
  const handleDeleteOpenTicket = (id: string) => {
    commitDbChange({ ...db, open_tickets: db.open_tickets.filter((t) => t.ticket_id !== id) });
    if (detailId === id) setDetailId(null);
  };
  const handleDeleteClosedTicket = (id: string) => {
    commitDbChange({ ...db, closed_tickets: db.closed_tickets.filter((t) => t.ticket_id !== id) });
    if (detailId === id) setDetailId(null);
  };

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
    commitDbChange({ ...db, contractors: [newContractor, ...(db.contractors || [])] });
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
    commitDbChange({ ...db, sites: [newSite, ...db.sites] });
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
    commitDbChange({ ...db, assets: [newAsset, ...db.assets] });
    setModalType(null);
  };

  const handleSaveTicket = (isClosed = false) => {
    const desc = ticketForm.description || ticketForm.summary;
    if (!desc) return;
    const id = ticketForm.ticket_id || `T-${Math.floor(Math.random() * 800 + 100)}`;
    const newTicket: Ticket = {
      ticket_id: id,
      customer_id: ticketForm.customer_id || 'C-101',
      site_id: ticketForm.site_id || 'S-MSK-01',
      asset_id: ticketForm.asset_id || 'A-1001',
      priority: ticketForm.priority || 'high',
      summary: ticketForm.summary || desc.slice(0, 80),
      description: desc,
      sla_deadline: new Date(Date.now() + slaMinutes * 60000).toISOString(),
      assigned_group: ticketForm.assigned_group || 'Дежурная служба',
      status: isClosed ? 'CLOSED' : 'NEW',
      created_at: new Date().toISOString(),
      channel: ticketForm.channel,
      history: [
        {
          timestamp: new Date().toISOString(),
          note: isClosed ? 'Заявка добавлена в Реестр Закрытых заявок.' : 'Заявка создана вручную.',
          author: 'Диспетчер БД',
        },
      ],
    };
    if (isClosed) {
      commitDbChange({ ...db, closed_tickets: [newTicket, ...(db.closed_tickets || [])] });
    } else {
      commitDbChange({ ...db, open_tickets: [newTicket, ...db.open_tickets] });
    }
    setModalType(null);
    setDetailId(id);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const desc = ticketForm.description || ticketForm.summary;
    if (!desc) return;
    const patch = (t: Ticket): Ticket =>
      t.ticket_id !== editingId
        ? t
        : {
            ...t,
            customer_id: ticketForm.customer_id || t.customer_id,
            site_id: ticketForm.site_id || t.site_id,
            asset_id: ticketForm.asset_id || t.asset_id,
            priority: ticketForm.priority || t.priority,
            summary: ticketForm.summary || desc.slice(0, 80),
            description: desc,
            assigned_group: ticketForm.assigned_group || t.assigned_group,
            status: ticketForm.status || t.status,
            channel: ticketForm.channel || t.channel,
            sla_deadline: new Date(Date.now() + slaMinutes * 60000).toISOString(),
            updated_at: new Date().toISOString(),
            history: [
              ...(t.history || []),
              { timestamp: new Date().toISOString(), note: 'Заявка отредактирована в реестре.', author: 'Диспетчер' },
            ],
          };
    commitDbChange({
      ...db,
      open_tickets: db.open_tickets.map(patch),
      closed_tickets: (db.closed_tickets || []).map(patch),
    });
    setEditingId(null);
    setModalType(null);
  };

  const openCreate = (type: ModalType) => {
    setTicketForm({
      ticket_id: '',
      customer_id: db.contractors[0]?.customer_id || 'C-101',
      site_id: db.sites[0]?.site_id || 'S-MSK-01',
      asset_id: db.assets[0]?.asset_id || 'A-1001',
      priority: 'high',
      summary: '',
      description: '',
      assigned_group: 'Дежурная служба',
      status: 'NEW',
      channel: 'rest',
    });
    setSlaMinutes(120);
    setEditingId(null);
    setModalType(type);
  };

  const openEdit = (t: Ticket) => {
    setTicketForm({ ...t });
    const due = new Date(t.sla_deadline).getTime();
    const mins = Number.isNaN(due) ? 120 : Math.max(15, Math.round((due - Date.now()) / 60000));
    setSlaMinutes(mins);
    setEditingId(t.ticket_id);
    setModalType('ADD_TICKET');
  };

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === 'complete') handleCloseTicket(confirm.id);
    if (confirm.kind === 'del-open') handleDeleteOpenTicket(confirm.id);
    if (confirm.kind === 'del-closed') handleDeleteClosedTicket(confirm.id);
    if (confirm.kind === 'del-customer') handleDeleteContractor(confirm.id);
    if (confirm.kind === 'del-site') handleDeleteSite(confirm.id);
    if (confirm.kind === 'del-asset') handleDeleteAsset(confirm.id);
    setConfirm(null);
  };

  const changeTab = (tab: RegistryTab) => {
    setActiveTab(tab);
    setPage(0);
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const site = (id: string) => db.sites.find((s) => s.site_id === id);
  const asset = (id: string) => db.assets.find((a) => a.asset_id === id);
  const sitesForCustomer = db.sites.filter((s) => !ticketForm.customer_id || s.customer_id === ticketForm.customer_id);
  const assetsForSite = db.assets.filter((a) => !ticketForm.site_id || a.site_id === ticketForm.site_id);

  const allTabs: { id: RegistryTab; label: string; count: number }[] = [
    { id: 'open_tickets', label: 'Открытые заявки', count: db.open_tickets.length },
    { id: 'closed_tickets', label: 'Закрытые заявки', count: (db.closed_tickets || []).length },
    { id: 'contractors', label: 'Клиенты', count: (db.contractors || []).length },
    { id: 'sites', label: 'Объекты', count: db.sites.length },
    { id: 'assets', label: 'Оборудование', count: db.assets.length },
  ];
  const tabs = ticketsOnly
    ? allTabs.filter((t) => t.id === 'open_tickets' || t.id === 'closed_tickets')
    : allTabs;

  const addLabel =
    activeTab === 'open_tickets'
      ? 'Создать заявку'
      : activeTab === 'closed_tickets'
        ? 'Добавить закрытую'
        : activeTab === 'contractors'
          ? 'Добавить клиента'
          : activeTab === 'sites'
            ? 'Добавить объект'
            : 'Добавить оборудование';

  const onAdd = () => {
    if (ticketsOnly && activeTab !== 'open_tickets' && activeTab !== 'closed_tickets') return;
    if (activeTab === 'open_tickets') openCreate('ADD_TICKET');
    else if (activeTab === 'closed_tickets') openCreate('ADD_CLOSED_TICKET');
    else if (activeTab === 'contractors') setModalType('ADD_CONTRACTOR');
    else if (activeTab === 'sites') setModalType('ADD_SITE');
    else setModalType('ADD_ASSET');
  };

  return (
    <div id="database-inspector-page" className="grid gap-3">
      <PageSection
        title={ticketsOnly ? 'Заявки' : 'Расширенный реестр'}
        description={
          ticketsOnly ? 'Поиск, фильтры и карточка заявки.' : 'Клиенты, объекты, оборудование и заявки.'
        }
        status={{ tone: 'info', label: `${db.open_tickets.length} ОТКРЫТЫХ` }}
        actions={
          canResetDatabase ? (
          <button id="reset-db-btn" type="button" className={btnCls} disabled={isLoading} onClick={onResetDatabase}>
            <RotateCcw className="mr-1 inline h-3 w-3" />
            Сброс БД
          </button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => changeTab(t.id)}
            className={`rounded-md border px-2.5 py-1 text-[11px] ${
              activeTab === t.id
                ? 'border-[var(--oc-accent)] bg-[var(--oc-surface-2)] text-[var(--oc-text)]'
                : 'border-[var(--oc-border)] text-[var(--oc-muted)] hover:bg-[var(--oc-surface-2)]'
            }`}
          >
            {t.label} <span className="font-mono">{t.count}</span>
          </button>
        ))}
        <button type="button" className={`${btnCls} ml-auto`} onClick={onAdd}>
          <Plus className="mr-1 inline h-3 w-3" />
          {addLabel}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-[var(--oc-muted)]" />
          <input
            className={`${inputCls} pl-7`}
            placeholder="Поиск…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
          />
        </div>
        {(activeTab === 'open_tickets' || activeTab === 'closed_tickets') && (
          <>
            <div className="w-full min-w-0 sm:w-48">
              <AlignedSelect
                overlay
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPage(0);
                }}
                options={[
                  { value: 'all', label: 'Статус: все' },
                  { value: 'NEW', label: ruTicketStatus('NEW') },
                  { value: 'IN_PROGRESS', label: ruTicketStatus('IN_PROGRESS') },
                  { value: 'WAITING_DISPATCHER', label: ruTicketStatus('WAITING_DISPATCHER') },
                  { value: 'RESOLVED', label: ruTicketStatus('RESOLVED') },
                  { value: 'CLOSED', label: ruTicketStatus('CLOSED') },
                ]}
              />
            </div>
            <div className="w-full min-w-0 sm:w-48">
              <AlignedSelect
                overlay
                value={priorityFilter}
                onChange={(value) => {
                  setPriorityFilter(value);
                  setPage(0);
                }}
                options={[
                  { value: 'all', label: 'Приоритет: все' },
                  { value: 'critical', label: ruPriority('critical') },
                  { value: 'high', label: ruPriority('high') },
                  { value: 'medium', label: ruPriority('medium') },
                  { value: 'low', label: ruPriority('low') },
                ]}
              />
            </div>
            <div className="w-full min-w-0 sm:w-48">
              <AlignedSelect
                overlay
                value={sortKey}
                onChange={(value) => setSortKey(value as SortKey)}
                options={[
                  { value: 'updated', label: 'Сортировка: обновлено' },
                  { value: 'priority', label: 'Сортировка: приоритет' },
                  { value: 'sla', label: 'Сортировка: SLA' },
                  { value: 'id', label: 'Сортировка: ID' },
                ]}
              />
            </div>
          </>
        )}
      </div>

      <div className={`grid gap-3 ${detailTicket ? 'xl:grid-cols-[1fr_360px]' : ''}`}>
        <section className="oc-card overflow-hidden">
          <div className="table-scroll">
            {(activeTab === 'open_tickets' || activeTab === 'closed_tickets') && (
              <table className="oc-table oc-table-stack">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Клиент</th>
                    <th>Инцидент</th>
                    <th>Приоритет</th>
                    <th>Статус</th>
                    <th>Группа</th>
                    <th>SLA</th>
                    <th>Обновлено</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTickets.map((t) => {
                    const st = statusLabel(t);
                    const sla = slaBucket(t.sla_deadline);
                    return (
                      <tr
                        key={t.ticket_id}
                        className={t.priority === 'critical' || sla === 'breached' ? 'row-critical' : ''}
                      >
                        <td className="font-mono" data-label="ID">{t.ticket_id}</td>
                        <td data-label="Клиент">{customerName(db, t.customer_id)}</td>
                        <td data-label="Инцидент">{t.summary}</td>
                        <td data-label="Приоритет">
                          <StatusBadge tone={priorityTone(t.priority)} label={ruPriority(t.priority)} />
                        </td>
                        <td data-label="Статус">
                          <StatusBadge tone={st.tone} label={st.label} />
                        </td>
                        <td className="text-[var(--oc-muted)]" data-label="Группа">{t.assigned_group}</td>
                        <td className="font-mono text-[11px]" data-label="SLA">{formatSla(t.sla_deadline)}</td>
                        <td className="font-mono text-[11px] text-[var(--oc-muted)]" data-label="Обновлено">
                          {fmtTime(t.updated_at || t.created_at)}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {activeTab === 'open_tickets' && (
                            <button
                              type="button"
                              className="text-[11px] font-medium text-[var(--oc-accent)]"
                              onClick={() => startWork(t)}
                            >
                              Приступить
                            </button>
                          )}
                          <button type="button" className="mr-1 text-[11px] text-[var(--oc-accent)]" onClick={() => setDetailId(t.ticket_id)}>
                            Открыть
                          </button>
                          <button type="button" className="mr-1 text-[11px]" onClick={() => openEdit(t)}>
                            Изменить
                          </button>
                          {activeTab === 'open_tickets' && (
                            <button
                              type="button"
                              className="mr-1 text-[11px]"
                              onClick={() => setConfirm({ kind: 'complete', id: t.ticket_id, label: `Закрыть ${t.ticket_id}?` })}
                            >
                              Завершить
                            </button>
                          )}
                          <button
                            type="button"
                            className="text-[11px] text-[var(--status-danger)]"
                            onClick={() =>
                              setConfirm({
                                kind: activeTab === 'open_tickets' ? 'del-open' : 'del-closed',
                                id: t.ticket_id,
                                label: `Удалить ${t.ticket_id}? Это действие нельзя отменить.`,
                              })
                            }
                          >
                            Удалить
                          </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pagedTickets.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-[var(--oc-muted)]">
                        Нет записей
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'contractors' && !ticketsOnly && (
              <table className="oc-table oc-table-stack">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Клиент</th>
                    <th>ИНН</th>
                    <th>Телефон</th>
                    <th>Email</th>
                    <th>Договор</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContractors.map((c) => (
                    <tr key={c.customer_id}>
                      <td className="font-mono" data-label="ID">{c.customer_id}</td>
                      <td data-label="Клиент">{c.name}</td>
                      <td className="font-mono" data-label="ИНН">{c.inn}</td>
                      <td className="font-mono text-[var(--oc-muted)]" data-label="Телефон">{c.contact_phone}</td>
                      <td className="text-[var(--oc-muted)]" data-label="Email">{c.contact_email}</td>
                      <td className="font-mono" data-label="Договор">{c.contract_number}</td>
                      <td>
                        <button
                          type="button"
                          className="text-[11px] text-[var(--status-danger)]"
                          onClick={() =>
                            setConfirm({ kind: 'del-customer', id: c.customer_id, label: `Удалить клиента ${c.name}?` })
                          }
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'sites' && !ticketsOnly && (
              <table className="oc-table oc-table-stack">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Клиент</th>
                    <th>Адрес</th>
                    <th>Контакт</th>
                    <th>Регион</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSites.map((s) => (
                    <tr key={s.site_id}>
                      <td className="font-mono" data-label="ID">{s.site_id}</td>
                      <td data-label="Клиент">{s.customer_name}</td>
                      <td data-label="Адрес">{s.address}</td>
                      <td className="text-[var(--oc-muted)]" data-label="Контакт">{s.contact_person}</td>
                      <td className="text-[var(--oc-muted)]" data-label="Регион">{s.region}</td>
                      <td>
                        <button
                          type="button"
                          className="text-[11px] text-[var(--status-danger)]"
                          onClick={() => setConfirm({ kind: 'del-site', id: s.site_id, label: `Удалить объект ${s.site_id}?` })}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'assets' && !ticketsOnly && (
              <table className="oc-table oc-table-stack">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Объект</th>
                    <th>Код</th>
                    <th>Оборудование</th>
                    <th>Приоритет</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((a) => (
                    <tr key={a.asset_id}>
                      <td className="font-mono" data-label="ID">{a.asset_id}</td>
                      <td className="font-mono" data-label="Объект">{a.site_id}</td>
                      <td className="font-mono" data-label="Код">{a.local_code}</td>
                      <td data-label="Оборудование">{a.name}</td>
                      <td data-label="Приоритет">
                        <StatusBadge
                          tone={priorityTone(a.criticality.toLowerCase() as Ticket['priority'])}
                          label={ruPriority(a.criticality)}
                        />
                      </td>
                      <td data-label="Статус">
                        <StatusBadge
                          tone={a.status === 'OK' ? 'success' : a.status === 'WARNING' ? 'warning' : 'danger'}
                          label={ruAssetStatus(a.status)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="text-[11px] text-[var(--status-danger)]"
                          onClick={() =>
                            setConfirm({ kind: 'del-asset', id: a.asset_id, label: `Удалить оборудование ${a.local_code}?` })
                          }
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {(activeTab === 'open_tickets' || activeTab === 'closed_tickets') && pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--oc-border)] px-3 py-1.5 text-[11px] text-[var(--oc-muted)]">
              <span>
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, ticketRows.length)} из {ticketRows.length}
              </span>
              <div className="flex gap-1">
                <button type="button" className={btnCls} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Назад
                </button>
                <button
                  type="button"
                  className={btnCls}
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Далее
                </button>
              </div>
            </div>
          )}
        </section>

        {detailTicket && (
          <aside className="oc-card flex max-h-[72vh] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
              <div>
                <p className="font-mono text-xs">{detailTicket.ticket_id}</p>
                <p className="oc-section-title text-[13px]">
                  {workingId === detailTicket.ticket_id ? 'В работе' : 'Обзор заявки'}
                </p>
              </div>
              <button type="button" className="text-[var(--oc-muted)]" onClick={closeDetail}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-auto px-3 py-2 text-[11px]">
              <p className="text-[13px] leading-snug text-[var(--oc-text)]">{detailTicket.summary}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                <Field label="Клиент" value={customerName(db, detailTicket.customer_id)} />
                <Field label="Объект" value={site(detailTicket.site_id)?.address || detailTicket.site_id} />
                <Field
                  label="Оборудование"
                  value={`${asset(detailTicket.asset_id)?.local_code || detailTicket.asset_id} · ${asset(detailTicket.asset_id)?.name || ''}`}
                />
                <Field label="Инцидент" value={detailTicket.description || detailTicket.summary} />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Приоритет</p>
                  <StatusBadge tone={priorityTone(detailTicket.priority)} label={ruPriority(detailTicket.priority)} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Статус</p>
                  <StatusBadge tone={statusLabel(detailTicket).tone} label={statusLabel(detailTicket).label} />
                </div>
                <Field label="SLA" value={`${formatSla(detailTicket.sla_deadline)} · ${fmtTime(detailTicket.sla_deadline)}`} />
                <Field label="Канал" value={detailTicket.channel || '—'} />
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Решение ИИ</p>
                <p className="rounded-md bg-[var(--oc-bg)] px-2 py-1.5">
                  {wasAutoDispatched(detailTicket)
                    ? 'AI Dispatcher участвовал в маршрутизации.'
                    : (detailTicket.history || []).find((h) => /AI/i.test(h.note + h.author))?.note ||
                      'Решение оператора / ручное создание.'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Хронология</p>
                <ul className="space-y-1">
                  {(detailTicket.history || []).slice().reverse().map((h, i) => (
                    <li key={i} className="border-l border-[var(--oc-border)] pl-2">
                      <span className="font-mono text-[10px] text-[var(--oc-muted)]">{fmtTime(h.timestamp)}</span>{' '}
                      <span>{h.author}</span>
                      <div>{h.note}</div>
                    </li>
                  ))}
                  {!(detailTicket.history || []).length && <li className="text-[var(--oc-muted)]">Нет событий</li>}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Активность</p>
                <ul className="space-y-1">
                  {(detailTicket.messages || []).map((m) => (
                    <li key={m.id} className="rounded bg-[var(--oc-bg)] px-2 py-1">
                      <span className="text-[var(--oc-muted)]">{m.author_name}</span> · {m.text}
                    </li>
                  ))}
                  {!(detailTicket.messages || []).length && <li className="text-[var(--oc-muted)]">Нет сообщений</li>}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Связанные заявки</p>
                <ul className="space-y-0.5">
                  {related.slice(0, 6).map((t) => (
                    <li key={t.ticket_id}>
                      <button type="button" className="text-[var(--oc-accent)]" onClick={() => setDetailId(t.ticket_id)}>
                        {t.ticket_id}
                      </button>{' '}
                      <span className="text-[var(--oc-muted)]">{t.summary}</span>
                    </li>
                  ))}
                  {!related.length && <li className="text-[var(--oc-muted)]">Нет связанных</li>}
                </ul>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 border-t border-[var(--oc-border)] px-3 py-2">
              {db.open_tickets.some((t) => t.ticket_id === detailTicket.ticket_id) && workingId === detailTicket.ticket_id && (
                <div className="grid gap-1">
                  <textarea
                    rows={2}
                    value={workNote}
                    onChange={(e) => setWorkNote(e.target.value)}
                    placeholder="Заметка в журнал…"
                    className="w-full rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] p-2 text-xs leading-snug"
                  />
                  <button type="button" className={btnCls} disabled={!workNote.trim()} onClick={addWorkNote}>
                    В журнал
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
              {db.open_tickets.some((t) => t.ticket_id === detailTicket.ticket_id) && workingId !== detailTicket.ticket_id && (
                <button type="button" className={`${btnCls} text-[var(--oc-accent)]`} onClick={() => startWork(detailTicket)}>
                  <Play className="mr-1 inline h-3 w-3" />
                  Приступить
                </button>
              )}
              <button type="button" className={btnCls} onClick={() => openEdit(detailTicket)}>
                Изменить
              </button>
              {db.open_tickets.some((t) => t.ticket_id === detailTicket.ticket_id) && (
                <button
                  type="button"
                  className={btnCls}
                  onClick={() =>
                    setConfirm({ kind: 'complete', id: detailTicket.ticket_id, label: `Закрыть ${detailTicket.ticket_id}?` })
                  }
                >
                  Завершить
                </button>
              )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {modalType && (
        <div className="oc-dialog-backdrop justify-end sm:justify-center" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="registry-dialog-title"
            className="h-full w-full max-w-md overflow-x-hidden overflow-y-auto border border-[var(--oc-border)] bg-[var(--oc-surface)] p-4 shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 id="registry-dialog-title" className="oc-section-title text-[13px]">
                {editingId
                  ? `Изменить ${editingId}`
                  : modalType === 'ADD_CONTRACTOR'
                    ? 'Добавить клиента'
                    : modalType === 'ADD_SITE'
                      ? 'Добавить объект'
                      : modalType === 'ADD_ASSET'
                        ? 'Добавить оборудование'
                        : modalType === 'ADD_CLOSED_TICKET'
                          ? 'Добавить закрытую заявку'
                          : 'Создать заявку'}
              </h3>
              <button type="button" onClick={() => { setModalType(null); setEditingId(null); }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalType === 'ADD_CONTRACTOR' && (
              <div className="grid gap-2 text-[11px]">
                <label>
                  Название
                  <input className={inputCls} value={contractorForm.name || ''} onChange={(e) => setContractorForm({ ...contractorForm, name: e.target.value })} />
                </label>
                <label>
                  ИНН
                  <input className={inputCls} value={contractorForm.inn || ''} onChange={(e) => setContractorForm({ ...contractorForm, inn: e.target.value })} />
                </label>
                <label>
                  Телефон
                  <input className={inputCls} value={contractorForm.contact_phone || ''} onChange={(e) => setContractorForm({ ...contractorForm, contact_phone: e.target.value })} />
                </label>
                <button type="button" className={btnCls} onClick={handleSaveContractor}>
                  Сохранить
                </button>
              </div>
            )}

            {modalType === 'ADD_SITE' && (
              <div className="grid gap-2 text-[11px]">
                <label>
                  Адрес
                  <input className={inputCls} value={siteForm.address || ''} onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })} />
                </label>
                <label>
                  Контакт
                  <input className={inputCls} value={siteForm.contact_person || ''} onChange={(e) => setSiteForm({ ...siteForm, contact_person: e.target.value })} />
                </label>
                <button type="button" className={btnCls} onClick={handleSaveSite}>
                  Сохранить
                </button>
              </div>
            )}

            {modalType === 'ADD_ASSET' && (
              <div className="grid gap-2 text-[11px]">
                <label>
                  Код
                  <input className={inputCls} value={assetForm.local_code || ''} onChange={(e) => setAssetForm({ ...assetForm, local_code: e.target.value })} />
                </label>
                <label>
                  Название
                  <input className={inputCls} value={assetForm.name || ''} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} />
                </label>
                <button type="button" className={btnCls} onClick={handleSaveAsset}>
                  Сохранить
                </button>
              </div>
            )}

            {(modalType === 'ADD_TICKET' || modalType === 'ADD_CLOSED_TICKET') && (
              <div className="grid min-w-0 gap-2 text-[11px]">
                <label className="grid min-w-0 gap-1">
                  Клиент
                  <AlignedSelect
                    value={ticketForm.customer_id || ''}
                    onChange={(customer_id) => {
                      const firstSite = db.sites.find((s) => s.customer_id === customer_id);
                      setTicketForm({ ...ticketForm, customer_id, site_id: firstSite?.site_id || ticketForm.site_id });
                    }}
                    options={(db.contractors || []).map((c) => ({ value: c.customer_id, label: c.name }))}
                  />
                </label>
                <label className="grid min-w-0 gap-1">
                  Объект
                  <AlignedSelect
                    value={ticketForm.site_id || ''}
                    onChange={(site_id) => {
                      const firstAsset = db.assets.find((a) => a.site_id === site_id);
                      setTicketForm({ ...ticketForm, site_id, asset_id: firstAsset?.asset_id || ticketForm.asset_id });
                    }}
                    options={sitesForCustomer.map((s) => ({ value: s.site_id, label: s.address }))}
                  />
                </label>
                <label className="grid min-w-0 gap-1">
                  Оборудование
                  <AlignedSelect
                    value={ticketForm.asset_id || ''}
                    onChange={(asset_id) => setTicketForm({ ...ticketForm, asset_id })}
                    options={assetsForSite.map((a) => ({
                      value: a.asset_id,
                      label: `${a.local_code} · ${a.name}`,
                    }))}
                  />
                </label>
                <label className="grid min-w-0 gap-1">
                  Канал
                  <AlignedSelect
                    value={ticketForm.channel || 'rest'}
                    onChange={(channel) => setTicketForm({ ...ticketForm, channel })}
                    options={[
                      { value: 'telegram', label: 'telegram' },
                      { value: 'email', label: 'email' },
                      { value: 'voice', label: 'voice' },
                      { value: 'rest', label: 'rest' },
                    ]}
                  />
                </label>
                <label className="grid min-w-0 gap-1">
                  Описание
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] p-2 text-xs"
                    value={ticketForm.description || ticketForm.summary || ''}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, description: e.target.value, summary: e.target.value.slice(0, 80) })
                    }
                  />
                </label>
                <div className="grid min-w-0 grid-cols-2 gap-2">
                  <label className="grid min-w-0 gap-1">
                    Приоритет
                    <AlignedSelect
                      value={ticketForm.priority || 'high'}
                      onChange={(priority) => setTicketForm({ ...ticketForm, priority: priority as Ticket['priority'] })}
                      options={[
                        { value: 'critical', label: ruPriority('critical') },
                        { value: 'high', label: ruPriority('high') },
                        { value: 'medium', label: ruPriority('medium') },
                        { value: 'low', label: ruPriority('low') },
                      ]}
                    />
                  </label>
                  <label className="grid min-w-0 gap-1">
                    SLA (мин)
                    <input
                      type="number"
                      className={inputCls}
                      value={slaMinutes}
                      onChange={(e) => setSlaMinutes(Number(e.target.value) || 60)}
                    />
                  </label>
                </div>
                {editingId && (
                  <label className="grid min-w-0 gap-1">
                    Статус
                    <AlignedSelect
                      value={ticketForm.status || 'NEW'}
                      onChange={(status) => setTicketForm({ ...ticketForm, status: status as Ticket['status'] })}
                      options={[
                        { value: 'NEW', label: ruTicketStatus('NEW') },
                        { value: 'IN_PROGRESS', label: ruTicketStatus('IN_PROGRESS') },
                        { value: 'WAITING_DISPATCHER', label: ruTicketStatus('WAITING_DISPATCHER') },
                        { value: 'RESOLVED', label: ruTicketStatus('RESOLVED') },
                        { value: 'CLOSED', label: ruTicketStatus('CLOSED') },
                      ]}
                    />
                  </label>
                )}
                <button
                  type="button"
                  className={btnCls}
                  onClick={() => (editingId ? handleSaveEdit() : handleSaveTicket(modalType === 'ADD_CLOSED_TICKET'))}
                >
                  {editingId ? 'Сохранить изменения' : 'Создать'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {confirm && (
        <div className="oc-dialog-backdrop z-[60]" role="presentation">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className="w-full max-w-sm rounded-lg border border-[var(--oc-border)] bg-[var(--oc-surface)] p-4"
          >
            <p id="confirm-dialog-title" className="text-sm">
              {confirm.label}
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" className={btnCls} onClick={() => setConfirm(null)}>
                Отмена
              </button>
              <button type="button" className={`${btnCls} border-[var(--status-danger)]`} onClick={runConfirm}>
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function AlignedSelect({
  value,
  onChange,
  options,
  overlay = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  overlay?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((item) => item.value === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative w-full min-w-0" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-7 w-full items-start justify-between gap-2 rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] px-2 py-1.5 text-left text-xs leading-snug"
      >
        <span className="min-w-0 flex-1 break-words">{current?.label || '—'}</span>
        <ChevronDown className="mt-0.5 h-3 w-3 shrink-0 text-[var(--oc-muted)]" aria-hidden="true" />
      </button>
      {open && (
        <ul
          role="listbox"
          className={
            overlay
              ? 'absolute left-0 right-0 top-full z-40 mt-1 box-border max-h-48 w-full overflow-y-auto overflow-x-hidden rounded-md border border-[var(--oc-border)] bg-[var(--oc-surface)] py-1'
              : 'mt-1 box-border max-h-48 w-full overflow-y-auto overflow-x-hidden rounded-md border border-[var(--oc-border)] bg-[var(--oc-surface)] py-1'
          }
        >
          {options.map((item) => (
            <li key={item.value}>
              <button
                type="button"
                role="option"
                aria-selected={item.value === value}
                className={`w-full break-words px-2 py-1.5 text-left text-xs leading-snug hover:bg-[var(--oc-surface-2)] ${
                  item.value === value ? 'bg-[var(--oc-accent-soft)] text-[var(--oc-accent)]' : 'text-[var(--oc-text)]'
                }`}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">{label}</p>
      <p className="leading-snug">{value}</p>
    </div>
  );
}
