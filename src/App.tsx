import React, { useState, useEffect, useCallback } from 'react';
import { Header, TabType } from './components/Header';
import { LandingHome } from './components/LandingHome';
import { ChannelsConfigView } from './components/ChannelsConfigView';
import { OperatorConsoleView } from './components/OperatorConsoleView';
import { DatabaseInspectorView } from './components/DatabaseInspectorView';
import { LogsTracesView } from './components/LogsTracesView';
import { ArchitectureView } from './components/ArchitectureView';
import { GithubTokenModal } from './components/GithubTokenModal';
import { ScenarioRunner } from './components/ScenarioRunner';
import { FactExtractorView } from './components/FactExtractorView';
import { DispatchCard } from './components/DispatchCard';
import { ExecutionTraceTimeline } from './components/ExecutionTraceTimeline';
import { SCENARIO_PRESETS } from './scenarios';
import { ProcessingResult, Ticket, PublicUser } from './types';
import { apiFetch } from './api';
import {
  startUXSession,
  startDispatchMeasurement,
  markDecisionReceived,
  completeUXScenario,
} from './uxMetrics';
import { INITIAL_DATABASE, DatabaseSchema } from './mockDb';
import { PageSection } from './components/layout/PageSection';
import { PipelineRail } from './components/pipeline/PipelineRail';
import { LoginView } from './components/LoginView';
import { RegisterView } from './components/RegisterView';
import { ProfileView } from './components/ProfileView';
import { AdminUsersView } from './components/AdminUsersView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { AdminAnalyticsView } from './components/AdminAnalyticsView';
import { AccessDenied } from './components/AccessDenied';
import { WorkSlaView } from './components/WorkSlaView';
import { WorkHistoryView } from './components/WorkHistoryView';
import { WorkNotificationsView } from './components/WorkNotificationsView';
import { clearSessionId, getSessionId } from './authSession';
import { navigateTo, usePathname } from './appPath';
import { canAccessPath, canAccessTab, pathForTab, tabForPath } from './roles';

export default function App() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [geminiActive, setGeminiActive] = useState(true);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  useEffect(() => {
    startUXSession();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const sid = getSessionId();
    if (!sid) {
      setAuthReady(true);
      return;
    }
    apiFetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.user) setCurrentUser(data.user);
        else clearSessionId();
      })
      .catch(() => {
        if (!cancelled) clearSessionId();
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error('unhealthy');
        const data = await res.json();
        if (!cancelled) {
          setApiHealthy(true);
          setGeminiActive(Boolean(data.gemini_enabled));
        }
      } catch {
        if (!cancelled) setApiHealthy(false);
      }
    };
    ping();
    const id = setInterval(ping, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [isDryRun, setIsDryRun] = useState<boolean>(true);

  // GITHUB_MODELS_TOKEN state (memory only, never persisted to localStorage)
  const [githubToken, setGithubToken] = useState<string>('');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);

  // Sync token with server on mount & model change
  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    apiFetch('/api/llm/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: githubToken, model: selectedModel }),
    }).catch(() => {});
  }, [githubToken, selectedModel, currentUser?.role]);

  const handleSelectModel = (newModel: string) => {
    setSelectedModel(newModel);
    // Prompt token modal if user selects model and no token is set
    if (!githubToken) {
      setIsTokenModalOpen(true);
    }
  };

  const handleSaveToken = (newToken: string) => {
    setGithubToken(newToken);
  };

  // DB State
  const [db, setDb] = useState<DatabaseSchema>(INITIAL_DATABASE);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Live Demo Workbench (tab: console)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('tc-01');
  const [rawText, setRawText] = useState<string>(SCENARIO_PRESETS[0].raw_text);
  const [channel, setChannel] = useState<string>(SCENARIO_PRESETS[0].channel);
  const [incomingTime, setIncomingTime] = useState<string>(SCENARIO_PRESETS[0].incoming_time);
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
    setIncomingTime(preset.incoming_time);
    setResult(null);
    setCommitSuccessMsg(null);
  };

  const handleResetInput = () => {
    handleSelectPreset(selectedPresetId);
  };

  const handleRunDispatch = async () => {
    startDispatchMeasurement();
    if (!rawText.trim()) return;
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
          incoming_time: incomingTime || undefined,
          is_dry_run: true,
        }),
      });
      const data = await res.json();
	markDecisionReceived();
      if (!res.ok) {
        setCommitSuccessMsg(`❌ Ошибка: ${data.error || res.status}`);
        return;
      }
      setResult(data);
    } catch (err: any) {
      setCommitSuccessMsg(`❌ Сетевая ошибка: ${err.message}`);
    } finally {
      setIsRunningDispatch(false);
    }
  };

  const handleCommitLive = async (payloadOverride?: Partial<Ticket>) => {
    if (!result?.ticket_payload) return;
    setIsCommitting(true);
    setCommitSuccessMsg(null);
    try {
      const res = await apiFetch('/api/commit-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_payload: { ...result.ticket_payload, ...payloadOverride },
          action: result.recommended_action,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCommitSuccessMsg(`❌ Коммит отклонен: ${data.error || res.status}`);
        return;
      }
	completeUXScenario();
      setCommitSuccessMsg(`✅ Заявка ${data.ticket.ticket_id} подтверждена оператором и сохранена в БД (${data.action}).`);
      await fetchDatabase();
    } catch (err: any) {
      setCommitSuccessMsg(`❌ Ошибка коммита: ${err.message}`);
    } finally {
      setIsCommitting(false);
    }
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

  // Fetch Database on Mount
  const fetchDatabase = useCallback(async () => {
    try {
      const res = await apiFetch('/api/database');
      if (res.ok) {
        const data = await res.json();
        setDb(data);
      }
    } catch (err) {
      console.warn('Backend server database fetch fallback:', err);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchDatabase();
    const interval = setInterval(() => {
      fetchDatabase();
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchDatabase, currentUser]);

  const handleUpdateDb = (newDb: DatabaseSchema) => {
    setDb(newDb);
    apiFetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDb),
    }).catch((err) => console.warn('Sync DB error:', err));
  };

  // Reset Database
  const handleResetDatabase = async () => {
    setIsLoading(true);
    try {
      await apiFetch('/api/database/reset', { method: 'POST' });
      await fetchDatabase();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingOperatorCount = (db.open_tickets || []).filter(
    (t) => t.status === 'WAITING_DISPATCHER' || (t.missing_fields && t.missing_fields.length > 0)
  ).length;

  const isAdmin = currentUser?.role === 'admin';

  const guardedSetTab = (tab: TabType) => {
    if (currentUser && !canAccessTab(currentUser.role, tab)) {
      navigateTo('/');
      setActiveTab('home');
      return;
    }
    if (currentUser) navigateTo(pathForTab(tab, currentUser.role));
    setActiveTab(tab);
  };

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser && pathname !== '/login' && pathname !== '/register') {
      navigateTo('/login');
    }
  }, [authReady, currentUser, pathname]);

  useEffect(() => {
    if (!authReady || !currentUser) return;
    if (pathname === '/login' || pathname === '/register') {
      navigateTo('/');
      return;
    }
    if (!canAccessPath(currentUser.role, pathname)) return;
    const tab = tabForPath(pathname);
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [authReady, currentUser, pathname]);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    clearSessionId();
    setCurrentUser(null);
    setActiveTab('home');
    navigateTo('/login');
  };

  if (!authReady) {
    return (
      <div className="oc-shell flex min-h-screen items-center justify-center text-[12px] text-[var(--oc-muted)]">
        Проверка сессии…
      </div>
    );
  }

  if (!currentUser && pathname === '/register') {
    return <RegisterView onAuthenticated={setCurrentUser} />;
  }

  if (!currentUser) {
    return <LoginView onAuthenticated={setCurrentUser} />;
  }

  const pathAllowed = canAccessPath(currentUser.role, pathname);

  return (
    <div className="oc-shell flex min-h-screen flex-col antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-[var(--oc-surface)] focus:px-3 focus:py-1.5 focus:text-xs"
      >
        Перейти к содержимому
      </a>
      <Header
        activeTab={activeTab}
        setActiveTab={guardedSetTab}
        theme={theme}
        setTheme={setTheme}
        geminiActive={geminiActive}
        isDryRun={isDryRun}
        setIsDryRun={setIsDryRun}
        selectedModel={selectedModel}
        setSelectedModel={handleSelectModel}
        pendingOperatorCount={pendingOperatorCount}
        githubToken={githubToken}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        apiHealthy={apiHealthy}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* GITHUB_MODELS_TOKEN Setup Modal */}
      {isAdmin && (
      <GithubTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        token={githubToken}
        onSaveToken={handleSaveToken}
        selectedModel={selectedModel}
        theme={theme}
      />
      )}

      <main id="main-content" className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-4 sm:px-6">
        {!pathAllowed ? (
          <AccessDenied
            onGoHome={() => {
              navigateTo('/');
              setActiveTab('home');
            }}
          />
        ) : (
          <>
        {activeTab === 'home' && (
          <LandingHome
            setActiveTab={guardedSetTab}
            theme={theme}
            pendingOperatorCount={pendingOperatorCount}
            apiHealthy={apiHealthy}
            db={db}
            lastResult={result}
            geminiActive={geminiActive}
            githubToken={githubToken}
            isDryRun={isDryRun}
            isAdmin={isAdmin}
          />
        )}

        {/* TAB 1: CONNECTORS & CHANNELS CONFIG */}
        {isAdmin && activeTab === 'channels' && (
          <ChannelsConfigView
            theme={theme}
            onNavigateToConsole={() => guardedSetTab('console')}
            onViewLogs={() => guardedSetTab('logs_traces')}
          />
        )}

        {/* TAB 1.5: LIVE DISPATCH WORKBENCH (console) */}
        {isAdmin && activeTab === 'console' && (
          <div className="grid gap-3">
            <PageSection
              title="Демо-стенд · пайплайн ИИ-диспетчера"
              description="Входящее → факты → реестр/SLA → решение → подтверждение оператора → исполнение. Черновик до подтверждения."
              status={
                isRunningDispatch
                  ? { tone: 'info', label: 'ИДЁТ' }
                  : isDryRun
                    ? { tone: 'warning', label: 'ЧЕРНОВИК' }
                    : { tone: 'success', label: 'АКТИВЕН' }
              }
            />
            <PipelineRail result={result} running={isRunningDispatch} />

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
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
              <FactExtractorView facts={result?.extracted_facts || null} theme={theme} />
            </div>

            <DispatchCard
              result={result}
              onCommitLive={handleCommitLive}
              onReject={() => {
                setResult(null);
                setCommitSuccessMsg('Решение отклонено. Запись в БД не выполнена.');
              }}
              isCommitting={isCommitting}
              commitSuccessMsg={commitSuccessMsg}
              theme={theme}
            />

            <ExecutionTraceTimeline
              trace={result?.trace || []}
              running={isRunningDispatch}
              theme={theme}
            />

            <p className="text-[11px] text-[var(--oc-muted)]">
              Ожидаемый результат пресета:{' '}
              <span className="text-[var(--oc-text)]">
                {SCENARIO_PRESETS.find((p) => p.id === selectedPresetId)?.expected_outcome}
              </span>
            </p>
          </div>
        )}

        {/* TAB 2: OPERATOR HITL WORKBENCH */}
        {activeTab === 'operator' && (
          <OperatorConsoleView
            db={db}
            onUpdateDb={handleUpdateDb}
            theme={theme}
          />
        )}

        {/* TAB 3: DATABASE REGISTRY */}
        {activeTab === 'database' && (
          <DatabaseInspectorView
            db={db}
            onResetDatabase={handleResetDatabase}
            onUpdateDb={handleUpdateDb}
            isLoading={isLoading}
            theme={theme}
            canResetDatabase={isAdmin}
            ticketsOnly={!isAdmin}
          />
        )}

        {activeTab === 'sla' && <WorkSlaView db={db} />}
        {activeTab === 'history' && <WorkHistoryView db={db} />}
        {activeTab === 'notifications' && (
          <WorkNotificationsView db={db} onOpenAppeals={() => guardedSetTab('operator')} />
        )}

        {activeTab === 'profile' && (
          <ProfileView user={currentUser} onUserUpdate={setCurrentUser} />
        )}

        {isAdmin && activeTab === 'admin_users' && <AdminUsersView />}
        {isAdmin && activeTab === 'admin_settings' && <AdminSettingsView />}
        {isAdmin && activeTab === 'admin_analytics' && <AdminAnalyticsView />}

        {/* TAB 4: LOGS & TRACES */}
        {isAdmin && activeTab === 'logs_traces' && (
          <LogsTracesView
            theme={theme}
            db={db}
            lastResult={result}
            apiHealthy={apiHealthy}
            geminiActive={geminiActive}
            githubToken={githubToken}
          />
        )}

        {/* TAB 5: ARCHITECTURE REPORT & C4 SCHEMAS */}
        {isAdmin && activeTab === 'architecture' && (
          <ArchitectureView theme={theme} />
        )}
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-[var(--oc-border)] bg-[var(--oc-surface)]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-1 px-3 py-2 text-[11px] text-[var(--oc-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Text2Business · Операционный центр ИИ</span>
          <span>
            {pendingOperatorCount > 0
              ? `${pendingOperatorCount} заявок ждут диспетчера`
              : 'Очередь оператора пуста'}
          </span>
        </div>
      </footer>
    </div>
  );
}
