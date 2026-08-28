import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, AlertTriangle, Users } from 'lucide-react';
import { DatabaseSchema } from '../mockDb';
import { Ticket } from '../types';
import { apiFetch } from '../api';
import { useNow, formatRemaining } from '../hooks/useNow';
import { ShiftFigures, ShiftFigure } from './ShiftFigures';
import { SwipeRail } from './SwipeRail';
import { ClarifyDialog } from './ClarifyDialog';
import { DemoStreamControl } from './DemoStreamControl';
import {
  completeDemoClarification,
  generateIncomingTicket,
  StreamPace,
  PACE_INTERVAL_MS,
} from '../demoStream';
import { formatFieldLabels } from '../fieldLabels';

interface OperatorConsoleViewProps {
  db: DatabaseSchema | null;
  onUpdateDb: (updatedDb: DatabaseSchema) => void;
  theme?: 'dark' | 'light';
}

/** Данные считаются устаревшими, если с последней сверки прошло больше минуты. */
const STALE_AFTER_MS = 60_000;

/** Отпечаток заявки для сверки версий: по нему видно, что её изменил кто-то ещё. */
const fingerprint = (t: Ticket | undefined) =>
  t ? `${t.status}|${t.updated_at || ''}|${(t.missing_fields || []).join(',')}` : 'GONE';

/**
 * Рабочее место диспетчера.
 *
 * Иерархия строится на масштабе, а не на цвете: сводка смены гигантскими
 * моноширинными цифрами, под ней очень плотные графы журнала. Палитра
 * прежняя, монохромная; цвет означает состояние, а не оформление.
 *
 * Движение здесь всегда привязано к данным (08-requirements.md): тикает
 * обратный отсчёт срока, проступает новая строка журнала, гаснет строка,
 * ушедшая в работу. Декоративной пульсации нет.
 */
export const OperatorConsoleView: React.FC<OperatorConsoleViewProps> = ({ db, onUpdateDb }) => {
  const now = useNow(1000);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isWaitingForClient, setIsWaitingForClient] = useState(false);
  const clarificationTimerRef = useRef<number | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<'ok' | 'error'>('ok');

  // Сверка с сервером: время последней успешной сверки и её ошибка.
  const [lastSyncAt, setLastSyncAt] = useState<number>(() => Date.now());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Конфликт: заявку успел изменить другой диспетчер.
  const [conflict, setConflict] = useState<{ ticket: Ticket; theirStatus: string } | null>(null);

  // Клавиатурная навигация по графе ожидающих.
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Демонстрационный поток обращений — нужен для показа, не для смены.
  const [streamRunning, setStreamRunning] = useState(false);
  const [streamPace, setStreamPace] = useState<StreamPace>('busy');
  const [streamCount, setStreamCount] = useState(0);

  // Отметки для осмысленного движения: новые и уходящие строки.
  const seenRef = useRef<Set<string> | null>(null);
  const [freshIds, setFreshIds] = useState<string[]>([]);
  const [leavingIds, setLeavingIds] = useState<string[]>([]);
  const [queueQuery, setQueueQuery] = useState('');
  const [queueSort, setQueueSort] = useState<'risk' | 'newest' | 'priority'>('risk');
  const [figureFilter, setFigureFilter] = useState<string | null>(null);
  const queueRef = useRef<HTMLDivElement>(null);

  const isStale = now - lastSyncAt > STALE_AFTER_MS;

  useEffect(
    () => () => {
      if (clarificationTimerRef.current !== null) {
        window.clearTimeout(clarificationTimerRef.current);
      }
    },
    []
  );

  const allPendingTickets = useMemo(
    () =>
      (db?.open_tickets || []).filter(
        (t) => t.status === 'WAITING_DISPATCHER' || (t.missing_fields && t.missing_fields.length > 0)
      ),
    [db]
  );

  const allActiveTickets = useMemo(
    () =>
      (db?.open_tickets || []).filter(
        (t) =>
          t.status !== 'WAITING_DISPATCHER' && (!t.missing_fields || t.missing_fields.length === 0)
      ),
    [db]
  );

  const matchesQuery = useCallback((ticket: Ticket) => {
    const query = queueQuery.trim().toLocaleLowerCase('ru-RU');
    if (!query) return true;
    return [ticket.ticket_id, ticket.summary, ticket.description, ticket.asset_id, ticket.assigned_group]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase('ru-RU').includes(query));
  }, [queueQuery]);

  const sortTickets = useCallback((tickets: Ticket[]) => {
    const priorityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...tickets].sort((a, b) => {
      if (queueSort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (queueSort === 'priority') return (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
      const aRemaining = new Date(a.sla_deadline).getTime() - now;
      const bRemaining = new Date(b.sla_deadline).getTime() - now;
      return aRemaining - bRemaining;
    });
  }, [queueSort, now]);

  const pendingTickets = useMemo(() => {
    if (figureFilter && figureFilter !== 'pending') return [];
    return sortTickets(allPendingTickets.filter(matchesQuery));
  }, [allPendingTickets, figureFilter, matchesQuery, sortTickets]);

  const activeTickets = useMemo(() => {
    let tickets = allActiveTickets.filter(matchesQuery);
    if (figureFilter === 'pending') return [];
    if (figureFilter === 'at-risk') tickets = tickets.filter((t) => {
      const remaining = formatRemaining(t.sla_deadline, now);
      return remaining.atRisk && !remaining.overdue;
    });
    if (figureFilter === 'overdue') tickets = tickets.filter((t) => formatRemaining(t.sla_deadline, now).overdue);
    return sortTickets(tickets);
  }, [allActiveTickets, figureFilter, matchesQuery, now, sortTickets]);

  /**
   * Состояние срока по заявке: остаток, доля пройденного времени и степень
   * тревоги. Расчёт общий для широкой таблицы и для карточек узкого экрана,
   * чтобы отсчёт в обоих представлениях не разошёлся.
   */
  const slaView = (t: Ticket) => {
    const r = formatRemaining(t.sla_deadline, now);

    const created = new Date(t.created_at).getTime();
    const deadline = new Date(t.sla_deadline).getTime();
    const total = Math.max(deadline - created, 1);
    const elapsed = Math.min(Math.max(now - created, 0), total);

    return {
      r,
      percent: r.overdue ? 100 : (elapsed / total) * 100,
      state: r.overdue ? 'over' : r.atRisk ? 'warn' : 'ok',
      textClass: r.overdue ? 'text-danger' : r.atRisk ? 'text-warn' : 'text-ink',
    };
  };

  /* ----------------------------------------------------------------------
     Осмысленное движение: отмечаем строки, которых не было в прошлый раз.
     ---------------------------------------------------------------------- */
  useEffect(() => {
    const ids = (db?.open_tickets || []).map((t) => t.ticket_id);

    // Первый проход только запоминает состав — журнал не «вспыхивает» целиком.
    if (seenRef.current === null) {
      seenRef.current = new Set(ids);
      return;
    }

    const incoming = ids.filter((id) => !seenRef.current!.has(id));
    if (incoming.length === 0) return;

    incoming.forEach((id) => seenRef.current!.add(id));
    setFreshIds(incoming);

    const timer = window.setTimeout(() => setFreshIds([]), 1500);
    return () => window.clearTimeout(timer);
  }, [db]);

  /* ----------------------------------------------------------------------
     Демонстрационный поток: подаёт обращения сам, чтобы на защите был виден
     живой журнал. Заявки собираются из настоящих справочников базы.
     ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!streamRunning || !db) return;

    const timer = window.setInterval(() => {
      const ticket = generateIncomingTicket(db);
      if (!ticket) return;

      onUpdateDb({ ...db, open_tickets: [ticket, ...(db.open_tickets || [])] });
      setStreamCount((n) => n + 1);
    }, PACE_INTERVAL_MS[streamPace]);

    return () => window.clearInterval(timer);
  }, [streamRunning, streamPace, db, onUpdateDb]);

  /* ----------------------------------------------------------------------
     Сводка смены: считаем по живому времени, отмечаем изменившиеся цифры.
     ---------------------------------------------------------------------- */
  const figures = useMemo<ShiftFigure[]>(() => {
    const atRisk = allActiveTickets.filter((t) => {
      const r = formatRemaining(t.sla_deadline, now);
      return r.atRisk && !r.overdue;
    }).length;

    const overdue = allActiveTickets.filter((t) => formatRemaining(t.sla_deadline, now).overdue).length;

    return [
      {
        id: 'pending',
        label: 'Ожидают уточнения',
        value: allPendingTickets.length,
        note:
          allPendingTickets.length > 0
            ? 'Разберите эти обращения первыми — по ним не хватает данных для 1С.'
            : 'Все поступившие обращения разобраны автоматически.',
        tone: pendingTickets.length > 0 ? 'warn' : 'neutral',
      },
      {
        id: 'at-risk',
        label: 'Срок под угрозой',
        value: atRisk,
        note: 'До нарушения SLA меньше часа.',
        tone: atRisk > 0 ? 'warn' : 'neutral',
      },
      {
        id: 'overdue',
        label: 'Просрочено',
        value: overdue,
        note: 'Срок по договору уже нарушен, начисляется неустойка.',
        tone: overdue > 0 ? 'danger' : 'neutral',
      },
      {
        id: 'active',
        label: 'В работе',
        value: allActiveTickets.length,
        note: 'Передано в 1С:ERP и назначено на выездную группу.',
        tone: 'neutral',
      },
    ];
  }, [allPendingTickets.length, allActiveTickets, now]);

  // Подчёркиваем цифру только когда значение реально изменилось.
  const prevFiguresRef = useRef<Record<string, number>>({});
  const [changedFigureIds, setChangedFigureIds] = useState<string[]>([]);

  useEffect(() => {
    const prev = prevFiguresRef.current;
    const changed = figures.filter((f) => prev[f.id] !== undefined && prev[f.id] !== f.value);
    prevFiguresRef.current = Object.fromEntries(figures.map((f) => [f.id, f.value]));

    if (changed.length === 0) return;
    setChangedFigureIds(changed.map((f) => f.id));
    const timer = window.setTimeout(() => setChangedFigureIds([]), 1000);
    return () => window.clearTimeout(timer);
  }, [figures]);

  /* ----------------------------------------------------------------------
     Сверка с сервером.
     ---------------------------------------------------------------------- */
  const syncFromServer = useCallback(async (): Promise<DatabaseSchema | null> => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await apiFetch('/api/database');
      if (!res.ok) throw new Error(`сервер ответил ${res.status}`);
      const fresh = (await res.json()) as DatabaseSchema;
      onUpdateDb(fresh);
      setLastSyncAt(Date.now());
      return fresh;
    } catch (err: any) {
      setSyncError(err?.message || 'нет связи с сервером');
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [onUpdateDb]);

  /* ----------------------------------------------------------------------
     Клавиатура: j/k и стрелки водят по графе, Enter открывает,
     цифра открывает строку напрямую. Диспетчер не тянется к мыши.
     ---------------------------------------------------------------------- */
  const focusRow = useCallback((index: number) => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row-index="${index}"] button`);
    el?.focus();
  }, []);

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (pendingTickets.length === 0) return;

    const move = (delta: number) => {
      e.preventDefault();
      const next = (cursor + delta + pendingTickets.length) % pendingTickets.length;
      setCursor(next);
      focusRow(next);
    };

    if (e.key === 'ArrowDown' || e.key === 'j') return move(1);
    if (e.key === 'ArrowUp' || e.key === 'k') return move(-1);

    if (e.key === 'Home') {
      e.preventDefault();
      setCursor(0);
      focusRow(0);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      const last = pendingTickets.length - 1;
      setCursor(last);
      focusRow(last);
      return;
    }

    // Цифра — прямой переход к строке графы.
    if (/^[1-9]$/.test(e.key)) {
      const index = Number(e.key) - 1;
      if (index < pendingTickets.length) {
        e.preventDefault();
        setCursor(index);
        openTicket(pendingTickets[index]);
      }
    }
  };

  /* ----------------------------------------------------------------------
     Действия диспетчера.
     ---------------------------------------------------------------------- */
  const openTicket = (ticket: Ticket) => {
    if (clarificationTimerRef.current !== null) {
      window.clearTimeout(clarificationTimerRef.current);
      clarificationTimerRef.current = null;
    }
    setIsWaitingForClient(false);
    setSelectedTicket(ticket);
    const missingStr = formatFieldLabels(
      ticket.missing_fields || ['код оборудования (например, ХУ-17)']
    );
    setReplyText(
      `Здравствуйте! Для автоматической регистрации вашей заявки уточните, пожалуйста: ${missingStr}.`
    );
    setStatusMessage(null);
  };

  const handleSendClarification = async () => {
    if (!selectedTicket || !replyText.trim() || !db) return;
    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await apiFetch('/api/operator/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket.ticket_id,
          chat_id: selectedTicket.chat_id,
          operator_message: replyText,
          channel: selectedTicket.channel || 'telegram',
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'нет свя��и с ботом');

      setStatusKind('ok');
      setStatusMessage('Уточнение отправлено клиенту.');

      const updatedTicket: Ticket = {
        ...selectedTicket,
        updated_at: new Date().toISOString(),
        messages: [
          ...(selectedTicket.messages || []),
          {
            id: `m-${Date.now()}`,
            sender: 'operator',
            author_name: 'Дежурный диспетчер',
            text: replyText,
            timestamp: new Date().toISOString(),
            channel: selectedTicket.channel,
          },
        ],
        history: [
          ...(selectedTicket.history || []),
          {
            timestamp: new Date().toISOString(),
            note: `Диспетчер направил запрос уточнения: "${replyText}"`,
            author: 'Диспетчер',
          },
        ],
      };

      onUpdateDb({
        ...db,
        open_tickets: db.open_tickets.map((t) =>
          t.ticket_id === selectedTicket.ticket_id ? updatedTicket : t
        ),
      });
      setSelectedTicket(updatedTicket);

      if (!updatedTicket.chat_id && (updatedTicket.missing_fields || []).length > 0) {
        setIsWaitingForClient(true);
        setStatusMessage('Запрос доставлен. Ожидаем ответ клиента…');
        clarificationTimerRef.current = window.setTimeout(async () => {
          const clarification = completeDemoClarification(db, updatedTicket);
          clarificationTimerRef.current = null;
          setIsWaitingForClient(false);

          if (!clarification) {
            setStatusKind('error');
            setStatusMessage('Клиент ответил, но данные не удалось сопоставить. Отправьте запрос повторно.');
            return;
          }

          const completedDb: DatabaseSchema = {
            ...db,
            open_tickets: db.open_tickets.map((ticket) =>
              ticket.ticket_id === updatedTicket.ticket_id ? clarification.ticket : ticket
            ),
          };
          onUpdateDb(completedDb);
          setSelectedTicket(clarification.ticket);
          setReplyText('');
          setStatusKind('ok');
          setStatusMessage(`Ответ получен. Заполнено: ${formatFieldLabels(clarification.completedFields)}. Заявка готова к подтверждению.`);

          await apiFetch('/api/database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(completedDb),
          });
        }, 1800);
      }
    } catch (err: any) {
      setStatusKind('error');
      setStatusMessage(`Не удалось отправить: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  /** Заявка, укомплектованная диспетчером и готовая к передаче в 1С. */
  const buildCommittedTicket = (ticket: Ticket): Ticket => ({
    ...ticket,
    status: 'IN_PROGRESS',
    missing_fields: [],
    updated_at: new Date().toISOString(),
    history: [
      ...(ticket.history || []),
      {
        timestamp: new Date().toISOString(),
        note: 'Диспетчер подтвердил данные. Заявка передана в 1С:ERP.',
        author: 'Диспетчер',
      },
    ],
  });

  /**
   * Подтверждение с оптимистичным обновлением.
   *
   * Строка уходит из графы сразу — диспетчер не ждёт сеть. Затем идёт
   * сверка версии на сервере: если заявку успел взять другой диспетчер,
   * показываем конфликт и откатываем изменение. Если запись не удалась,
   * состояние возвращается к прежнему с понятным объяснением.
   */
  const handleCommit = async (force = false) => {
    if (!selectedTicket || !db) return;
    if (isWaitingForClient || (selectedTicket.missing_fields || []).length > 0) {
      setStatusKind('error');
      setStatusMessage('Сначала дождитесь ответа клиента и заполнения обязательных данных.');
      return;
    }

    const ticketId = selectedTicket.ticket_id;
    const snapshot = db;
    const openedFingerprint = fingerprint(
      snapshot.open_tickets.find((t) => t.ticket_id === ticketId)
    );

    setIsCommitting(true);
    setStatusMessage(null);

    // Оптимистично: строка гаснет и уходит из графы немедленно.
    setLeavingIds((ids) => [...ids, ticketId]);
    const optimisticDb: DatabaseSchema = {
      ...snapshot,
      open_tickets: snapshot.open_tickets.map((t) =>
        t.ticket_id === ticketId ? buildCommittedTicket(t) : t
      ),
    };
    onUpdateDb(optimisticDb);

    const rollback = (message: string) => {
      onUpdateDb(snapshot);
      setLeavingIds((ids) => ids.filter((id) => id !== ticketId));
      setStatusKind('error');
      setStatusMessage(message);
    };

    try {
      // Сверка версии: не изменил ли заявку кто-то ещё, пока бланк был открыт.
      if (!force) {
        const check = await apiFetch('/api/database');
        if (check.ok) {
          const server = (await check.json()) as DatabaseSchema;
          const theirs = server.open_tickets?.find((t) => t.ticket_id === ticketId);
          if (fingerprint(theirs) !== openedFingerprint) {
            onUpdateDb(snapshot);
            setLeavingIds((ids) => ids.filter((id) => id !== ticketId));
            setConflict({
              ticket: selectedTicket,
              theirStatus: theirs ? theirs.status : 'снята с учёта',
            });
            setIsCommitting(false);
            return;
          }
        }
      }

      const committedTicket = optimisticDb.open_tickets.find((ticket) => ticket.ticket_id === ticketId);
      const res = await apiFetch('/api/commit-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_TICKET',
          confirmed_view: true,
          ticket_payload: committedTicket,
        }),
      });
      if (!res.ok) throw new Error(`сервер ответил ${res.status}`);

      setLastSyncAt(Date.now());
      setSelectedTicket(null);
      setConflict(null);
      window.setTimeout(() => setLeavingIds((ids) => ids.filter((id) => id !== ticketId)), 300);
    } catch (err: any) {
      rollback(
        `Заявка не передана в 1С: ${err.message}. Изменение отменено, данные вернулись к прежним.`
      );
    } finally {
      setIsCommitting(false);
    }
  };

  /* ----------------------------------------------------------------------
     Состояние: данные ещё не загружены.
     ---------------------------------------------------------------------- */
  if (!db) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
          Загрузка журнала смены…
        </p>
        <div className="figure-strip">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="figure-cell gap-3">
              <div className="skeleton-line w-24" />
              <div className="skeleton-line h-12 w-16" />
              <div className="skeleton-line w-full" />
            </div>
          ))}
        </div>
        <div className="journal p-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-rule py-3 last:border-0">
              <div className="skeleton-line w-20" />
              <div className="skeleton-line flex-1" />
              <div className="skeleton-line w-16" />
            </div>
          ))}
        </div>
        <span className="sr-only" role="status">
          Идёт загрузка данных смены
        </span>
      </div>
    );
  }

  return (
    <div id="operator-console-page" className="flex flex-col gap-6">
      {/* Шапка листа */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        {/* Заголовок без пояснения: назначение экрана видно по самим графам,
            а описание занимало строку в самом верху каждой смены. */}
        <h1 className="text-balance font-sans text-3xl font-bold tracking-tight text-ink">
          Рабочее место диспетчера
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[11px] text-ink-3 tabular-nums">
            Сверка{' '}
            {new Date(lastSyncAt).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
          <button
            type="button"
            onClick={syncFromServer}
            disabled={isSyncing}
            className="inline-flex min-h-9 items-center gap-2 border border-rule bg-panel px-3 font-sans text-sm font-semibold text-ink hover:bg-panel-2 disabled:text-ink-3"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Сверить</span>
          </button>
        </div>
      </div>

      {/* Состояние: сверка не удалась */}
      {syncError && (
        <div
          role="alert"
          className="flex flex-col gap-2 border border-danger-bg bg-danger-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="font-sans text-sm leading-relaxed text-danger">
            <span className="font-medium">Нет связи с сервером журнала:</span> {syncError}. Данные на
            экране могли устареть.
          </p>
          <button
            type="button"
            onClick={syncFromServer}
            className="inline-flex min-h-9 shrink-0 items-center justify-center border border-danger px-3 font-sans text-sm font-semibold text-danger hover:bg-paper"
          >
            Повторить
          </button>
        </div>
      )}

      {/* Состояние: данные давно не сверялись */}
      {isStale && !syncError && (
        <div className="flex flex-col gap-2 border border-rule-strong bg-warn-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-sm leading-relaxed text-warn">
            Данные не сверялись больше минуты.
          </p>
          <button
            type="button"
            onClick={syncFromServer}
            className="inline-flex min-h-9 shrink-0 items-center justify-center border border-warn px-3 font-sans text-sm font-semibold text-warn hover:bg-panel"
          >
            Обновить журнал
          </button>
        </div>
      )}

      {/* Сводка смены: сигнатурная резкая иерархия */}
      <ShiftFigures
        figures={figures}
        changedIds={changedFigureIds}
        activeId={figureFilter}
        onSelect={(id) => {
          setFigureFilter((current) => current === id ? null : id);
          window.setTimeout(() => queueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
        }}
      />

      <div ref={queueRef} className="sheet flex flex-col gap-3 p-4 scroll-mt-4" aria-label="Управление очередью">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="font-sans text-xs font-semibold text-ink-2">Поиск по очереди</span>
            <input
              type="search"
              value={queueQuery}
              onChange={(event) => setQueueQuery(event.target.value)}
              placeholder="Номер, описание, оборудование или группа"
              className="ui-input"
            />
          </label>
          <label className="flex flex-col gap-1.5 md:w-56">
            <span className="font-sans text-xs font-semibold text-ink-2">Сортировка</span>
            <select value={queueSort} onChange={(event) => setQueueSort(event.target.value as typeof queueSort)} className="ui-input">
              <option value="risk">По риску срока</option>
              <option value="newest">Сначала новые</option>
              <option value="priority">По критичности</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-sans text-sm text-ink-2" role="status">
            Показано: {pendingTickets.length + activeTickets.length} из {allPendingTickets.length + allActiveTickets.length}
          </p>
          {(queueQuery || figureFilter || queueSort !== 'risk') && (
            <button type="button" className="ui-button ui-button-secondary" onClick={() => {
              setQueueQuery('');
              setQueueSort('risk');
              setFigureFilter(null);
            }}>
              Сбросить условия
            </button>
          )}
        </div>
      </div>

      {/* Служебный пульт скрыт из основного потока смены. */}
      <details className="border-y border-rule py-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink-2">Демонстрационный поток обращений</summary>
        <div className="mt-3">
          <DemoStreamControl
            isRunning={streamRunning}
            onToggle={() => setStreamRunning((v) => !v)}
            pace={streamPace}
            onPaceChange={setStreamPace}
            deliveredCount={streamCount}
          />
        </div>
      </details>

      {/* Графа 1: ожидают уточнения */}
      <section className="flex flex-col gap-3" aria-labelledby="pending-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="pending-heading"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3"
          >
            Требуют уточнения данных · {pendingTickets.length}
          </h2>
          {/* Подсказка горячих клавиш нужна там, где есть клавиатура. */}
          {pendingTickets.length > 0 && (
            <p className="hidden items-center gap-1.5 font-mono text-[10px] text-ink-3 lg:flex">
              <span className="kbd">j</span>
              <span className="kbd">k</span>
              переход
              <span className="kbd ml-1">1</span>–<span className="kbd">9</span>
              открыть
            </p>
          )}
        </div>

        {pendingTickets.length === 0 ? (
          /* Пусто — хорошая новость, а не отсутствие данных. Одна спокойная
             строка вместо крупной цифры: ноль уже показан в сводке смены
             выше, и повторять его большим ке��лем незачем. */
          <p className="journal px-4 py-4 font-sans text-sm text-ink-2">
            Неполных обращений нет.
          </p>
        ) : (
          <>
          {/* Узкий экран: обращение целиком в карточке, листается свайпом. */}
          <SwipeRail
            label="Обращения, требующие уточнения"
            count={pendingTickets.length}
            className="lg:hidden"
          >
            {pendingTickets.map((ticket) => (
              <article
                key={ticket.ticket_id}
                className={`swipe-card sheet flex flex-col gap-2 p-4 ${
                  freshIds.includes(ticket.ticket_id) ? 'row-fresh' : ''
                } ${leavingIds.includes(ticket.ticket_id) ? 'row-leaving' : ''}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="reg-no tabular-nums">{ticket.ticket_id}</span>
                  <span className="stamp shrink-0 text-warn">Уточнить</span>
                </div>

                <p className="font-sans text-base font-medium leading-snug text-ink">
                  {ticket.summary || 'Обращение без кода оборудования'}
                </p>
                <p className="line-clamp-3 font-sans text-sm leading-relaxed text-ink-2">
                  {ticket.description}
                </p>

                {ticket.missing_fields && ticket.missing_fields.length > 0 && (
                  <p className="font-sans text-sm text-warn">
                    Не хватает: {formatFieldLabels(ticket.missing_fields)}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => openTicket(ticket)}
                  className="ui-button ui-button-primary mt-1 w-full"
                >
                  Открыть диалог
                </button>
              </article>
            ))}
          </SwipeRail>

          {/* Широкий экран: графа журнала целиком, без прокрутки и листания. */}
          <ul
            ref={listRef}
            className="journal hidden lg:block"
            onKeyDown={handleListKeyDown}
            aria-label="Обращения, требующие уточнения"
          >
            <li className="journal-head" aria-hidden="true">
              <span className="w-6">№</span>
              <span className="w-24">Номер</span>
              <span className="flex-1">Суть обращения</span>
              <span>Отметка</span>
            </li>

            {pendingTickets.map((ticket, index) => (
              <li
                key={ticket.ticket_id}
                data-row-index={index}
                className={[
                  freshIds.includes(ticket.ticket_id) ? 'row-fresh' : '',
                  leavingIds.includes(ticket.ticket_id) ? 'row-leaving' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <button
                  type="button"
                  onClick={() => {
                    setCursor(index);
                    openTicket(ticket);
                  }}
                  onFocus={() => setCursor(index)}
                  tabIndex={index === cursor ? 0 : -1}
                  data-attention="true"
                  data-selected={index === cursor ? 'true' : undefined}
                  className="journal-row flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4"
                  aria-label={`Открыть диалог по заявке ${ticket.ticket_id}`}
                >
                  <span className="reg-no w-6 shrink-0 tabular-nums">
                    {index < 9 ? index + 1 : '·'}
                  </span>
                  <span className="reg-no w-24 shrink-0 tabular-nums">{ticket.ticket_id}</span>

                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-sans text-sm font-medium text-ink">
                      {ticket.summary || 'Обращение без кода оборудования'}
                    </span>
                    <span className="line-clamp-2 font-sans text-sm leading-relaxed text-ink-2">
                      {ticket.description}
                    </span>
                    {ticket.missing_fields && ticket.missing_fields.length > 0 && (
                      <span className="font-sans text-xs text-warn">
                        Не хватает: {formatFieldLabels(ticket.missing_fields)}
                      </span>
                    )}
                  </span>

                  <span className="stamp shrink-0 text-warn">Уточнить</span>
                </button>
              </li>
            ))}
          </ul>
          </>
        )}
      </section>

      {/* Графа 2: заявки в работе с живым обратным отсчётом */}
      <section className="flex flex-col gap-3" aria-labelledby="active-heading">
        <h2
          id="active-heading"
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3"
        >
          Заявки в работе · {activeTickets.length}
        </h2>

        {activeTickets.length === 0 ? (
          <div className="journal px-4 py-6 font-sans text-sm text-ink-2">
            В работе нет ни одной заявки.
          </div>
        ) : (
          <>
            {/* Узкий экран: вместо таблицы на шесть колонок — карточка заявки. */}
            <SwipeRail
              label="Заявки в работе"
              count={activeTickets.length}
              className={`lg:hidden ${isStale ? 'is-stale' : ''}`}
            >
              {activeTickets.map((t) => {
                const { r, percent, state, textClass } = slaView(t);

                return (
                  <article
                    key={t.ticket_id}
                    className={`swipe-card sheet flex flex-col gap-2 p-4 ${
                      leavingIds.includes(t.ticket_id) ? 'row-leaving' : ''
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="reg-no tabular-nums">{t.ticket_id}</span>
                      <span className="font-mono text-sm uppercase text-ink-3">{t.priority}</span>
                    </div>

                    <p className="font-sans text-base font-medium leading-snug text-ink">
                      {t.summary}
                    </p>
                    <p className="font-mono text-sm text-ink-2">
                      {t.asset_id} · {t.assigned_group}
                    </p>

                    <div className="mt-1 flex flex-col gap-1.5">
                      <span className={`font-mono text-sm tabular-nums ${textClass}`}>
                        {r.text}
                        {r.overdue && <span className="ml-1.5">просрочено</span>}
                      </span>
                      <span className="sla-track" aria-hidden="true">
                        <span
                          className="sla-fill"
                          data-state={state}
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                    </div>
                  </article>
                );
              })}
            </SwipeRail>

            {/* Широкий экран: полный разворот журнала во всю рабочую ширину. */}
            <div className={`journal hidden lg:block ${isStale ? 'is-stale' : ''}`}>
              <table className="ledger ledger-dense">
                <thead>
                  <tr>
                    <th>Номер</th>
                    <th>Оборудование</th>
                    <th>Суть обращения</th>
                    <th>Критичность</th>
                    <th>Остаток срока</th>
                    <th>Группа</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTickets.map((t) => {
                    const { r, percent, state, textClass } = slaView(t);

                    return (
                      <tr
                        key={t.ticket_id}
                        className={leavingIds.includes(t.ticket_id) ? 'row-leaving' : ''}
                      >
                        <td>{t.ticket_id}</td>
                        <td className="cell-mono">{t.asset_id}</td>
                        <td className="cell-key">{t.summary}</td>
                        <td className="cell-mono uppercase">{t.priority}</td>
                        <td>
                          <span className="flex flex-col gap-1">
                            <span className={`font-mono text-xs tabular-nums ${textClass}`}>
                              {r.text}
                              {r.overdue && <span className="ml-1.5 text-[10px]">просрочено</span>}
                            </span>
                            <span className="sla-track" aria-hidden="true">
                              <span
                                className="sla-fill"
                                data-state={state}
                                style={{ width: `${percent}%` }}
                              />
                            </span>
                          </span>
                        </td>
                        <td className="cell-mono">{t.assigned_group}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Бланк уточнения */}
      {selectedTicket && (
        <ClarifyDialog
          ticket={selectedTicket}
          replyText={replyText}
          onChangeReply={setReplyText}
            onClose={() => {
              if (clarificationTimerRef.current !== null) {
                window.clearTimeout(clarificationTimerRef.current);
                clarificationTimerRef.current = null;
              }
              setIsWaitingForClient(false);
              setSelectedTicket(null);
            }}
            onSend={handleSendClarification}
            onCommit={() => handleCommit(false)}
            isSending={isSending}
            isWaitingForClient={isWaitingForClient}
            isCommitting={isCommitting}
          statusMessage={statusMessage}
          statusKind={statusKind}
        />
      )}

      {/* Состояние: конфликт — заявку изменил другой диспетчер */}
      {conflict && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 scrim"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="conflict-title"
          aria-describedby="conflict-body"
        >
          <div className="sheet w-full max-w-md">
            <div className="flex items-start gap-3 border-b border-rule-strong px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
              <div>
                <h2 id="conflict-title" className="font-sans text-sm font-semibold text-ink">
                  Заявку уже изменили
                </h2>
                <p className="mt-0.5 font-mono text-[11px] text-ink-3 tabular-nums">
                  {conflict.ticket.ticket_id}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 px-4 py-3">
              <p id="conflict-body" className="font-sans text-sm leading-relaxed text-ink-2">
                Заявку изменил другой диспетчер — на сервере она в состоянии{' '}
                <span className="font-mono text-ink">{conflict.theirStatus}</span>. Ваши изменения не
                записаны.
              </p>

              <p className="flex items-start gap-2 border border-rule bg-panel-2 px-3 py-2 font-sans text-sm leading-relaxed text-ink-2">
                <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden="true" />
                <span>Перехват нужен только если версия коллеги точно ошибочна.</span>
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={async () => {
                    setConflict(null);
                    setSelectedTicket(null);
                    await syncFromServer();
                  }}
                  className="inline-flex min-h-11 flex-1 items-center justify-center bg-accent px-4 font-sans text-sm font-medium text-on-accent hover:bg-accent-hover"
                >
                  Оставить коллеге
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConflict(null);
                    handleCommit(true);
                  }}
                  className="inline-flex min-h-11 flex-1 items-center justify-center border border-danger px-4 font-sans text-sm font-medium text-danger hover:bg-danger-bg"
                >
                  Перехватить заявку
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
