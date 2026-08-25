import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Mail,
  Phone,
  Send,
  Server,
  AlertTriangle,
  Activity,
  Cpu,
} from 'lucide-react';
import { DatabaseSchema } from '../../mockDb';
import { Ticket, ProcessingResult } from '../../types';
import { TabType } from '../Header';
import { Card, KpiCard, PageHeader, PriorityBadge, StatusBadge, Button, cx } from '../ui/OpsPrimitives';

interface OperationsDashboardProps {
  db: DatabaseSchema;
  setActiveTab: (tab: TabType) => void;
  result?: ProcessingResult | null;
}

type QueueTab = 'all' | 'critical' | 'high' | 'waiting' | 'progress';

function customerName(db: DatabaseSchema, id: string) {
  return db.contractors.find((c) => c.customer_id === id)?.name || id;
}
function assetCode(db: DatabaseSchema, id: string) {
  return db.assets.find((a) => a.asset_id === id)?.local_code || id;
}
function slaPlan(db: DatabaseSchema, siteId: string) {
  const c = db.contracts.find((x) => x.site_id === siteId);
  return c ? `${c.plan.toUpperCase()}` : '—';
}
function channelOf(t: Ticket) {
  return (t.channel || t.messages?.[0]?.channel || 'email').toUpperCase();
}
function relTime(iso?: string) {
  if (!iso) return '—';
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.round(d / 60000));
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
}

const PIPELINE = [
  { id: 'in', name: 'Incoming Message', desc: 'Channel ingest', status: 'done' as const, ts: '14:01:02' },
  { id: 'g', name: 'Guardrails', desc: 'Safety / injection check', status: 'done' as const, ts: '14:01:03' },
  { id: 'f', name: 'Fact Extraction', desc: 'Structured facts', status: 'done' as const, ts: '14:01:08' },
  { id: 'c', name: 'Customer Search', desc: 'Contractor match', status: 'done' as const, ts: '14:01:09' },
  { id: 'a', name: 'Asset Search', desc: 'Equipment match', status: 'done' as const, ts: '14:01:10' },
  { id: 't', name: 'Ticket Search', desc: 'Dedup / open ticket', status: 'done' as const, ts: '14:01:11' },
  { id: 's', name: 'SLA Check', desc: 'Contract window', status: 'done' as const, ts: '14:01:12' },
  { id: 'd', name: 'Decision Engine', desc: 'Recommended action', status: 'live' as const, ts: '14:01:13' },
  { id: 'h', name: 'Human Approval', desc: 'Operator gate', status: 'idle' as const, ts: '—' },
  { id: 'e', name: 'Execution', desc: 'Commit / 1C', status: 'idle' as const, ts: '—' },
];

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({ db, setActiveTab, result }) => {
  const [qTab, setQTab] = useState<QueueTab>('all');
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<'ticket_id' | 'priority' | 'updated'>('priority');
  const [selected, setSelected] = useState<Ticket | null>(null);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const open = db.open_tickets || [];
  const critical = open.filter((t) => t.priority === 'critical').length;
  const waiting = open.filter((t) => t.status === 'WAITING_DISPATCHER' || (t.missing_fields && t.missing_fields.length > 0));
  const autoRate = open.length ? Math.round(((open.length - waiting.length) / open.length) * 100) : 91;

  const queue = useMemo(() => {
    let rows = [...open];
    if (qTab === 'critical') rows = rows.filter((t) => t.priority === 'critical');
    if (qTab === 'high') rows = rows.filter((t) => t.priority === 'high');
    if (qTab === 'waiting') rows = rows.filter((t) => t.status === 'WAITING_DISPATCHER' || (t.missing_fields && t.missing_fields.length));
    if (qTab === 'progress') rows = rows.filter((t) => t.status === 'IN_PROGRESS');
    if (q) {
      const term = q.toLowerCase();
      rows = rows.filter(
        (t) =>
          t.ticket_id.toLowerCase().includes(term) ||
          t.summary.toLowerCase().includes(term) ||
          customerName(db, t.customer_id).toLowerCase().includes(term)
      );
    }
    rows.sort((a, b) => {
      if (sortKey === 'ticket_id') return a.ticket_id.localeCompare(b.ticket_id);
      if (sortKey === 'updated') return (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at);
      const rank = { critical: 0, high: 1, medium: 2, low: 3 } as Record<string, number>;
      return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
    });
    return rows;
  }, [open, qTab, q, sortKey, db]);

  const priCounts = {
    critical: open.filter((t) => t.priority === 'critical').length || 1,
    high: open.filter((t) => t.priority === 'high').length || 1,
    medium: open.filter((t) => t.priority === 'medium').length || 1,
    low: open.filter((t) => t.priority === 'low').length || 0,
  };
  const priTotal = Math.max(1, priCounts.critical + priCounts.high + priCounts.medium + priCounts.low);

  const confSeries = [72, 78, 81, 84, 88, 90, 93];

  const pipeline = useMemo(() => {
    if (!result?.trace?.length) return PIPELINE;
    return PIPELINE.map((step, i) => {
      const tr = result.trace[i];
      if (!tr) return { ...step, status: i < result.trace.length ? ('done' as const) : step.status };
      const st = tr.status === 'SUCCESS' ? 'done' : tr.status === 'WARNING' ? 'live' : 'idle';
      return { ...step, name: tr.step_name || step.name, status: st as typeof step.status, ts: tr.timestamp?.slice(11, 19) || step.ts };
    });
  }, [result]);

  const activities = [
    { t: '10:21', text: `Ticket ${open[0]?.ticket_id || 'T-884'} updated to ${open[0]?.priority?.toUpperCase() || 'HIGH'}`, tone: 'crit' as const },
    { t: '10:29', text: 'New message from Telegram', tone: 'accent' as const },
    { t: '10:28', text: 'AI analysis completed', tone: 'ai' as const },
    { t: '10:25', text: 'SLA breach warning', tone: 'warn' as const },
  ];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      <PageHeader
        kicker="AI Dispatcher Control Center"
        title={`${greet}, Operator`}
        subtitle="System overview and live dispatch activity"
        actions={
          <Button onClick={() => setActiveTab('console')}>
            Open AI Dispatcher <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Open Tickets" value={String(open.length || 127)} delta="+18% today" spark={[18, 22, 19, 28, 30, 34, 40]} />
        <KpiCard label="Critical Tickets" value={String(critical || 23)} delta="+8%" spark={[8, 9, 11, 10, 14, 16, 18]} />
        <KpiCard label="AI Automation" value={`${autoRate || 91}%`} delta="+5%" spark={[80, 82, 84, 86, 88, 90, 91]} />
        <KpiCard label="Average Response" value="1.8s" delta="-0.4s" spark={[2.4, 2.2, 2.1, 2.0, 1.9, 1.85, 1.8]} />
        <KpiCard label="SLA Compliance" value="96%" delta="+3%" spark={[88, 90, 91, 93, 94, 95, 96]} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-4">
        <Card className="overflow-hidden">
          <div className="px-3 py-2.5 border-b border-oc-border flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div className="text-[11px] font-mono uppercase tracking-wider text-oc-secondary">Live Dispatch Queue</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'critical', 'high', 'waiting', 'progress'] as QueueTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setQTab(tab)}
                  className={cx(
                    'h-7 px-2 rounded text-[11px] capitalize',
                    qTab === tab ? 'bg-oc-hover text-oc-accent' : 'text-oc-muted hover:text-oc-text'
                  )}
                >
                  {tab === 'progress' ? 'In Progress' : tab}
                </button>
              ))}
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter…"
                className="oc-input h-7 px-2 text-[11px] w-32"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="text-[10px] font-mono uppercase text-oc-muted border-b border-oc-border">
                <tr>
                  {[
                    ['ticket_id', 'Ticket ID'],
                    ['customer', 'Customer'],
                    ['channel', 'Channel'],
                    ['eq', 'Equipment'],
                    ['priority', 'Priority'],
                    ['sla', 'SLA'],
                    ['ai', 'AI Confidence'],
                    ['updated', 'Updated'],
                  ].map(([key, label]) => (
                    <th key={key} className="px-3 py-2 font-medium">
                      <button
                        type="button"
                        className="hover:text-oc-text"
                        onClick={() => {
                          if (key === 'ticket_id' || key === 'priority' || key === 'updated') setSortKey(key as typeof sortKey);
                        }}
                      >
                        {label}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queue.map((t) => (
                  <tr
                    key={t.ticket_id}
                    onClick={() => setSelected(t)}
                    className={cx(
                      'border-b border-oc-border/70 hover:bg-oc-hover cursor-pointer transition-colors duration-150',
                      t.priority === 'critical' && 'oc-row-critical bg-oc-critical/5'
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-oc-accent">{t.ticket_id}</td>
                    <td className="px-3 py-2">{customerName(db, t.customer_id)}</td>
                    <td className="px-3 py-2 font-mono text-oc-secondary">{channelOf(t)}</td>
                    <td className="px-3 py-2 font-mono">{assetCode(db, t.asset_id)}</td>
                    <td className="px-3 py-2">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-3 py-2 font-mono text-oc-secondary">{slaPlan(db, t.site_id)}</td>
                    <td className="px-3 py-2 font-mono text-oc-accent">{t.priority === 'critical' ? '98%' : '91%'}</td>
                    <td className="px-3 py-2 text-oc-muted font-mono">{relTime(t.updated_at || t.created_at)}</td>
                  </tr>
                ))}
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-oc-muted">
                      No tickets in this filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-oc-secondary">AI Pipeline Status</div>
            <StatusBadge tone="ok">Live</StatusBadge>
          </div>
          <div className="space-y-0">
            {pipeline.map((step, i) => (
              <div key={step.id} className="relative pl-6 pb-3 last:pb-0">
                {i < pipeline.length - 1 && <div className="absolute left-[7px] top-4 bottom-0 w-px bg-oc-border" />}
                <div className="absolute left-0 top-0.5">
                  {step.status === 'done' && <CheckCircle2 className="h-4 w-4 text-oc-success" />}
                  {step.status === 'live' && <Circle className="h-4 w-4 text-oc-ai fill-oc-ai" />}
                  {step.status === 'idle' && <Circle className="h-4 w-4 text-oc-muted" />}
                </div>
                <div className="text-[12px] text-oc-text leading-tight">{step.name}</div>
                <div className="text-[10px] text-oc-muted">{step.desc}</div>
                <div className="text-[10px] font-mono text-oc-secondary">{step.ts}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-[11px] font-mono uppercase text-oc-secondary mb-3">Tickets by Priority</div>
          <Donut
            slices={[
              { v: priCounts.critical, c: 'var(--oc-critical)', l: 'Critical' },
              { v: priCounts.high, c: 'var(--oc-warning)', l: 'High' },
              { v: priCounts.medium, c: 'var(--oc-accent)', l: 'Medium' },
              { v: priCounts.low, c: 'var(--oc-muted)', l: 'Low' },
            ]}
            total={priTotal}
          />
        </Card>
        <Card className="p-3">
          <div className="text-[11px] font-mono uppercase text-oc-secondary mb-3">Channels</div>
          {[
            { l: 'Email', p: 42, icon: Mail },
            { l: 'Telegram', p: 31, icon: Send },
            { l: 'REST API', p: 18, icon: Server },
            { l: 'Voice', p: 9, icon: Phone },
          ].map((ch) => (
            <div key={ch.l} className="mb-2.5">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1.5 text-oc-secondary">
                  <ch.icon className="h-3.5 w-3.5" /> {ch.l}
                </span>
                <span className="font-mono text-oc-text">{ch.p}%</span>
              </div>
              <div className="h-1.5 rounded bg-oc-bg-2 overflow-hidden">
                <div className="h-full bg-oc-accent" style={{ width: `${ch.p}%` }} />
              </div>
            </div>
          ))}
        </Card>
        <Card className="p-3">
          <div className="text-[11px] font-mono uppercase text-oc-secondary mb-2">SLA Performance</div>
          <div className="text-2xl font-mono text-oc-text mb-3">94%</div>
          {[
            ['Gold', 96],
            ['Silver', 91],
            ['Bronze', 88],
          ].map(([l, v]) => (
            <div key={String(l)} className="mb-2">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-oc-secondary">{l}</span>
                <span className="font-mono">{v}%</span>
              </div>
              <div className="h-1.5 rounded bg-oc-bg-2 overflow-hidden">
                <div className="h-full bg-oc-success" style={{ width: `${v}%` }} />
              </div>
            </div>
          ))}
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-mono uppercase text-oc-secondary">Pending Approval</div>
            <StatusBadge tone="warn">{waiting.length}</StatusBadge>
          </div>
          <div className="space-y-2">
            {(waiting.length ? waiting : open).slice(0, 3).map((t) => (
              <button
                key={t.ticket_id}
                type="button"
                onClick={() => setSelected(t)}
                className="w-full text-left rounded border border-oc-border px-2 py-1.5 hover:bg-oc-hover"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-oc-accent">{t.ticket_id}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
                <div className="text-[11px] text-oc-secondary truncate mt-0.5">{customerName(db, t.customer_id)}</div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('operator')}
            className="mt-3 text-[11px] text-oc-accent hover:underline"
          >
            Open queue →
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="text-[11px] font-mono uppercase text-oc-secondary mb-3">Recent Activity</div>
          <div className="space-y-2.5">
            {activities.map((a) => (
              <div key={a.t + a.text} className="flex items-start gap-3">
                <span className="font-mono text-[11px] text-oc-muted w-10 pt-0.5">{a.t}</span>
                <div className="mt-1">
                  {a.tone === 'crit' && <AlertTriangle className="h-3.5 w-3.5 text-oc-critical" />}
                  {a.tone === 'accent' && <Send className="h-3.5 w-3.5 text-oc-accent" />}
                  {a.tone === 'ai' && <Cpu className="h-3.5 w-3.5 text-oc-ai" />}
                  {a.tone === 'warn' && <Clock className="h-3.5 w-3.5 text-oc-warning" />}
                </div>
                <div className="flex-1 text-[12px]">{a.text}</div>
                <StatusBadge tone={a.tone === 'crit' ? 'crit' : a.tone === 'warn' ? 'warn' : a.tone === 'ai' ? 'ai' : 'accent'}>
                  {a.tone === 'ai' ? 'AI' : a.tone === 'crit' ? 'CRIT' : a.tone === 'warn' ? 'SLA' : 'IN'}
                </StatusBadge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-mono uppercase text-oc-secondary">AI Confidence</div>
            <Activity className="h-3.5 w-3.5 text-oc-accent" />
          </div>
          <ConfidenceChart values={confSeries} />
          <div className="flex justify-between text-[10px] font-mono text-oc-muted mt-1">
            <span>12 May</span>
            <span>18 May</span>
          </div>
        </Card>
      </div>

      {selected && (
        <TicketDetails db={db} ticket={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

const Donut: React.FC<{ slices: Array<{ v: number; c: string; l: string }>; total: number }> = ({ slices, total }) => {
  let acc = 0;
  const r = 36;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--oc-bg-2)" strokeWidth="10" />
        {slices.map((s) => {
          const frac = s.v / total;
          const dash = `${frac * c} ${c}`;
          const rot = acc * 360 - 90;
          acc += frac;
          return (
            <circle
              key={s.l}
              cx="48"
              cy="48"
              r={r}
              fill="none"
              stroke={s.c}
              strokeWidth="10"
              strokeDasharray={dash}
              transform={`rotate(${rot} 48 48)`}
            />
          );
        })}
      </svg>
      <div className="space-y-1 text-[11px]">
        {slices.map((s) => (
          <div key={s.l} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm" style={{ background: s.c }} />
            <span className="text-oc-secondary">{s.l}</span>
            <span className="font-mono ml-auto">{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ConfidenceChart: React.FC<{ values: number[] }> = ({ values }) => {
  const w = 520;
  const h = 140;
  const min = 60;
  const max = 100;
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - ((v - min) / (max - min)) * (h - 16) - 8;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36">
        {[100, 90, 80, 70, 60].map((g, i) => {
          const y = 8 + i * ((h - 16) / 4);
          return (
            <g key={g}>
              <line x1="0" y1={y} x2={w} y2={y} stroke="var(--oc-border)" />
              <text x="0" y={y - 3} fill="var(--oc-muted)" fontSize="10" fontFamily="JetBrains Mono">
                {g}%
              </text>
            </g>
          );
        })}
        <polyline fill="none" stroke="var(--oc-accent)" strokeWidth="1.75" points={pts} />
      </svg>
    </div>
  );
};

const TicketDetails: React.FC<{ db: DatabaseSchema; ticket: Ticket; onClose: () => void }> = ({ db, ticket, onClose }) => {
  const site = db.sites.find((s) => s.site_id === ticket.site_id);
  const asset = db.assets.find((a) => a.asset_id === ticket.asset_id);
  const contract = db.contracts.find((c) => c.site_id === ticket.site_id);
  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex justify-end" onClick={onClose}>
      <div className="h-full w-full max-w-xl bg-oc-bg-2 border-l border-oc-border overflow-auto p-4 oc-fade" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-oc-accent text-sm">{ticket.ticket_id}</div>
            <div className="flex gap-1.5 mt-1">
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge tone={ticket.status === 'IN_PROGRESS' ? 'accent' : 'warn'}>{ticket.status.replace('_', ' ')}</StatusBadge>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-xs text-oc-muted hover:text-oc-text">
            Close
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <Field k="Customer" v={customerName(db, ticket.customer_id)} />
          <Field k="Equipment" v={asset?.local_code || ticket.asset_id} />
          <Field k="Location" v={site?.address || ticket.site_id} />
          <Field k="SLA" v={contract ? `${contract.plan.toUpperCase()} — ${contract.sla_minutes} min` : '—'} />
          <Field k="AI Confidence" v="98%" />
          <Field k="Group" v={ticket.assigned_group} />
        </div>
        <p className="text-xs text-oc-secondary mt-3">{ticket.summary}</p>
        <div className="mt-5">
          <div className="text-[11px] font-mono uppercase text-oc-secondary mb-2">AI Dispatch Trace</div>
          {(ticket.history || []).map((h, i) => (
            <div key={i} className="flex gap-3 py-2 border-b border-oc-border">
              <span className="font-mono text-[10px] text-oc-muted w-16 shrink-0">{new Date(h.timestamp).toLocaleTimeString('ru-RU')}</span>
              <div>
                <div className="text-[12px]">{h.note}</div>
                <div className="text-[10px] text-oc-muted">{h.author}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="oc-card p-2">
    <div className="text-[10px] font-mono uppercase text-oc-muted">{k}</div>
    <div className="text-[12px] mt-0.5">{v}</div>
  </div>
);
