import React, { useMemo } from 'react';
import { DatabaseSchema } from '../mockDb';
import { SystemLogEntry, Ticket } from '../types';

interface IntakeAnalyticsProps {
  db?: DatabaseSchema | null;
  logs: SystemLogEntry[];
}

/** Читаемое имя канала. */
const CHANNEL_LABEL: Record<string, string> = {
  telegram: 'Telegram',
  email: 'Электронная почта',
  call_transcript: 'Телефония',
  voice: 'Телефония',
  rest: 'Внешний интерфейс',
  unknown: 'Канал не указан',
};

const PRIORITY_LABEL: Record<string, string> = {
  critical: 'Критическая',
  high: 'Высокая',
  medium: 'Средняя',
  low: 'Низкая',
};

/** Одна разграфлённая строка распределения с долевой полосой. */
const DistributionRow: React.FC<{
  label: string;
  count: number;
  share: number;
  tone?: 'neutral' | 'warn' | 'danger';
}> = ({ label, count, share, tone = 'neutral' }) => {
  const barColor =
    tone === 'danger' ? 'bg-danger' : tone === 'warn' ? 'bg-warn' : 'bg-accent';

  return (
    <div className="border-b border-rule py-1.5 last:border-b-0">
      <div className="flex items-baseline gap-3">
        <span className="min-w-0 flex-1 truncate text-ink-2">{label}</span>
        <span className="shrink-0 tabular-nums text-ink-3">{count}</span>
        <span className="w-12 shrink-0 text-right tabular-nums text-ink">
          {share.toFixed(1)}%
        </span>
      </div>
      <div className="mt-1 h-[3px] w-full bg-panel-2">
        <div className={`h-full ${barColor}`} style={{ width: `${Math.min(share, 100)}%` }} />
      </div>
    </div>
  );
};

/** Блок-графа: заголовок как подпись бланка, внутри плотные строки. */
const Graph: React.FC<{ title: string; note?: string; children: React.ReactNode }> = ({
  title,
  note,
  children,
}) => (
  <div className="border border-rule p-3">
    <div className="mb-2 border-b border-rule pb-1.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{title}</div>
      {note && <div className="mt-0.5 text-[10px] leading-snug text-ink-3">{note}</div>}
    </div>
    {children}
  </div>
);

/**
 * Сводная аналитика по обращениям.
 *
 * Все числа считаются из журнала заявок и служебных событий — выдуманных
 * показателей здесь нет, поэтому таблица меняется вместе с базой и её
 * можно показывать как настоящую. Плотность намеренно высокая: диспетчеру
 * и наставнику нужно видеть распределение целиком, без прокрутки.
 */
export const IntakeAnalytics: React.FC<IntakeAnalyticsProps> = ({ db, logs }) => {
  const stats = useMemo(() => {
    const all: Ticket[] = [...(db?.open_tickets || []), ...(db?.closed_tickets || [])];
    const total = all.length;

    /** Группировка со сортировкой по убыванию. */
    const tally = (keyOf: (t: Ticket) => string) => {
      const map = new Map<string, number>();
      all.forEach((t) => {
        const k = keyOf(t);
        map.set(k, (map.get(k) || 0) + 1);
      });
      return [...map.entries()]
        .map(([key, count]) => ({ key, count, share: total > 0 ? (count / total) * 100 : 0 }))
        .sort((a, b) => b.count - a.count);
    };

    const byChannel = tally((t) => t.channel || 'unknown');
    const byPriority = tally((t) => t.priority || 'medium');

    // Разбор: сколько обращений прошло без участия диспетчера.
    const needsHuman = all.filter(
      (t) => t.status === 'WAITING_DISPATCHER' || (t.missing_fields || []).length > 0
    ).length;
    const autoShare = total > 0 ? ((total - needsHuman) / total) * 100 : 0;

    // Полнота данных: как часто в обращении хватало каждого поля.
    const fieldCompleteness = [
      { label: 'Код оборудования', filled: all.filter((t) => !!t.asset_id).length },
      { label: 'Объект и контрагент', filled: all.filter((t) => !!t.site_id).length },
      { label: 'Срок по договору', filled: all.filter((t) => !!t.sla_deadline).length },
      { label: 'Дежурная группа', filled: all.filter((t) => !!t.assigned_group).length },
    ].map((f) => ({
      ...f,
      share: total > 0 ? (f.filled / total) * 100 : 0,
    }));

    // Время обработки по служебным событиям: медиана и 95-й процентиль.
    const durations = logs
      .map((l) => l.duration_ms)
      .filter((d): d is number => typeof d === 'number' && d > 0)
      .sort((a, b) => a - b);

    const percentile = (p: number) =>
      durations.length === 0 ? 0 : durations[Math.min(durations.length - 1, Math.floor(durations.length * p))];

    // Распределение служебных событий по важности.
    const levelCounts = ['ERROR', 'WARN', 'SUCCESS', 'INFO'].map((level) => {
      const count = logs.filter((l) => l.level === level).length;
      return { level, count, share: logs.length > 0 ? (count / logs.length) * 100 : 0 };
    });

    return {
      total,
      byChannel,
      byPriority,
      needsHuman,
      autoShare,
      fieldCompleteness,
      p50: percentile(0.5),
      p95: percentile(0.95),
      sampleSize: durations.length,
      levelCounts,
    };
  }, [db, logs]);

  if (stats.total === 0) {
    return (
      <div className="sheet p-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
          Журнал пуст
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-3">
          Сводка считается по зарегистрированным обращениям. Запустите демонстрационный поток на
          рабочем месте диспетчера или разберите обращение на демо-стенде.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Резкая иерархия: две крупные цифры задают смысл всей сводки */}
      <div className="sheet grid grid-cols-1 divide-y divide-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            Всего обращений
          </div>
          <div className="mt-1 font-mono text-4xl font-medium leading-none tabular-nums text-ink">
            {stats.total}
          </div>
          <div className="mt-1.5 text-[11px] leading-snug text-ink-3">
            Открытые и закрытые за всё время журнала.
          </div>
        </div>

        <div className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            Разобрано без диспетчера
          </div>
          <div className="mt-1 font-mono text-4xl font-medium leading-none tabular-nums text-ink">
            {stats.autoShare.toFixed(1)}
            <span className="text-lg text-ink-3">%</span>
          </div>
          <div className="mt-1.5 text-[11px] leading-snug text-ink-3">
            Остальные {stats.needsHuman} потребовали уточнения данных.
          </div>
        </div>

        <div className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            Время обработки
          </div>
          <div className="mt-1 font-mono text-4xl font-medium leading-none tabular-nums text-ink">
            {stats.p50}
            <span className="text-lg text-ink-3"> мс</span>
          </div>
          <div className="mt-1.5 text-[11px] leading-snug text-ink-3">
            {stats.sampleSize > 0
              ? `Медиана по ${stats.sampleSize} событиям, 95-й процентиль ${stats.p95} мс.`
              : 'Событий с замером длительности пока нет.'}
          </div>
        </div>
      </div>

      {/* Плотные графы распределений */}
      <div className="grid grid-cols-1 gap-4 font-mono text-[11px] lg:grid-cols-2 min-[1600px]:grid-cols-4">
        <Graph title="По каналам поступления" note="Откуда пришло обращение.">
          {stats.byChannel.map((c) => (
            <DistributionRow
              key={c.key}
              label={CHANNEL_LABEL[c.key] || c.key}
              count={c.count}
              share={c.share}
            />
          ))}
        </Graph>

        <Graph title="По важности" note="Важность определяет срок по договору.">
          {stats.byPriority.map((p) => (
            <DistributionRow
              key={p.key}
              label={PRIORITY_LABEL[p.key] || p.key}
              count={p.count}
              share={p.share}
              tone={p.key === 'critical' ? 'danger' : p.key === 'high' ? 'warn' : 'neutral'}
            />
          ))}
        </Graph>

        <Graph title="Полнота данных" note="Как часто поле удалось определить из обращения.">
          {stats.fieldCompleteness.map((f) => (
            <DistributionRow key={f.label} label={f.label} count={f.filled} share={f.share} />
          ))}
        </Graph>

        <Graph title="Служебные события" note="Распределение записей журнала по важности.">
          {stats.levelCounts.map((l) => (
            <DistributionRow
              key={l.level}
              label={l.level}
              count={l.count}
              share={l.share}
              tone={l.level === 'ERROR' ? 'danger' : l.level === 'WARN' ? 'warn' : 'neutral'}
            />
          ))}
        </Graph>
      </div>
    </div>
  );
};
