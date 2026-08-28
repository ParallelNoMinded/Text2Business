import React from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

type Tone = 'neutral' | 'info' | 'warning' | 'danger';

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return <header className="page-header">
    <div className="min-w-0">
      {eyebrow && <p className="section-kicker">{eyebrow}</p>}
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>;
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="section-header">
    <div><h2 className="section-title">{title}</h2>{description && <p className="section-description">{description}</p>}</div>
    {action}
  </div>;
}

export function StatusNotice({ tone = 'neutral', title, children }: { tone?: Tone; title: string; children?: React.ReactNode }) {
  return <div className={`status-notice status-notice-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <div><strong className="block text-sm">{title}</strong>{children && <div className="mt-1 text-sm leading-relaxed">{children}</div>}</div>
  </div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="empty-state">
    <Inbox className="h-5 w-5 text-ink-3" aria-hidden="true" />
    <div><h3 className="text-base font-bold text-ink">{title}</h3><p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-2">{description}</p></div>
    {action}
  </div>;
}

export function Button({ variant = 'secondary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  return <button {...props} className={`ui-button ui-button-${variant} ${className}`} />;
}
