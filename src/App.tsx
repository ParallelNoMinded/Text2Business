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
import { ProcessingResult } from './types';
import { apiFetch } from './api';
import { INITIAL_DATABASE, DatabaseSchema } from './mockDb';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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

  const handleRunDispatch = async () => {
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
        setCommitSuccessMsg(`❌ Коммит отклонен: ${data.error || res.status}`);
        return;
      }
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

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between font-sans antialiased transition-colors duration-200 ${
        isDark ? 'bg-[#020204] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Streamlined Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* TAB 0: LANDING HOME PAGE */}
        {activeTab === 'home' && (
          <LandingHome
            setActiveTab={setActiveTab}
            theme={theme}
          />
        )}

        {/* TAB 1: CONNECTORS & CHANNELS CONFIG */}
        {activeTab === 'channels' && (
          <ChannelsConfigView
            theme={theme}
            onNavigateToConsole={() => setActiveTab('console')}
          />
        )}

        {/* TAB 1.5: LIVE DISPATCH WORKBENCH (console) */}
        {activeTab === 'console' && (
          <div className="space-y-4">
            <div
              className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark
                  ? 'bg-[#060612]/90 border-cyan-500/30 text-white'
                  : 'bg-white border-slate-300 text-slate-950 shadow-sm'
              }`}
            >
              <div>
                <h2 className={`text-sm font-mono font-extrabold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
                  Демо-стенд AI-Диспетчера (4 сценария ТЗ)
                </h2>
                <p className={`text-xs mt-1 font-sans ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
                  Обращение → извлечение фактов → решение движка → трассировка. Любое выполнение — dry-run;
                  подтверждённый коммит в БД делает оператор (кнопка «Подтвердить»).
                </p>
              </div>
              <span className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border font-bold whitespace-nowrap ${
                isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-950 border-amber-400'
              }`}>
                ⚠ ТЕСТОВЫЙ РЕЖИМ (dry-run)
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

            <div
              className={`rounded-2xl p-4 border text-xs font-mono ${
                isDark
                  ? 'bg-[#060612]/90 border-cyan-500/20 text-slate-400'
                  : 'bg-white border-slate-300 text-slate-700 font-medium shadow-sm'
              }`}
            >
              Ожидаемый результат пресета:{' '}
              <span className={isDark ? 'text-cyan-300 font-bold' : 'text-blue-950 font-extrabold'}>
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

      {/* Antigravity Footer */}
      <footer
        className={`border-t mt-8 py-5 text-center text-xs font-mono transition-colors ${
          isDark
            ? 'border-white/10 bg-[#020204] text-slate-500'
            : 'border-slate-300 bg-white text-slate-700'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${isDark ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-blue-900'}`}></span>
            <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
              Текстовый AI-Диспетчер для бизнеса
            </span>
            <span>/ Промышленная архитектура</span>
          </div>
          <p className="text-[11px]">
            Архитектор AI-решений / Техлид AI-внедрений • Full-Stack контейнер Cloud Run
          </p>
        </div>
      </footer>
    </div>
  );
}
