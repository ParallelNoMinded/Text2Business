import React, { useState, useEffect, useCallback } from 'react';
import { Header, TabType } from './components/Header';
import { LandingHome } from './components/LandingHome';
import { ChannelsConfigView } from './components/ChannelsConfigView';
import { OperatorConsoleView } from './components/OperatorConsoleView';
import { DatabaseInspectorView } from './components/DatabaseInspectorView';
import { LogsTracesView } from './components/LogsTracesView';
import { INITIAL_DATABASE, DatabaseSchema } from './mockDb';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [geminiActive, setGeminiActive] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('gemini 3.6');
  const [isDryRun, setIsDryRun] = useState<boolean>(true);

  // DB State
  const [db, setDb] = useState<DatabaseSchema>(INITIAL_DATABASE);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
      const res = await fetch('/api/database');
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
    fetch('/api/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDb),
    }).catch((err) => console.warn('Sync DB error:', err));
  };

  // Reset Database
  const handleResetDatabase = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/database/reset', { method: 'POST' });
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
        setSelectedModel={setSelectedModel}
        pendingOperatorCount={pendingOperatorCount}
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
        {(activeTab === 'channels' || activeTab === 'console') && (
          <ChannelsConfigView
            theme={theme}
            onNavigateToConsole={() => setActiveTab('operator')}
          />
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
          <LogsTracesView theme={theme} />
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
