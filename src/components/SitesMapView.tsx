import React from 'react';
import { DatabaseSchema } from '../mockDb';
import { PageSection } from './layout/PageSection';
import { StatusBadge } from './ui/StatusBadge';
import { slaBucket } from '../opsDashboard';
import { MapPin } from 'lucide-react';

interface SitesMapViewProps {
  db: DatabaseSchema | null;
  onOpenSite: (siteId: string) => void;
}

export const SitesMapView: React.FC<SitesMapViewProps> = ({ db, onOpenSite }) => {
  if (!db) {
    return <p className="text-[11px] text-[var(--oc-muted)]">Загрузка объектов…</p>;
  }

  const tiles = [...db.sites].sort((a, b) => a.region.localeCompare(b.region, 'ru'));
  const open = db.open_tickets;

  return (
    <div className="grid gap-3">
      <PageSection title="Объекты" description="Склады по городам: открытые заявки и риск SLA." />

      <div className="grid gap-3 md:grid-cols-3">
        {tiles.map((site) => {
          const tickets = open.filter((t) => t.site_id === site.site_id);
          const risk = tickets.filter((t) => {
            const b = slaBucket(t.sla_deadline);
            return b === 'at_risk' || b === 'breached';
          }).length;
          const warnAssets = db.assets.filter(
            (a) => a.site_id === site.site_id && a.status !== 'OK'
          ).length;
          const tone = risk ? 'danger' : tickets.length ? 'warning' : 'success';
          return (
            <button
              key={site.site_id}
              type="button"
              className="oc-card px-3 py-3 text-left hover:bg-[var(--oc-surface-2)]"
              onClick={() => onOpenSite(site.site_id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--oc-accent)]" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">{site.region}</p>
                    <p className="text-[13px] leading-snug">{site.customer_name}</p>
                    <p className="mt-1 break-words text-[12px] leading-snug text-[var(--oc-muted)]">{site.address}</p>
                  </div>
                </div>
                <StatusBadge
                  tone={tone}
                  label={risk ? `SLA ${risk}` : tickets.length ? `${tickets.length}` : 'ТИХО'}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--oc-muted)]">
                <span>открыто {tickets.length}</span>
                <span>риск SLA {risk}</span>
                <span>оборудование {warnAssets ? `${warnAssets} внимание` : 'в норме'}</span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--oc-accent)]">Заявки объекта</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
