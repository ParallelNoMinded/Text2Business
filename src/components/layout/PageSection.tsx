import React from 'react';
import { StatusBadge, StatusTone } from '../ui/StatusBadge';

interface PageSectionProps {
  title: string;
  description?: string;
  status?: { tone: StatusTone; label: string };
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageSection: React.FC<PageSectionProps> = ({
  title,
  description,
  status,
  actions,
  children,
}) => {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold tracking-tight text-[var(--oc-text)]">{title}</h1>
            {status && <StatusBadge tone={status.tone} label={status.label} />}
          </div>
          {description && (
            <p className="oc-muted mt-0.5 hidden text-xs leading-relaxed sm:block">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
};
