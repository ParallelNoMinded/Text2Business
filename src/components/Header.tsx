import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Key, Menu, X, ChevronDown, LogOut } from 'lucide-react';

import { navItemsForRole, type Role, type TabType } from '../navigation';

/* Тип раздела живёт в src/navigation.ts вместе со составом меню и правами
   доступа. Здесь он переэкспортируется, чтобы существующие импорты
   `from './Header'` продолжали работать. */
export type { TabType };

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  geminiActive: boolean;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isDryRun: boolean;
  setIsDryRun: (val: boolean) => void;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  pendingOperatorCount?: number;
  geminiApiKey?: string;
  onOpenTokenModal?: () => void;
  role: Role;
  userName: string;
  onSignOut: () => Promise<void>;
}

const MODEL_OPTIONS = ['gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-3.1-pro'];

/** Закрытие всплывающей панели по Escape и щелчку вне неё. */
function useDismiss(
  isOpen: boolean,
  close: () => void,
  panelRef: React.RefObject<HTMLElement | null>,
  triggerRef: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        (triggerRef.current as HTMLElement | null)?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen, close, panelRef, triggerRef]);
}

/** Номер графы в шапке журнала: 01 … 07. Это настоящая нумерация разделов. */
const grapheNo = (index: number) => String(index + 1).padStart(2, '0');

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  geminiActive,
  selectedModel = 'gemini-3.5-flash-lite',
  setSelectedModel,
  pendingOperatorCount = 1,
  geminiApiKey = '',
  onOpenTokenModal,
  role,
  userName,
  onSignOut,
}) => {
  const isDark = theme === 'dark';
  /* Состав меню берётся из общего списка разделов: право открыть раздел и
     право увидеть его в меню — одно и то же правило, описанное однажды. */
  const visibleNavItems = navItemsForRole(role);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);

  useDismiss(isMenuOpen, () => setIsMenuOpen(false), menuRef, menuButtonRef);
  useDismiss(isSettingsOpen, () => setIsSettingsOpen(false), settingsRef, settingsButtonRef);

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
    setIsSettingsOpen(false);
  };

  /**
   * Страховка для клавиатуры: если пункт всё же оказался за краем полосы,
   * при получении фокуса он подтягивается в видимую область.
   */
  const keepFocusVisible = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  const iconButton =
    'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rule bg-panel text-ink-2 hover:border-rule-strong hover:bg-panel-2 hover:text-ink';

  const roleTitle = role === 'admin' ? 'Администратор' : 'Диспетчер';

  /* Инициалы для кнопки аккаунта: выход и данные сотрудника ищут под своим
     именем, а не под шестерёнкой, поэтому меню открывается «собой». */
  const initials = userName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '—';


  /* Графа журнала: активная — залита чернилами, остальные — сухие. */
  const grapheClasses = (tab: TabType) =>
    activeTab === tab
      ? 'bg-accent-bg text-accent'
      : 'text-ink-2 hover:bg-panel-2 hover:text-ink';

  const pendingMark = (extraClass: string) =>
    pendingOperatorCount > 0 ? (
      <span
        className={`${extraClass} border border-current px-1 font-mono text-[10px] leading-tight text-warn`}
      >
        {pendingOperatorCount}
        <span className="sr-only"> заявок ожидают проверки</span>
      </span>
    ) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-rule-strong bg-paper">
      <div className="wide-container mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Шапка журнала: наименование книги слева, служебное справа. */}
        <div className="flex h-16 items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => handleSelectTab('home')}
            className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
            aria-label="Перейти на главную страницу"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent font-mono text-xs font-semibold text-on-accent">
              T2
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-sans text-sm font-bold leading-tight text-ink">
                Text2Business
              </span>
              <span className="truncate font-sans text-xs text-ink-3">
                Диспетчерская обращений
              </span>
            </span>
          </button>

          <div className="flex flex-shrink-0 items-center gap-2">
            <div className="relative">
              <button
                ref={settingsButtonRef}
                id="header-settings-btn"
                type="button"
                onClick={() => {
                  setIsSettingsOpen((v) => !v);
                  setIsMenuOpen(false);
                }}
                aria-expanded={isSettingsOpen}
                aria-controls="header-settings-panel"
                aria-label={`${userName}, ${roleTitle}. Аккаунт, настройки и выход из системы`}
                title={`${userName} — аккаунт и настройки`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-rule bg-panel pl-1 pr-2 text-ink-2 hover:border-rule-strong hover:bg-panel-2 hover:text-ink"
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-bg font-mono text-[11px] font-semibold text-accent"
                >
                  {initials}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>

              {isSettingsOpen && (
                <div
                  ref={settingsRef}
                  id="header-settings-panel"
                  className="absolute right-0 top-full z-50 mt-1 w-72 border border-rule-strong bg-panel p-4"
                >
                  {/* ��то вошёл — первым: меню открывается кнопкой с инициалами,
                      и первое, что нужно подтвердить, — что это тот аккаунт. */}
                  <div className="flex items-center gap-3 border-b border-rule pb-3">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-bg font-mono text-xs font-semibold text-accent"
                    >
                      {initials}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold text-ink">{userName}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                        {roleTitle}
                      </span>
                    </span>
                  </div>

                  <h2 className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
                    Служебные отметки
                  </h2>

                  {/* Состояние разбора: приходит с сервера, не задаётся вручную. */}
                  <dl className="mt-3 border border-rule bg-paper p-3">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                      Разбор обращений
                    </dt>
                    <dd className="mt-1 flex items-baseline gap-2">
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 shrink-0 translate-y-[-1px] ${
                          geminiActive ? 'bg-ink' : 'bg-ink-3'
                        }`}
                      />
                      <span className="font-mono text-xs text-ink">
                        {geminiActive ? 'Модель Gemini' : 'Встроенный распознаватель'}
                      </span>
                    </dd>
                    <dd className="mt-1.5 text-[11px] leading-relaxed text-ink-3">
                      {geminiActive
                        ? 'Ключ Gemini прочитан сервером. Разбор идёт через модель.'
                        : 'Модель не отвечает. Поля заполняет набор правил — возможны ошибки определения оборудования.'}
                    </dd>
                    <dd className="mt-2 border-t border-rule pt-2 text-[11px] leading-relaxed text-ink-3">
                      Используется прямое подключение к Google Gemini API.
                    </dd>
                  </dl>

                  <div className="mt-4 flex flex-col gap-1.5">
                    <label htmlFor="header-model-dropdown" className="text-xs font-medium text-ink-2">
                      Модель обработки текста
                    </label>
                    <select
                      id="header-model-dropdown"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel?.(e.target.value)}
                      className="min-h-11 w-full border border-rule bg-paper px-3 font-mono text-xs text-ink"
                    >
                      {MODEL_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] leading-relaxed text-ink-3">
                      Выбранная Gemini-модель используется для разбора обращений; при недоступности
                      сервер попробует резервную Flash-модель.
                    </p>
                  </div>

                  {role === 'admin' && <div className="mt-4 flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-ink-2">Токен доступа</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenTokenModal?.();
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-2 border border-rule bg-paper px-3 font-mono text-xs text-ink hover:bg-panel-2"
                    >
                      <Key className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{geminiApiKey ? 'Токен задан — изменить' : 'Задать токен доступа'}</span>
                    </button>
                  </div>}

                  {/* Единственный выход из системы. Внизу меню и с подписью:
                      действие завершает смену, поэтому требует намерения, а не
                      попадания по иконке в шапке. */}
                  <div className="mt-4 border-t border-rule pt-4">
                    <button
                      type="button"
                      disabled={isSigningOut}
                      onClick={handleSignOut}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-rule bg-paper px-3 font-sans text-sm font-semibold text-ink hover:border-rule-strong hover:bg-panel-2 disabled:cursor-wait disabled:opacity-60"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      {isSigningOut ? 'Выходим…' : 'Выйти из системы'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Голая иконка выхода отсюда убрана: она дублировала подписанную
                кнопку в меню аккаунта и стояла вплотную к переключателю темы,
                где один промах по соседней кнопке заканчивал смену. */}
            <button
              id="header-theme-btn"
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={iconButton}
              aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
            >
              {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            </button>

            {/* Меню разделов для телефона и планшета */}
            <button
              ref={menuButtonRef}
              id="header-menu-btn"
              type="button"
              onClick={() => {
                setIsMenuOpen((v) => !v);
                setIsSettingsOpen(false);
              }}
              aria-expanded={isMenuOpen}
              aria-controls="header-sections-menu"
              aria-label={isMenuOpen ? 'Закрыть меню разделов' : 'Открыть меню разделов'}
              className={`${iconButton} xl:hidden`}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <span className="relative inline-flex items-center justify-center">
                  <Menu className="h-5 w-5" aria-hidden="true" />
                  {pendingOperatorCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 h-1.5 w-1.5 bg-warn" />
                  )}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/*
        Графы журнала — разлинованная строка разделов.
        Ограничение max-w-2xl снято: из-за него последний пункт обрезался
        даже на больших мониторах. Технические настройки убраны в отдельное
        меню, поэтому все 7 пунктов помещаются начиная с 1280 px.
      */}
      <nav aria-label="Основные разделы" className="hidden border-t border-rule bg-panel xl:block">
        <ul className="wide-container mx-auto flex w-full items-center gap-1 px-4 py-2 sm:px-6 lg:px-8">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.tab} className="flex">
                <button
                  id={item.domId}
                  type="button"
                  onClick={() => handleSelectTab(item.tab)}
                  onFocus={keepFocusVisible}
                  aria-current={activeTab === item.tab ? 'page' : undefined}
                  title={item.hint}
                  className={`flex min-h-11 items-center gap-2 rounded-lg px-3 ${grapheClasses(item.tab)}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="font-sans text-sm font-semibold">{item.label}</span>
                  {item.tab === 'operator' && pendingMark('ml-0.5')}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Все 7 разделов доступны на телефоне и планшете */}
      {isMenuOpen && (
        <div ref={menuRef} id="header-sections-menu" className="border-t border-rule bg-panel xl:hidden">
          <nav aria-label="Разделы" className="wide-container mx-auto w-full px-4 py-2 sm:px-6">
            <ul className="flex flex-col sm:grid sm:grid-cols-2">
              {visibleNavItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;
                return (
                  <li key={item.tab} className="border-b border-rule last:border-b-0">
                    <button
                      id={`${item.domId}-mobile`}
                      type="button"
                      onClick={() => handleSelectTab(item.tab)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-h-12 w-full items-center gap-3 px-2 py-2.5 text-left ${
                        isActive ? 'bg-accent text-on-accent' : 'text-ink hover:bg-panel-2'
                      }`}
                    >
                      <span className="font-mono text-[11px] tabular-nums opacity-60">{grapheNo(index)}</span>
                      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      <span className="flex min-w-0 flex-col">
                        <span className="font-sans text-sm font-medium">{item.label}</span>
                        <span className={`font-sans text-[11px] ${isActive ? 'opacity-80' : 'text-ink-3'}`}>
                          {item.hint}
                        </span>
                      </span>
                      {item.tab === 'operator' && pendingMark('ml-auto')}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};
