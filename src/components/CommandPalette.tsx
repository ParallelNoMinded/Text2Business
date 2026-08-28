import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import { TabType } from './Header';

/**
 * Командная палитра.
 *
 * Диспетчер разбирает сотни обращений за смену, и мышь на этом объёме
 * заметно медленнее клавиатуры. Палитра открывается на Ctrl+K (⌘K),
 * фильтрует разделы и действия набором, перемещается стрелками или
 * j/k и подтверждает выбор на Enter.
 *
 * По требованиям 08-requirements.md: движение только по действию
 * пользователя, палитра появляется без анимации въезда и не перекрывает
 * рабочую область целиком.
 */

export interface PaletteCommand {
  id: string;
  label: string;
  hint: string;
  /** Группа в палитре: разделы журнала или действия над данными. */
  group: 'Разделы' | 'Действия';
  run: () => void;
}

interface CommandPaletteProps {
  /** Разделы стенда — попадают в палитру как переходы. */
  sections: { tab: TabType; label: string; hint: string }[];
  onNavigate: (tab: TabType) => void;
  /** Дополнительные действия: демо-режим, тема, обновление данных. */
  actions?: PaletteCommand[];
}

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  sections,
  onNavigate,
  actions = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const commands = useMemo<PaletteCommand[]>(
    () => [
      ...sections.map((s) => ({
        id: `nav-${s.tab}`,
        label: s.label,
        hint: s.hint,
        group: 'Разделы' as const,
        run: () => onNavigate(s.tab),
      })),
      ...actions,
    ],
    [sections, actions, onNavigate]
  );

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return commands;
    return commands.filter(
      (c) => normalize(c.label).includes(q) || normalize(c.hint).includes(q)
    );
  }, [commands, query]);

  // Открытие палитры: Ctrl+K или ⌘K из любого места стенда.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCursor(0);
      // Фокус в поле набора сразу после открытия.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  // Прокрутка к выбранной строке, если список длиннее окна.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const runCommand = (index: number) => {
    const cmd = results[index];
    if (!cmd) return;
    setIsOpen(false);
    cmd.run();
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // CJK-раскладки: не подтверждаем, пока идёт набор иероглифов.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;

    if (e.key === 'ArrowDown' || (e.ctrlKey && e.key.toLowerCase() === 'j')) {
      e.preventDefault();
      setCursor((c) => (results.length ? (c + 1) % results.length : 0));
      return;
    }
    if (e.key === 'ArrowUp' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      setCursor((c) => (results.length ? (c - 1 + results.length) % results.length : 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(cursor);
      return;
    }
    // Цифра при пустом наборе — быстрый переход к разделу по номеру графы.
    if (!query && /^[1-9]$/.test(e.key)) {
      const index = Number(e.key) - 1;
      if (index < results.length) {
        e.preventDefault();
        runCommand(index);
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden items-center gap-2 border border-rule bg-panel px-3 py-1.5 font-mono text-[11px] text-ink-3 hover:border-rule-strong hover:text-ink-2 lg:inline-flex"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Поиск по стенду</span>
        <span className="kbd">Ctrl</span>
        <span className="kbd">K</span>
      </button>
    );
  }

  let lastGroup = '';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[10vh] scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="palette-title"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="sheet flex w-full max-w-xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="palette-title" className="sr-only">
          Командная палитра стенда
        </h2>

        {/* Поле набора — как графа «поиск по журналу» */}
        <div className="flex items-center gap-2 border-b border-rule-strong bg-panel-2 px-3">
          <Search className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleFieldKeyDown}
            aria-label="Поиск раздела или действия"
            aria-controls="palette-results"
            placeholder="Раздел или действие…"
            className="min-h-11 w-full bg-transparent font-sans text-sm text-ink outline-none placeholder:text-ink-3"
          />
          <span className="kbd shrink-0">Esc</span>
        </div>

        {/* Результаты — строки журнала с номером графы слева */}
        {results.length === 0 ? (
          <p className="px-4 py-8 text-center font-sans text-xs text-ink-2">
            Ничего не найдено. Уточните запрос или нажмите Esc.
          </p>
        ) : (
          <ul
            ref={listRef}
            id="palette-results"
            className="max-h-[46vh] overflow-y-auto"
            role="listbox"
            aria-label="Найденные команды"
          >
            {results.map((cmd, index) => {
              const showGroup = cmd.group !== lastGroup;
              lastGroup = cmd.group;
              const isActive = index === cursor;

              return (
                <React.Fragment key={cmd.id}>
                  {showGroup && (
                    <li
                      className="border-b border-rule bg-panel-2 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3"
                      aria-hidden="true"
                    >
                      {cmd.group}
                    </li>
                  )}
                  <li role="option" aria-selected={isActive} data-index={index}>
                    <button
                      type="button"
                      onMouseEnter={() => setCursor(index)}
                      onClick={() => runCommand(index)}
                      data-selected={isActive ? 'true' : undefined}
                      className="journal-row flex w-full items-baseline gap-3"
                    >
                      <span className="reg-no w-5 shrink-0 tabular-nums">
                        {index < 9 ? index + 1 : '·'}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-sans text-sm font-medium text-ink">{cmd.label}</span>
                        <span className="truncate font-sans text-xs text-ink-2">{cmd.hint}</span>
                      </span>
                      {isActive && (
                        <CornerDownLeft
                          className="h-3.5 w-3.5 shrink-0 text-ink-3"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        )}

        {/* Подсказка по клавишам */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule-strong bg-panel-2 px-3 py-2 font-mono text-[10px] text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="kbd">↑</span>
            <span className="kbd">↓</span>
            выбор
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="kbd">1</span>–<span className="kbd">9</span>
            быстрый переход
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="kbd">↵</span>
            открыть
          </span>
        </div>
      </div>
    </div>
  );
};
