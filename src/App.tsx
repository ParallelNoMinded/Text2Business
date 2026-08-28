import React, { useState, useEffect, useCallback } from 'react';
import { Header, TabType } from './components/Header';
import { LandingHome } from './components/LandingHome';
import { ChannelsConfigView } from './components/ChannelsConfigView';
import { OperatorConsoleView } from './components/OperatorConsoleView';
import { DatabaseInspectorView } from './components/DatabaseInspectorView';
import { LogsTracesView } from './components/LogsTracesView';
import { ArchitectureView } from './components/ArchitectureView';
import { GithubTokenModal } from './components/GithubTokenModal';
import { DemoRequestModal } from './components/DemoRequestModal';
import { ScenarioRunner } from './components/ScenarioRunner';
import { FactExtractorView } from './components/FactExtractorView';
import { DispatchCard } from './components/DispatchCard';
import { ExecutionTraceTimeline } from './components/ExecutionTraceTimeline';
import { SCENARIO_PRESETS } from './scenarios';
import { ProcessingResult } from './types';
import { apiFetch } from './api';
import { INITIAL_DATABASE, DatabaseSchema } from './mockDb';
import { AppRole, blockedRoleMessage, canAccessTab, roleFromTab } from './roles';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [sessionRole, setSessionRole] = useState<AppRole>(() => {
    try {
      const saved = sessionStorage.getItem('nb-session-role');
      if (saved === 'demo' || saved === 'dispatcher') return saved;
    } catch {
      /* ignore */
    }
    return 'guest';
  });
  const [roleNotice, setRoleNotice] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('nb-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      /* ignore */
    }
    return 'light';
  });
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [geminiActive, setGeminiActive] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [isDryRun, setIsDryRun] = useState<boolean>(true);

  // GITHUB_MODELS_TOKEN state (memory only, never persisted to localStorage)
  const [githubToken, setGithubToken] = useState<string>('');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);

  // Sync token with server on mount & model change
  useEffect(() => {
    apiFetch('/api/llm/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: githubToken, model: selectedModel }),
    }).catch(() => {});
  }, [githubToken, selectedModel]);

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

  const scrollToDispatchResults = () => {
    const el = document.getElementById('dispatch-results');
    if (!el) return;
    const headerOffset = 84;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  const handleRunDispatch = async () => {
    if (!rawText.trim()) return;
    setIsRunningDispatch(true);
    setCommitSuccessMsg(null);
    setResult(null);
    window.setTimeout(scrollToDispatchResults, 80);
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
      if (!res.ok) {
        setCommitSuccessMsg(`❌ Ошибка: ${data.error || res.status}`);
        return;
      }
      const facts = data.extracted_facts;
      const fullText = rawText.trim();
      const summary = facts?.problem_summary?.value;
      if (facts?.problem_summary && typeof summary === 'string' && summary.endsWith('...') && fullText.startsWith(summary.slice(0, -3))) {
        facts.problem_summary = { ...facts.problem_summary, value: fullText, quote: fullText };
      }
      setResult({ ...data, extracted_facts: facts });
    } catch (err: any) {
      setCommitSuccessMsg(`❌ Сетевая ошибка: ${err.message}`);
    } finally {
      setIsRunningDispatch(false);
      window.setTimeout(scrollToDispatchResults, 120);
    }
  };

  const handleCommitLive = async () => {
    if (!result?.ticket_payload) return;
    setIsCommitting(true);
    setCommitSuccessMsg(null);
    try {
      const res = await apiFetch('/api/commit-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_payload: result.ticket_payload,
          action: result.recommended_action,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCommitSuccessMsg(`❌ Сохранение отклонено: ${data.error || res.status}`);
        return;
      }
      setCommitSuccessMsg(`✅ Заявка ${data.ticket.ticket_id} подтверждена оператором и сохранена в БД (${data.action}).`);
      await fetchDatabase();
    } catch (err: any) {
      setCommitSuccessMsg(`❌ Ошибка сохранения: ${err.message}`);
    } finally {
      setIsCommitting(false);
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('nb-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

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
    fetchDatabase();
    const interval = setInterval(() => {
      fetchDatabase();
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchDatabase]);

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

  const persistRole = (role: AppRole) => {
    setSessionRole(role);
    try {
      if (role === 'guest') sessionStorage.removeItem('nb-session-role');
      else sessionStorage.setItem('nb-session-role', role);
    } catch {
      /* ignore */
    }
  };

  const requestTab = (tab: TabType) => {
    if (!canAccessTab(sessionRole, tab)) {
      setRoleNotice(blockedRoleMessage(sessionRole));
      window.setTimeout(() => setRoleNotice(null), 4200);
      return;
    }
    const nextRole = roleFromTab(tab);
    if (sessionRole === 'guest' && nextRole) persistRole(nextRole);
    setActiveTab(tab);
  };

  const resetRole = () => {
    persistRole('guest');
    setActiveTab('home');
    setRoleNotice(null);
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased overflow-x-clip ${
        isDark ? 'bg-[#121417] text-zinc-100' : 'bg-[#F5F6F8] text-zinc-900'
      }`}
    >
      {/* Streamlined Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={requestTab}
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
        onRequestDemo={() => setDemoModalOpen(true)}
        sessionRole={sessionRole}
        onResetRole={resetRole}
      />

      {/* GITHUB_MODELS_TOKEN Setup Modal */}
      <GithubTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        token={githubToken}
        onSaveToken={handleSaveToken}
        selectedModel={selectedModel}
        theme={theme}
      />

      <DemoRequestModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        theme={theme}
      />

      {roleNotice && (
        <div className="fixed bottom-5 left-1/2 z-[60] w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 animate-fadeIn">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${
              isDark ? 'bg-[#1A1D22] border-[#2C3139] text-zinc-100' : 'bg-white border-[#E6E8EC] text-zinc-900'
            }`}
          >
            {roleNotice}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main
        className={
          activeTab === 'home'
            ? 'flex-1 w-full overflow-x-clip'
            : 'flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-8 overflow-x-clip'
        }
      >
        {activeTab === 'home' && (
          <LandingHome
            setActiveTab={requestTab}
            theme={theme}
            onRequestDemo={() => setDemoModalOpen(true)}
            sessionRole={sessionRole}
            onResetRole={resetRole}
          />
        )}

        {/* TAB 1: CONNECTORS & CHANNELS CONFIG */}
        {activeTab === 'channels' && (
          <ChannelsConfigView
            theme={theme}
            onNavigateToConsole={() => requestTab('console')}
          />
        )}

        {/* TAB 1.5: LIVE DISPATCH WORKBENCH (console) */}
        {activeTab === 'console' && (
          <div className="space-y-4">
            <div
              className={`rounded-3xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn ${
                isDark
                  ? 'bg-[#1A1D22] border-[#2C3139] text-white'
                  : 'bg-white border-[#E6E8EC] text-zinc-950 shadow-[0_10px_40px_rgba(16,24,40,0.05)]'
              }`}
            >
              <div>
                <h2 className="text-base font-extrabold tracking-tight">
                  Демонстрационный стенд диспетчера
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Обращение → факты → решение → журнал обработки. Запуск без записи в реестр;
                  заявка сохраняется только после «Подтвердить».
                </p>
              </div>
              <span className={`text-[11px] px-3 py-1.5 rounded-full border font-semibold whitespace-nowrap ${
                isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-600' : 'bg-zinc-100 text-zinc-700 border-zinc-300'
              }`}>
                Тестовый режим
              </span>
            </div>

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

            <div id="dispatch-results" className="space-y-4 scroll-mt-24">
              <FactExtractorView
                facts={result?.extracted_facts || null}
                theme={theme}
              />

              <DispatchCard
                result={result}
                onCommitLive={handleCommitLive}
                isCommitting={isCommitting}
                commitSuccessMsg={commitSuccessMsg}
                theme={theme}
              />

              <ExecutionTraceTimeline
                trace={result?.trace || []}
                theme={theme}
              />
            </div>

            <div
              className={`rounded-3xl p-4 border text-sm ${
                isDark
                  ? 'bg-[#1A1D22] border-[#2C3139] text-zinc-400'
                  : 'bg-white border-[#E6E8EC] text-zinc-600 shadow-sm'
              }`}
            >
              Ожидаемый результат сценария:{' '}
              <span className={isDark ? 'text-zinc-100 font-semibold' : 'text-zinc-900 font-semibold'}>
                {SCENARIO_PRESETS.find((p) => p.id === selectedPresetId)?.expected_outcome}
              </span>
            </div>
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
          />
        )}

        {/* TAB 4: LOGS & TRACES */}
        {activeTab === 'logs_traces' && (
          <LogsTracesView theme={theme} db={db} />
        )}

        {/* TAB 5: ARCHITECTURE REPORT & C4 SCHEMAS */}
        {activeTab === 'architecture' && (
          <ArchitectureView theme={theme} />
        )}
      </main>

      <footer
        className={`border-t mt-auto py-6 text-sm ${
          isDark ? 'border-[#2C3139] bg-[#121417] text-zinc-500' : 'border-[#E6E8EC] bg-white text-zinc-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">NeuroBiz · автоматизация сервиса</p>
          <p className="text-xs">Каналы, пробный запуск и рабочее место диспетчера</p>
        </div>
      </footer>
    </div>
  );
}
