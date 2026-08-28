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
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--oc-accent-soft)] text-[var(--oc-accent)] shadow-[0_0_18px_color-mix(in_srgb,var(--oc-accent)_40%,transparent)]">
            <Cpu className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[14px] font-semibold tracking-tight">Text2Business</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--oc-muted)]">AI-диспетчер</p>
          </div>
        </div>
        <section className="oc-card p-6">
          <h1 className="oc-section-title text-[18px]">{title}</h1>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--oc-muted)]">{subtitle}</p>
          {children}
        </section>
      </div>
    </div>
  );
};
