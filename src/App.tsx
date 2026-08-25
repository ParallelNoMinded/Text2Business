import React, { useState, useEffect, useCallback } from 'react';
import { TabType } from './components/Header';
import { AppShell, RegistryEntity } from './components/shell/AppShell';
import { OperationsDashboard } from './components/ops/OperationsDashboard';
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
import { PageHeader, StatusBadge } from './components/ui/OpsPrimitives';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [registryTab, setRegistryTab] = useState<RegistryEntity>('open_tickets');
  const [logsTab, setLogsTab] = useState<'logs' | 'runs' | 'traces' | 'analytics'>('logs');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [isDryRun, setIsDryRun] = useState<boolean>(true);

  const [githubToken, setGithubToken] = useState<string>('');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);

  useEffect(() => {
    apiFetch('/api/llm/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: githubToken, model: selectedModel }),
    }).catch(() => {});
  }, [githubToken, selectedModel]);

  const handleSelectModel = (newModel: string) => {
    setSelectedModel(newModel);
    if (!githubToken) setIsTokenModalOpen(true);
  };

  const [db, setDb] = useState<DatabaseSchema>(INITIAL_DATABASE);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
        setCommitSuccessMsg(`Ошибка: ${data.error || res.status}`);
        return;
      }
      setResult(data);
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
        setCommitSuccessMsg(`Коммит отклонен: ${data.error || res.status}`);
        return;
      }
      setCommitSuccessMsg(`Заявка ${data.ticket.ticket_id} подтверждена оператором и сохранена в БД (${data.action}).`);
      await fetchDatabase();
    } catch (err: any) {
      setCommitSuccessMsg(`Ошибка коммита: ${err.message}`);
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
  }, [theme]);

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

  const openRegistry = (entity: RegistryEntity) => {
    setRegistryTab(entity);
    setActiveTab('database');
  };

  return (
    <>
      <AppShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRegistry={openRegistry}
        theme={theme}
        setTheme={setTheme}
        selectedModel={selectedModel}
        setSelectedModel={handleSelectModel}
        githubToken={githubToken}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        pendingOperatorCount={pendingOperatorCount}
        db={db}
        registryTab={registryTab}
        logsTab={logsTab}
        onLogsTab={setLogsTab}
      >
        {activeTab === 'home' && (
          <OperationsDashboard db={db} setActiveTab={setActiveTab} result={result} />
        )}

        {activeTab === 'channels' && (
          <ChannelsConfigView theme={theme} onNavigateToConsole={() => setActiveTab('console')} />
        )}

        {activeTab === 'console' && (
          <div className="space-y-3 max-w-[1200px]">
            <PageHeader
              kicker="AI Dispatcher"
              title="Incoming Request → Decision → Approval"
              subtitle="Обращение → факты → решение движка → трассировка. Коммит в БД выполняет оператор."
              actions={<StatusBadge tone="warn">Dry-run</StatusBadge>}
            />

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

            <DispatchCard
              result={result}
              onCommitLive={handleCommitLive}
              isCommitting={isCommitting}
              commitSuccessMsg={commitSuccessMsg}
              theme={theme}
              isDryRun={isDryRun}
              onReject={() => {
                setResult(null);
                setCommitSuccessMsg('Решение отклонено оператором. Пайплайн сброшен.');
              }}
              onEdit={() => {
                document.getElementById('raw-text-input')?.focus();
              }}
              onToggleDryRun={() => setIsDryRun(!isDryRun)}
            />

            <ExecutionTraceTimeline trace={result?.trace || []} theme={theme} />

            <div className="oc-card p-3 text-xs text-oc-secondary">
              Ожидаемый результат пресета:{' '}
              <span className="font-mono text-oc-accent">
                {SCENARIO_PRESETS.find((p) => p.id === selectedPresetId)?.expected_outcome}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'operator' && (
          <OperatorConsoleView db={db} onUpdateDb={handleUpdateDb} theme={theme} />
        )}

        {activeTab === 'database' && (
          <DatabaseInspectorView
            db={db}
            onResetDatabase={handleResetDatabase}
            onUpdateDb={handleUpdateDb}
            isLoading={isLoading}
            theme={theme}
            initialTab={registryTab}
          />
        )}

        {activeTab === 'logs_traces' && <LogsTracesView theme={theme} db={db} initialTab={logsTab} />}

        {activeTab === 'architecture' && <ArchitectureView theme={theme} />}
      </AppShell>

      <GithubTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        token={githubToken}
        onSaveToken={setGithubToken}
        selectedModel={selectedModel}
        theme={theme}
      />
    </>
  );
}
