import { useEffect, useState } from 'react';

/**
 * Тикающие часы для обратного отсчёта срока SLA.
 *
 * Это единственное движение в интерфейсе, которое идёт без действия
 * пользователя, и оно допустимо по требованиям 08-requirements.md:
 * меняется не оформление, а сами данные — до истечения срока реально
 * остаётся меньше времени. Один интервал на компонент вместо таймера
 * на каждую строку графы.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Уважаем системную настройку: при отключённой анимации обновляем
    // реже — данные остаются верными, но экран не «дышит».
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const effective = prefersReduced ? Math.max(intervalMs, 15000) : intervalMs;
    const id = window.setInterval(() => setNow(Date.now()), effective);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}

/** Остаток срока в разбитом виде — для моноширинного отсчёта в графе. */
export function formatRemaining(deadlineIso: string, now: number) {
  const deadline = new Date(deadlineIso).getTime();
  const diffMs = deadline - now;
  const overdue = diffMs < 0;
  const abs = Math.abs(diffMs);

  const hours = Math.floor(abs / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const seconds = Math.floor((abs % 60_000) / 1000);

  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    overdue,
    /** Осталось меньше часа — срок под угрозой. */
    atRisk: !overdue && abs < 3_600_000,
    text: `${overdue ? '−' : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    minutesLeft: overdue ? -Math.floor(abs / 60_000) : Math.floor(abs / 60_000),
  };
}
