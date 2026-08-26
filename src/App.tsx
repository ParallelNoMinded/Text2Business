import React, { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';
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
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
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
      <main className={`flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${(activeTab === 'home' || activeTab === 'operator' || activeTab === 'database' || activeTab === 'channels' || activeTab === 'console' || activeTab === 'logs_traces' || activeTab === 'architecture') ? 'lg:ml-[300px] lg:w-[calc(100%-300px)]' : 'max-w-7xl mx-auto'}`}>
        {/* TAB 0: LANDING HOME PAGE */}
        {activeTab === 'home' && (
          <LandingHome
            setActiveTab={setActiveTab}
            theme={theme}
            db={db}
          />
        )}

        {/* TAB 1: CONNECTORS & CHANNELS CONFIG */}
        {activeTab === 'channels' && (
          <ChannelsConfigView
            theme={theme}
            onNavigateToConsole={() => setActiveTab('console')}
          />
        )}

        {/* TAB 1.5: LIVE DISPATCH WORKBENCH (console / demo) */}
        {activeTab === 'console' && (
          <div id="demo-stand-page" className="mx-auto w-full max-w-[1780px] pb-24 pt-2 sm:pt-4 lg:pb-8 font-sans">
            {/* Page Header */}
            <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight sm:text-[30px]">Демо-стенд AI-Диспетчера</h1>
                <p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
                  Тестирование сценариев обработки обращений через различные каналы связи
                </p>
              </div>
            </div>

            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Scenario Input Panel (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
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
              </div>

              {/* Right Column: Output Decision & Trace Panels (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {!result && !isRunningDispatch ? (
                  <div className={`flex flex-col items-center justify-center rounded-xl border p-12 text-center min-h-[420px] ${
                    isDark ? 'border-slate-700 bg-[#242438]' : 'border-[#c8c8c8] bg-white'
                  }`}>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-[#2D7A7A] mb-4">
                      <Zap className="h-8 w-8" />
                    </div>
                    <h2 className="text-base font-extrabold mb-1">Результат обработки появится здесь</h2>
                    <p className={`text-xs max-w-md ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
                      Выберите сценарий из быстрых кейсов слева или введите текст обращения, затем нажмите «Запустить обработку».
                    </p>
                  </div>
                ) : (
                  <>
                    <DispatchCard
                      result={result}
                      onCommitLive={handleCommitLive}
                      isCommitting={isCommitting}
                      commitSuccessMsg={commitSuccessMsg}
                      theme={theme}
                    />

                    <FactExtractorView
                      facts={result?.extracted_facts || null}
                      theme={theme}
                    />

                    <ExecutionTraceTimeline
                      trace={result?.trace || []}
                      theme={theme}
                    />
                  </>
                )}
              </div>
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
          (activeTab === 'home' || activeTab === 'operator' || activeTab === 'database' || activeTab === 'channels' || activeTab === 'console' || activeTab === 'logs_traces' || activeTab === 'architecture') ? 'hidden' : ''
        } ${
          isDark
            ? 'border-white/10 bg-[#020204] text-slate-500'
            : 'border-slate-300 bg-white text-slate-700'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-[#2D7A7A]"></span>
            <span className="font-bold text-[#111827] dark:text-cyan-400">
              Текстовый AI-Диспетчер для бизнеса
            </span>
            <span className="text-[#475569] dark:text-slate-400">/ Промышленная архитектура</span>
          </div>
          <p className="text-[11px] text-[#475569] dark:text-slate-400">
            Архитектор AI-решений / Техлид AI-внедрений • Full-Stack контейнер Cloud Run
          </p>
        </div>
      </footer>
    </div>
  );
}
