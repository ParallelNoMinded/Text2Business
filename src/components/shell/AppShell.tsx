import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Inbox,
  Ticket,
  Users,
  MapPin,
  Cpu,
  Zap,
  Activity,
  ScrollText,
  BarChart3,
  Plug,
  Settings,
  Bell,
  HelpCircle,
  Search,
  Key,
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
  Circle,
} from 'lucide-react';
import { TabType } from '../Header';
import { DatabaseSchema } from '../../mockDb';
import { Ticket as TicketModel, Contractor, Asset } from '../../types';
import { Button, Card, cx } from '../ui/OpsPrimitives';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenRegistry: (entity: RegistryEntity) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  githubToken: string;
  onOpenTokenModal: () => void;
  pendingOperatorCount: number;
  db: DatabaseSchema;
  registryTab?: RegistryEntity;
  logsTab?: 'logs' | 'runs' | 'traces' | 'analytics';
  onLogsTab?: (tab: 'logs' | 'runs' | 'traces' | 'analytics') => void;
}

export type RegistryEntity = 'open_tickets' | 'contractors' | 'sites' | 'assets' | 'contracts';

type NavItemDef = {
  id: string;
  label: string;
  icon: React.ElementType;
  tab: TabType;
  entity?: RegistryEntity;
};

const NAV_OPS: NavItemDef[] = [
  { id: 'dash', label: 'Dashboard', icon: LayoutDashboard, tab: 'home' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, tab: 'operator' },
  { id: 'tickets', label: 'Tickets', icon: Ticket, tab: 'database', entity: 'open_tickets' },
  { id: 'customers', label: 'Customers', icon: Users, tab: 'database', entity: 'contractors' },
  { id: 'sites', label: 'Sites', icon: MapPin, tab: 'database', entity: 'sites' },
  { id: 'equipment', label: 'Equipment', icon: Cpu, tab: 'database', entity: 'assets' },
];

const NAV_AI: NavItemDef[] = [
  { id: 'dispatcher', label: 'AI Dispatcher', icon: Zap, tab: 'console' },
  { id: 'runs', label: 'AI Runs', icon: Activity, tab: 'logs_traces' },
  { id: 'logs', label: 'Logs', icon: ScrollText, tab: 'logs_traces' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, tab: 'logs_traces' },
  { id: 'integrations', label: 'Integrations', icon: Plug, tab: 'channels' },
  { id: 'settings', label: 'Settings', icon: Settings, tab: 'architecture' },
];

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeTab,
  setActiveTab,
  onOpenRegistry,
  theme,
  setTheme,
  selectedModel,
  setSelectedModel,
  githubToken,
  onOpenTokenModal,
  pendingOperatorCount,
  db,
  registryTab,
  logsTab = 'logs',
  onLogsTab,
}) => {
  const [collapsed, setCollapsed] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false)
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setHelpOpen(false);
        setNotesOpen(false);
        setProfileOpen(false);
      }
    };
    const onResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    const onPointer = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    document.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onPointer);
    };
  }, []);

  const isActive = (item: NavItemDef) => {
    if (item.tab === 'database') return activeTab === 'database' && (!item.entity || item.entity === registryTab);
    if (item.tab === 'logs_traces') {
      if (item.id === 'runs') return activeTab === 'logs_traces' && logsTab === 'runs';
      if (item.id === 'analytics') return activeTab === 'logs_traces' && logsTab === 'analytics';
      if (item.id === 'logs') return activeTab === 'logs_traces' && (logsTab === 'logs' || logsTab === 'traces');
    }
    return activeTab === item.tab;
  };

  const go = (item: NavItemDef) => {
    if (item.entity) onOpenRegistry(item.entity);
    else {
      setActiveTab(item.tab);
      if (item.tab === 'logs_traces' && onLogsTab) {
        if (item.id === 'runs') onLogsTab('runs');
        else if (item.id === 'analytics') onLogsTab('analytics');
        else onLogsTab('logs');
      }
    }
  };

  return (
    <div id="app-shell" className="h-screen overflow-hidden bg-oc-bg text-oc-text flex flex-col">
      <header className="h-12 shrink-0 border-b border-oc-border bg-oc-bg-2 flex items-center gap-3 px-3 z-20">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 shrink-0 min-w-0"
          title="Dashboard"
        >
          <div className="h-7 w-7 rounded-[5px] border border-oc-border-strong bg-oc-surface flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-oc-accent" />
          </div>
          <div className="hidden sm:flex flex-col leading-none text-left">
            <span className="text-[13px] font-semibold tracking-tight">Text2Business</span>
            <span className="text-[10px] font-mono text-oc-accent mt-[3px]">AI Dispatcher Center</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex-1 max-w-[560px] mx-auto h-8 oc-input px-2.5 flex items-center gap-2 text-oc-muted text-xs"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left truncate">Search tickets, customers, equipment...</span>
          <kbd className="oc-kbd hidden sm:inline">⌘K</kbd>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <IconBtn title="Notifications" onClick={() => setNotesOpen(true)}>
            <Bell className="h-4 w-4" />
            {pendingOperatorCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-oc-critical" />
            )}
          </IconBtn>
          <IconBtn title="Help" onClick={() => setHelpOpen(true)}>
            <HelpCircle className="h-4 w-4" />
          </IconBtn>

          <select
            id="header-model-dropdown"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="hidden sm:block h-8 oc-input px-2 text-[11px] font-mono max-w-[148px]"
            title="Current AI model"
          >
            <option value="qwen3.6-27b">qwen3.6-27b</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gemma4:e4b">gemma4:e4b</option>
            <option value="deepseek-reasoner">deepseek-reasoner</option>
            <option value="nemotron-3-ultra-550b-a55b">nemotron-3-ultra-550b-a55b</option>
          </select>

          <span
            className="hidden md:inline-flex items-center gap-1.5 h-8 px-2 rounded border border-oc-border bg-oc-surface text-[10px] font-mono uppercase tracking-wide text-oc-success"
            title="System status"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-oc-success oc-status-dot" />
            System Operational
          </span>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              title="Operator profile"
              onClick={() => setProfileOpen((v) => !v)}
              className="h-8 pl-1.5 pr-2 rounded border border-oc-border bg-oc-surface hover:bg-oc-hover flex items-center gap-1.5"
            >
              <span className="h-5 w-5 rounded-[4px] bg-oc-bg-3 border border-oc-border-strong flex items-center justify-center text-[9px] font-mono text-oc-accent">
                OP
              </span>
              <span className="hidden xl:inline text-[11px] text-oc-secondary">Operator</span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-56 oc-card p-1.5 z-50">
                <div className="px-2 py-1.5 border-b border-oc-border mb-1">
                  <div className="text-xs font-medium">Duty Operator</div>
                  <div className="text-[10px] font-mono text-oc-muted mt-0.5">OP · HITL console</div>
                </div>
                <button
                  id="header-theme-btn"
                  type="button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full h-8 px-2 rounded text-left text-xs text-oc-secondary hover:text-oc-text hover:bg-oc-hover flex items-center gap-2"
                >
                  {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  {theme === 'dark' ? 'Light theme' : 'Dark theme'}
                </button>
                <button
                  id="header-github-token-btn"
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenTokenModal();
                  }}
                  className="w-full h-8 px-2 rounded text-left text-xs text-oc-secondary hover:text-oc-text hover:bg-oc-hover flex items-center gap-2"
                >
                  <Key className="h-3.5 w-3.5" />
                  {githubToken ? 'Token configured' : 'Configure token'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <aside
          className={cx(
            'h-full border-r border-oc-border bg-oc-bg-2 flex flex-col shrink-0 transition-[width] duration-150 z-10',
            collapsed ? 'w-12' : 'w-[196px]'
          )}
        >
          <nav className="flex-1 overflow-y-auto overflow-x-visible py-2 px-1.5 space-y-3">
            <NavGroup title="Operations" collapsed={collapsed}>
              {NAV_OPS.map((item) => (
                <NavItem
                  key={item.id}
                  id={`nav-${item.id}`}
                  collapsed={collapsed}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item)}
                  onClick={() => go(item)}
                  badge={item.tab === 'operator' && pendingOperatorCount > 0 ? pendingOperatorCount : undefined}
                />
              ))}
            </NavGroup>
            <NavGroup title="Intelligence" collapsed={collapsed}>
              {NAV_AI.map((item) => (
                <NavItem
                  key={item.id}
                  id={`nav-${item.id}`}
                  collapsed={collapsed}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item)}
                  onClick={() => go(item)}
                />
              ))}
            </NavGroup>
          </nav>

          <div className="border-t border-oc-border p-1.5">
            <div
              className={cx('relative oc-nav-item flex items-center gap-2 h-8 px-2 rounded', collapsed && 'justify-center px-0')}
            >
              <Circle className="h-2 w-2 fill-oc-success text-oc-success shrink-0" />
              {!collapsed && (
                <div className="min-w-0 leading-tight">
                  <div className="text-[10px] font-mono uppercase tracking-wide text-oc-success">System</div>
                  <div className="text-[10px] text-oc-secondary truncate">Operational</div>
                </div>
              )}
              {collapsed && <span className="oc-nav-tip">System Operational</span>}
            </div>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="mt-0.5 w-full h-8 rounded text-oc-muted hover:text-oc-text hover:bg-oc-hover flex items-center justify-center"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>
        </aside>

        <main data-active-tab={activeTab} className="flex-1 min-w-0 overflow-auto p-4 sm:p-5 oc-fade">
          {children}
        </main>
      </div>

      {searchOpen && (
        <SearchCommand
          db={db}
          onClose={() => setSearchOpen(false)}
          onSelectTicket={() => {
            setSearchOpen(false);
            onOpenRegistry('open_tickets');
          }}
          onSelectCustomer={() => {
            setSearchOpen(false);
            onOpenRegistry('contractors');
          }}
          onSelectEquipment={() => {
            setSearchOpen(false);
            onOpenRegistry('assets');
          }}
        />
      )}
      {helpOpen && (
        <Overlay onClose={() => setHelpOpen(false)} title="Operator help">
          <p className="text-xs text-oc-secondary leading-relaxed">
            Incoming request → AI analysis → fact extraction → customer/asset/ticket search → SLA check →
            decision engine → human approval → execution → traces.
          </p>
          <p className="text-xs text-oc-muted mt-2 font-mono">⌘K search · Ctrl+Enter run dispatch</p>
        </Overlay>
      )}
      {notesOpen && (
        <Overlay onClose={() => setNotesOpen(false)} title="Notifications">
          {pendingOperatorCount > 0 ? (
            <p className="text-xs text-oc-warning font-mono">
              {pendingOperatorCount} tickets waiting for operator approval.
            </p>
          ) : (
            <p className="text-xs text-oc-secondary">No pending operator alerts.</p>
          )}
          <Button
            className="mt-3"
            onClick={() => {
              setNotesOpen(false);
              setActiveTab('operator');
            }}
          >
            Open inbox
          </Button>
        </Overlay>
      )}
    </div>
  );
};

const NavGroup: React.FC<{ title: string; collapsed: boolean; children: React.ReactNode }> = ({
  title,
  collapsed,
  children,
}) => (
  <div>
    {!collapsed && (
      <div className="px-2 mb-1 text-[9px] font-mono uppercase tracking-[0.16em] text-oc-muted">{title}</div>
    )}
    {collapsed && <div className="mx-2 mb-1 border-t border-oc-border/80" />}
    <div className="space-y-px">{children}</div>
  </div>
);

const NavItem: React.FC<{
  id?: string;
  collapsed: boolean;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
}> = ({ id, collapsed, icon: Icon, label, active, onClick, badge }) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    data-active={active ? 'true' : 'false'}
    className={cx(
      'oc-nav-item w-full h-8 rounded-[5px] flex items-center gap-2 text-[12px] transition-all duration-150 relative outline-none focus:ring-2 focus:ring-oc-accent/20',
      collapsed ? 'justify-center px-0' : 'px-2',
      active ? 'bg-oc-hover text-oc-accent oc-nav-active' : 'text-oc-secondary hover:text-oc-text hover:bg-oc-hover/70'
    )}
  >
    <Icon className="h-4 w-4 shrink-0" />
    {!collapsed && <span className="truncate font-medium">{label}</span>}
    {!collapsed && badge != null && <span className="ml-auto text-[10px] font-mono text-oc-critical">{badge}</span>}
    {collapsed && badge != null && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-oc-critical" />}
    {collapsed && <span className="oc-nav-tip">{label}</span>}
  </button>
);

const IconBtn: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  id?: string;
}> = ({ children, onClick, title, id }) => (
  <button
    id={id}
    type="button"
    title={title}
    onClick={onClick}
    className="relative h-8 w-8 rounded-[5px] text-oc-secondary hover:text-oc-text hover:bg-oc-hover flex items-center justify-center"
  >
    {children}
  </button>
);

const Overlay: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) => (
  <div className="fixed inset-0 z-50 bg-black/55 flex items-start justify-center pt-24 px-4" onClick={onClose}>
    <Card className="w-full max-w-md p-4">
      <div className="flex items-center justify-between mb-3" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm font-medium">{title}</div>
        <button type="button" onClick={onClose} className="text-oc-muted hover:text-oc-text text-xs">
          Close
        </button>
      </div>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </Card>
  </div>
);

const SearchCommand: React.FC<{
  db: DatabaseSchema;
  onClose: () => void;
  onSelectTicket: (t: TicketModel) => void;
  onSelectCustomer: (c: Contractor) => void;
  onSelectEquipment: (a: Asset) => void;
}> = ({ db, onClose, onSelectTicket, onSelectCustomer, onSelectEquipment }) => {
  const [q, setQ] = useState('');
  const term = q.toLowerCase();
  const tickets = useMemo(() => {
    const all = [...(db.open_tickets || []), ...(db.closed_tickets || [])];
    return all
      .filter((t) => t.ticket_id.toLowerCase().includes(term) || t.summary.toLowerCase().includes(term))
      .slice(0, 6);
  }, [db, term]);
  const customers = useMemo(() => {
    return (db.contractors || [])
      .filter((c) => c.name.toLowerCase().includes(term) || c.customer_id.toLowerCase().includes(term))
      .slice(0, 6);
  }, [db, term]);
  const equipment = useMemo(() => {
    return (db.assets || [])
      .filter(
        (a) =>
          a.local_code.toLowerCase().includes(term) ||
          a.name.toLowerCase().includes(term) ||
          a.asset_id.toLowerCase().includes(term)
      )
      .slice(0, 6);
  }, [db, term]);

  return (
    <div className="fixed inset-0 z-50 bg-black/55 flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <Card className="w-full max-w-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 h-11 border-b border-oc-border" onClick={(e) => e.stopPropagation()}>
          <Search className="h-4 w-4 text-oc-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tickets, customers, equipment..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <kbd className="oc-kbd">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-auto p-2 text-xs" onClick={(e) => e.stopPropagation()}>
          <div className="px-2 py-1 text-[10px] font-mono uppercase text-oc-muted">Tickets</div>
          {tickets.length === 0 && <div className="px-2 py-1.5 text-oc-muted">No tickets</div>}
          {tickets.map((t) => (
            <button
              key={t.ticket_id}
              type="button"
              onClick={() => onSelectTicket(t)}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-oc-hover flex items-center justify-between"
            >
              <span className="font-mono text-oc-accent">{t.ticket_id}</span>
              <span className="text-oc-secondary truncate ml-3">{t.summary}</span>
            </button>
          ))}
          <div className="px-2 py-1 mt-2 text-[10px] font-mono uppercase text-oc-muted">Customers</div>
          {customers.length === 0 && <div className="px-2 py-1.5 text-oc-muted">No customers</div>}
          {customers.map((c) => (
            <button
              key={c.customer_id}
              type="button"
              onClick={() => onSelectCustomer(c)}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-oc-hover flex items-center justify-between"
            >
              <span className="font-mono text-oc-accent">{c.customer_id}</span>
              <span className="text-oc-secondary truncate ml-3">{c.name}</span>
            </button>
          ))}
          <div className="px-2 py-1 mt-2 text-[10px] font-mono uppercase text-oc-muted">Equipment</div>
          {equipment.length === 0 && <div className="px-2 py-1.5 text-oc-muted">No equipment</div>}
          {equipment.map((a) => (
            <button
              key={a.asset_id}
              type="button"
              onClick={() => onSelectEquipment(a)}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-oc-hover flex items-center justify-between"
            >
              <span className="font-mono text-oc-accent">{a.local_code}</span>
              <span className="text-oc-secondary truncate ml-3">{a.name}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};
