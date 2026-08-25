import React from 'react';
import { Loader2 } from 'lucide-react';

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export const Card: React.FC<{ className?: string; children: React.ReactNode; id?: string }> = ({
  className,
  children,
  id,
}) => (
  <div id={id} className={cx('oc-card', className)}>
    {children}
  </div>
);

export const PageHeader: React.FC<{
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ kicker, title, subtitle, actions }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
    <div>
      {kicker && (
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-oc-accent mb-1">{kicker}</div>
      )}
      <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-oc-text">{title}</h1>
      {subtitle && <p className="text-xs text-oc-secondary mt-1">{subtitle}</p>}
    </div>
    {actions}
  </div>
);

export const StatusBadge: React.FC<{ children: React.ReactNode; tone?: 'ok' | 'warn' | 'crit' | 'ai' | 'neutral' | 'accent' }> = ({
  children,
  tone = 'neutral',
}) => {
  const map = {
    ok: 'text-oc-success border-oc-success/30 bg-oc-success/10',
    warn: 'text-oc-warning border-oc-warning/30 bg-oc-warning/10',
    crit: 'text-oc-critical border-oc-critical/30 bg-oc-critical/10',
    ai: 'text-oc-ai border-oc-ai/30 bg-oc-ai/10',
    accent: 'text-oc-accent border-oc-accent/30 bg-oc-accent/10',
    neutral: 'text-oc-secondary border-oc-border bg-oc-bg-2',
  };
  return (
    <span className={cx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium font-mono uppercase tracking-wide border', map[tone])}>
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const p = priority.toLowerCase();
  const tone = p === 'critical' ? 'crit' : p === 'high' ? 'warn' : p === 'medium' ? 'accent' : 'neutral';
  return <StatusBadge tone={tone}>{priority}</StatusBadge>;
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'outline' }
> = ({ variant = 'primary', className, children, ...props }) => {
  const styles = {
    primary: 'bg-oc-accent text-white hover:bg-oc-accent-2 active:bg-oc-accent-3 focus:ring-2 focus:ring-oc-accent/20',
    ghost: 'bg-transparent text-oc-secondary hover:text-oc-text hover:bg-oc-hover active:bg-oc-surface-hover',
    danger: 'bg-oc-critical text-white hover:bg-oc-critical/90 active:bg-oc-critical/80 focus:ring-2 focus:ring-oc-critical/20',
    outline: 'bg-transparent border border-oc-border text-oc-text hover:bg-oc-hover hover:border-oc-border-strong active:bg-oc-surface-hover',
  };
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded text-xs font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed focus:outline-none',
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const EmptyState: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="oc-card px-6 py-12 text-center">
    <div className="text-sm font-medium text-oc-text">{title}</div>
    {hint && <div className="text-xs text-oc-muted mt-2">{hint}</div>}
  </div>
);

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="oc-card px-6 py-12 text-center text-xs text-oc-secondary flex items-center justify-center gap-2">
    <Loader2 className="h-4 w-4 animate-spin text-oc-accent" />
    <span className="font-mono">{label}</span>
  </div>
);

export const Sparkline: React.FC<{ values: number[]; color?: string; className?: string }> = ({
  values,
  color = 'var(--oc-accent)',
  className,
}) => {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const w = 88;
  const h = 28;
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - ((v - min) / Math.max(max - min, 1)) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cx('overflow-visible', className)} width={w} height={h}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  );
};

export const KpiCard: React.FC<{
  label: string;
  value: string;
  delta: string;
  up?: boolean;
  spark: number[];
}> = ({ label, value, delta, up = true, spark }) => (
  <Card className="p-3">
    <div className="text-[10px] font-mono uppercase tracking-wider text-oc-muted">{label}</div>
    <div className="mt-1 flex items-end justify-between gap-2">
      <div>
        <div className="text-xl font-semibold font-mono leading-none text-oc-text">{value}</div>
        <div className={cx('mt-1.5 text-[11px] font-mono', up ? 'text-oc-success' : 'text-oc-critical')}>{delta}</div>
      </div>
      <Sparkline values={spark} color={up ? 'var(--oc-accent)' : 'var(--oc-critical)'} />
    </div>
  </Card>
);

export const SectionLabel: React.FC<{ children: React.ReactNode; live?: boolean }> = ({ children, live }) => (
  <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-oc-secondary">
    <span>{children}</span>
    {live && <StatusBadge tone="ok">Live</StatusBadge>}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input className={cx('oc-input h-8 px-2.5 text-xs placeholder:text-oc-muted', className)} {...props} />
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
  <textarea className={cx('oc-input p-2.5 text-xs leading-relaxed resize-none w-full placeholder:text-oc-muted', className)} {...props} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, children, ...props }) => (
  <select className={cx('oc-input h-8 px-2 text-xs font-mono cursor-pointer', className)} {...props}>
    {children}
  </select>
);

export const Tabs: React.FC<{
  items: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}> = ({ items, value, onChange }) => (
  <div className="flex flex-wrap items-center gap-1">
    {items.map((item) => (
      <button
        key={item.id}
        type="button"
        data-active={value === item.id}
        className="oc-tab"
        onClick={() => onChange(item.id)}
      >
        {item.label}
      </button>
    ))}
  </div>
);

export const FilterBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 py-2.5 border-b border-oc-border flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
    {children}
  </div>
);

export const Sheet: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  widthClass?: string;
}> = ({ open, onClose, title, children, widthClass = 'max-w-xl' }) => {
  if (!open) return null;
  return (
    <div className="oc-modal-backdrop flex justify-end" onClick={onClose}>
      <div
        className={cx('h-full w-full bg-oc-bg-2 border-l border-oc-border overflow-auto p-5 oc-fade', widthClass)}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="text-sm font-semibold text-oc-text">{title}</div>
            <button type="button" onClick={onClose} className="text-xs text-oc-muted hover:text-oc-text transition-colors">
              Close
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export const Dialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="oc-modal-backdrop flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg p-5 shadow-lg" >
        <div className="flex items-center justify-between mb-4" onClick={(e) => e.stopPropagation()}>
          <div className="text-sm font-semibold text-oc-text">{title}</div>
          <button type="button" onClick={onClose} className="text-xs text-oc-muted hover:text-oc-text transition-colors">
            Close
          </button>
        </div>
        <div onClick={(e) => e.stopPropagation()}>{children}</div>
      </Card>
    </div>
  );
};
