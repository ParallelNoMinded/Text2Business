import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { HelpView } from './components/HelpView';
import { tabsForRole, type TabType } from './navigation';
import { LandingHome } from './components/LandingHome';
import { ChannelsConfigView } from './components/ChannelsConfigView';
import { OperatorConsoleView } from './components/OperatorConsoleView';
import { DatabaseInspectorView } from './components/DatabaseInspectorView';
import { LogsTracesView } from './components/LogsTracesView';
import { DocumentationView } from './components/DocumentationView';
import { GeminiTokenModal } from './components/GeminiTokenModal';
import { ScenarioRunner } from './components/ScenarioRunner';
import { FactExtractorView } from './components/FactExtractorView';
import { DispatchCard } from './components/DispatchCard';
import { CommandPalette, PaletteCommand } from './components/CommandPalette';
import { SCENARIO_PRESETS } from './scenarios';
import { ProcessingResult } from './types';
import { apiFetch } from './api';
import { createInitialDatabase, DatabaseSchema } from './mockDb';
import { SignInView } from './components/SignInView';
import { UserManagementView } from './components/UserManagementView';
import { clearDemoRole, readDemoUser, saveDemoRole } from './demoSession';

/** Разделы стенда для командной палитры — порядок совпадает с полосой меню. */
const PALETTE_SECTIONS: { tab: TabType; label: string; hint: string }[] = [
  { tab: 'operator', label: 'Диспетчер', hint: 'Рабочее место: проверка и подтверждение заявок' },
  { tab: 'database', label: 'Реестр заявок', hint: 'Сохранённые заявки, оборудование, договоры' },
  { tab: 'console', label: 'Демо-стенд', hint: 'Разбор входящего обращения по шагам' },
  { tab: 'channels', label: 'Каналы', hint: 'Источники входящих обращений' },
  { tab: 'logs_traces', label: 'Логи и трейсы', hint: 'Техническая трассировка запросов' },
  { tab: 'architecture', label: 'Документация', hint: 'Описание проекта и архитектурные схемы' },
  { tab: 'home', label: 'Главная', hint: 'Обзор стенда' },
  { tab: 'help', label: 'Справка', hint: 'Порядок работы в смене, сроки и статусы' },
];

export default function App() {
  const [user, setUser] = useState(() => readDemoUser());
  const role = user?.role ?? 'dispatcher';
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  // Признак живой модели приходит от сервера (/api/health), а не задаётся вручную.
  const [geminiActive, setGeminiActive] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash-lite');
  const [isDryRun, setIsDryRun] = useState<boolean>(true);
  const swipeStartRef = useRef<{ x: number; y: number; blocked: boolean } | null>(null);
  const [swipeAnnouncement, setSwipeAnnouncement] = useState('');
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // Подсказка о свайпах — только при первом визите с узкого экрана.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 1280) return;
    if (window.localStorage.getItem('swipe-hint-seen') === '1') return;
    setShowSwipeHint(true);
  }, []);

  const dismissSwipeHint = useCallback(() => {
    setShowSwipeHint(false);
    try {
      window.localStorage.setItem('swipe-hint-seen', '1');
    } catch {
      /* приватный режим — просто не запоминаем */
    }
  }, []);

  // GEMINI_API_KEY state (memory only, never persisted to localStorage)
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);

  // Sync token with server on mount & model change
  useEffect(() => {
    apiFetch('/api/llm/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: geminiApiKey, model: selectedModel }),
    }).catch(() => {});
  }, [geminiApiKey, selectedModel]);

  // Признак живой модели берём с сервера, а не предполагаем.
  useEffect(() => {
    let cancelled = false;

    const readModelStatus = () => {
      apiFetch('/api/health')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          setGeminiActive(!!data.gemini_enabled);
        })
        .catch(() => {
          if (!cancelled) setGeminiActive(false);
        });
    };

    readModelStatus();
    const timer = window.setInterval(readModelStatus, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const handleSelectModel = (newModel: string) => {
    setSelectedModel(newModel);
    // Окно токена нужно только когда ни одна модель не отвечает.
    // Если сервер уже держит живую модель, просить ключ не за что.
    if (!geminiApiKey && !geminiActive) {
      setIsTokenModalOpen(true);
    }
  };

  const handleSaveToken = (newToken: string) => {
    setGeminiApiKey(newToken);
  };

  // Реестр автономного стенда живёт только в памяти вкладки.
  const [db, setDb] = useState<DatabaseSchema>(() => createInitialDatabase());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Live Demo Workbench (tab: console)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('tc-01');
  const [rawText, setRawText] = useState<string>(SCENARIO_PRESETS[0].raw_text);
  const [channel, setChannel] = useState<string>(SCENARIO_PRESETS[0].channel);
  const [incomingTime, setIncomingTime] = useState<string>(() => new Date().toISOString());
  // Отправитель обращения: в ряде случаев имя клиента есть только здесь,
  // а не в тексте письма, поэтому оно участвует в определении контрагента.
  const [sender, setSender] = useState<string>(SCENARIO_PRESETS[0].sender);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isRunningDispatch, setIsRunningDispatch] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitSuccessMsg, setCommitSuccessMsg] = useState<string | null>(null);

  const handleSelectPreset = (presetId: string) => {
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(preset.id);
    setRawText(preset.raw_text);
    setChannel(preset.channel);
    setIncomingTime(new Date().toISOString());
    setSender(preset.sender);
    setResult(null);
    setCommitSuccessMsg(null);
  };

  const handleResetInput = () => {
    handleSelectPreset(selectedPresetId);
  };

  const handleRunDispatch = async () => {
    if (!rawText.trim()) return;
    const receivedAt = new Date().toISOString();
    setIncomingTime(receivedAt);
    setIsRunningDispatch(true);
    setCommitSuccessMsg(null);
    setResult(null);
    try {
      const res = await apiFetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          channel,
          incoming_time: receivedAt,
          sender: sender || undefined,
          is_dry_run: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCommitSuccessMsg(`Ошибка: ${data.error || res.status}`);
        return;
      }
      setResult(data);
      setCommitSuccessMsg('Симуляция завершена. Данные не сохранены в реестре.');
    } catch (err: any) {
      setCommitSuccessMsg(`Сетевая ошибка: ${err.message}`);
    } finally {
      setIsRunningDispatch(false);
    }
  };

  const handleCommitLive = async () => {
    if (!result?.ticket_payload) return;
    setIsCommitting(true);
    setCommitSuccessMsg(null);

    const ticket = result.ticket_payload as DatabaseSchema['open_tickets'][number];
    setDb((current) => ({
      ...current,
      open_tickets: [ticket, ...current.open_tickets.filter((item) => item.ticket_id !== ticket.ticket_id)],
    }));
    setCommitSuccessMsg(`Заявка ${ticket.ticket_id || 'без номера'} подтверждена и добавлена в локальный реестр.`);
    setIsCommitting(false);
  };

  // Apply Theme class to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleUpdateDb = (newDb: DatabaseSchema) => {
    setDb(newDb);
  };

  const handleResetDatabase = async () => {
    setIsLoading(true);
    setDb(createInitialDatabase());
    setIsLoading(false);
  };

  const pendingOperatorCount = (db.open_tickets || []).filter(
    (t) => t.status === 'WAITING_DISPATCHER' || (t.missing_fields && t.missing_fields.length > 0)
  ).length;

  // Действия палитры: то, что диспетчер делает часто, но что не является перходом.
  const paletteActions: PaletteCommand[] = [
    {
      id: 'act-theme',
      label: theme === 'dark' ? 'Включить светлое оформление' : 'Включить тёмное оформление',
      hint: 'Смена оформления для работы при разном освещении',
      group: 'Действия',
      run: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'act-dry-run',
      label: isDryRun ? 'Выключить безопасный режим' : 'Включить безопасный режим',
      hint: 'Безопасный режим не пишет заявки в 1С:ERP',
      group: 'Действия',
      run: () => setIsDryRun(!isDryRun),
    },
    {
      id: 'act-token',
      label: 'Настроить токен доступа к модели',
      hint: 'Технические настройки подключения к LLM',
      group: 'Действия',
      run: () => setIsTokenModalOpen(true),
    },
  ];

  if (!user) {
    return <SignInView onSelectRole={(selectedRole) => setUser(saveDemoRole(selectedRole))} />;
  }

  /* Права доступа берутся из общего списка разделов (src/navigation.ts).
     Раньше здесь лежала вторая копия правила, которую нужно было править
     синхронно с меню в шапке. */
  const allowedTabs: TabType[] = tabsForRole(role);
  const safeActiveTab: TabType = allowedTabs.includes(activeTab) ? activeTab : 'home';

  const isSwipeConflictTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return true;
    if (target.closest('input, textarea, select, button, a, summary, [role="button"], [role="dialog"], [contenteditable="true"], .swipe-rail')) {
      return true;
    }

    let element: Element | null = target;
    while (element) {
      if (element instanceof HTMLElement && element.scrollWidth > element.clientWidth + 1) {
        const overflowX = window.getComputedStyle(element).overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') return true;
      }
      element = element.parentElement;
    }
    return false;
  };

  const handleTabTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    if (window.innerWidth >= 1280 || event.touches.length !== 1) {
      swipeStartRef.current = null;
      return;
    }

    swipeStartRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      blocked: isSwipeConflictTarget(event.target),
    };
  };

  const handleTabTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || start.blocked || event.changedTouches.length !== 1) return;

    const deltaX = event.changedTouches[0].clientX - start.x;
    const deltaY = event.changedTouches[0].clientY - start.y;
    if (Math.abs(deltaX) < 72 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return;

    const currentIndex = allowedTabs.indexOf(safeActiveTab);
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= allowedTabs.length) return;

    const nextTab = allowedTabs[nextIndex];
    const nextLabel = PALETTE_SECTIONS.find(({ tab }) => tab === nextTab)?.label ?? nextTab;
    setActiveTab(nextTab);
    dismissSwipeHint();
    setSwipeAnnouncement(`Открыт раздел «${nextLabel}»`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans antialiased bg-paper text-ink">
      {/* Streamlined Header */}
      <Header
        activeTab={safeActiveTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        geminiActive={geminiActive}
        isDryRun={isDryRun}
        setIsDryRun={setIsDryRun}
        selectedModel={selectedModel}
        setSelectedModel={handleSelectModel}
        pendingOperatorCount={pendingOperatorCount}
        geminiApiKey={geminiApiKey}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        role={role}
        userName={user.name}
        onSignOut={async () => {
          clearDemoRole();
          setUser(null);
          setActiveTab('home');
          setDb(createInitialDatabase());
        }}
      />

      {/* Командная палитра: Ctrl+K из любого раздела стенда */}
      <CommandPalette
        sections={PALETTE_SECTIONS.filter(({ tab }) => allowedTabs.includes(tab))}
        onNavigate={setActiveTab}
        actions={paletteActions}
      />

      {/* GITHUB_MODELS_TOKEN Setup Modal */}
      <GeminiTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        token={geminiApiKey}
        onSaveToken={handleSaveToken}
        selectedModel={selectedModel}
        theme={theme}
      />

      {/* Main Content Area */}
      {/* Рабочая область занимает всю ширину монитора: ограничитель задан
          один раз в .wide-container, чтобы графы журнала не сжимались в
          узкую колонку по центру широкого экрана. */}
      <main
        className="wide-container mx-auto w-full flex-1 touch-pan-y px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        onTouchStart={handleTabTouchStart}
        onTouchEnd={handleTabTouchEnd}
      >
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {swipeAnnouncement}
        </span>
        {showSwipeHint && (
          <aside className="mb-5 flex items-center justify-between gap-3 border border-rule bg-panel px-3 py-2 xl:hidden" aria-label="Подсказка навигации">
            <p className="min-w-0 font-sans text-sm text-ink-2">
              <span className="font-semibold text-ink">Смахните влево или вправо</span>
              <span className="block truncate text-xs text-ink-3">
                Между соседними разделами рабочего места
              </span>
            </p>
            <button type="button" onClick={dismissSwipeHint} className="ui-button ui-button-secondary shrink-0" aria-label="Закрыть подсказку">
              Понятно
            </button>
          </aside>
        )}
        {/* TAB 0: LANDING HOME PAGE */}
        {safeActiveTab === 'home' && (
          <LandingHome
            setActiveTab={setActiveTab}
            role={role}
            pendingCount={pendingOperatorCount}
          />
        )}

        {/* TAB 1: CONNECTORS & CHANNELS CONFIG */}
        {safeActiveTab === 'channels' && (
          <ChannelsConfigView
            theme={theme}
            onNavigateToConsole={() => setActiveTab('console')}
          />
        )}

        {/* TAB 1.5: LIVE DISPATCH WORKBENCH (console) */}
        {safeActiveTab === 'console' && (
          <div className="demo-readable flex flex-col gap-5">
            <div className="sheet flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-start sm:p-6">
              <div>
                <h1 className="font-sans text-xl font-bold tracking-tight text-ink sm:text-2xl">Демо-стенд разбора обращения</h1>
                <p className="mt-2 max-w-2xl font-sans text-base leading-relaxed text-ink-2">
                  Здесь можно проверить разбор обращения без изменения рабочей очереди.
                </p>
              </div>
              <span className="stamp shrink-0 text-warn">Симуляция — данные не сохраняются</span>
            </div>

            <div className={result ? 'grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]' : ''}>
              <ScenarioRunner
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              rawText={rawText}
              setRawText={setRawText}
              channel={channel}
              setChannel={setChannel}
              incomingTime={incomingTime}
              setIncomingTime={setIncomingTime}
              isDryRun={isDryRun}
              setIsDryRun={setIsDryRun}
              onRunDispatch={handleRunDispatch}
              isLoading={isRunningDispatch}
              onResetInput={handleResetInput}
              theme={theme}
              />

              {result && <div className="flex min-w-0 flex-col gap-5">
                <FactExtractorView facts={result.extracted_facts} theme={theme} />
                <DispatchCard result={result} commitSuccessMsg={commitSuccessMsg} theme={theme} />
              </div>}
            </div>

            {!result && <div className="empty-state">
              <h2 className="text-base font-bold text-ink">Результат появится после разбора</h2>
            </div>}

            <div className="sheet flex flex-wrap items-baseline gap-x-3 gap-y-2 p-4 sm:p-5">
              <span className="font-mono text-sm font-medium uppercase tracking-[0.08em] text-ink-2">
                Ожидаемый результат
              </span>
              <span className="font-sans text-base leading-relaxed text-ink">
                {SCENARIO_PRESETS.find((p) => p.id === selectedPresetId)?.expected_outcome}
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: OPERATOR HITL WORKBENCH */}
        {safeActiveTab === 'operator' && (
          <OperatorConsoleView
            db={db}
            onUpdateDb={handleUpdateDb}
            theme={theme}
          />
        )}

        {/* TAB 3: DATABASE REGISTRY */}
        {safeActiveTab === 'database' && (
          <DatabaseInspectorView
            db={db}
            onResetDatabase={handleResetDatabase}
            onUpdateDb={handleUpdateDb}
            isLoading={isLoading}
            theme={theme}
          />
        )}

        {/* TAB 4: LOGS & TRACES */}
        {safeActiveTab === 'logs_traces' && (
          <LogsTracesView theme={theme} db={db} />
        )}

        {/* TAB 5: ARCHITECTURE REPORT & C4 SCHEMAS */}
        {safeActiveTab === 'architecture' && role === 'admin' && (
          <DocumentationView theme={theme} />
        )}

        {safeActiveTab === 'users' && role === 'admin' && (
          <UserManagementView />
        )}

        {/* TAB 6: СПРАВКА — доступна обеим ролям */}
        {safeActiveTab === 'help' && (
          <HelpView role={role} onNavigate={setActiveTab} />
        )}
      </main>

      {/* Antigravity Footer */}
      {/* Нижний колонтитул бланка: служебные пометки, как под таблицей журнала. */}
      <footer className="mt-8 border-t border-rule bg-panel py-4">
        <div className="wide-container mx-auto flex w-full flex-col gap-1 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-ink-2">Text2Business · Диспетчерская обращений</p>
          <p className="font-mono text-[11px] text-ink-3">Защищённый рабочий контур · данные сверяются с реестром</p>
        </div>
      </footer>
    </div>
  );
}
