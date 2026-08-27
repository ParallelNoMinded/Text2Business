import React from 'react';
import { Cpu } from 'lucide-react';

export const AuthLayout: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="oc-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--oc-accent-soft)] text-[var(--oc-accent)]">
            <Cpu className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[13px] font-semibold">Text2Business</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--oc-muted)]">AI-диспетчер</p>
          </div>
        </div>
        <section className="oc-card p-5">
          <h1 className="oc-section-title text-[16px]">{title}</h1>
          <p className="mt-1 text-[12px] text-[var(--oc-muted)]">{subtitle}</p>
          {children}
        </section>
      </div>
    </div>
  );
};
