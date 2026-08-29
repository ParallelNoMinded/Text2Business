import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Bot,
  Database,
  FlaskConical,
  Home,
  Menu,
  MessageSquareMore,
  Moon,
  Send,
  Sun,
  X,
} from 'lucide-react';

export type TabType =
  | 'home'
  | 'channels'
  | 'console'
  | 'operator'
  | 'database'
  | 'logs_traces'
  | 'architecture';

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
  githubToken?: string;
  onOpenTokenModal?: () => void;
}

const navigation: Array<{ tab: TabType; label: string; icon: React.ElementType }> = [
  { tab: 'home', label: 'Главная', icon: Home },
  { tab: 'operator', label: 'Диспетчер', icon: MessageSquareMore },
  { tab: 'database', label: 'Реестр', icon: Database },
  { tab: 'channels', label: 'Каналы', icon: Send },
  { tab: 'console', label: 'Демо-стенд', icon: FlaskConical },
  { tab: 'logs_traces', label: 'Логи и трейсы', icon: Activity },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  selectedModel = 'gpt-4o',
  setSelectedModel,
  pendingOperatorCount = 0,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [isModelOpen, setIsModelOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';
  const models = ['qwen3.6-27b', 'gpt-4o', 'gemma4:e4b', 'deepseek-reasoner', 'nemotron-3-ultra-550b-a55b'];

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) setIsModelOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, []);

  const selectTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(now);
  const formattedTime = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit', minute: '2-digit',
  }).format(now);

  return (
    <>
      <aside className={`app-sidebar ${isDark ? 'app-sidebar-dark' : 'app-sidebar-light'} ${isMenuOpen ? 'is-open' : ''}`}>
        <div className="app-brand" role="button" tabIndex={0} onClick={() => selectTab('home')} onKeyDown={(event) => event.key === 'Enter' && selectTab('home')}>
          <div className="app-brand-mark"><Bot aria-hidden="true" /></div>
          <div>
            <div className="app-brand-name">TEXT2BUSINESS</div>
            <div className="app-brand-subtitle">AI-ДИСПЕТЧЕР</div>
          </div>
        </div>

        <nav className="app-navigation" aria-label="Основная навигация">
          <div className="app-navigation-section-label">РАБОЧЕЕ МЕСТО</div>
          {navigation.slice(0, 2).map(({ tab, label, icon: Icon }) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                id={`sidebar-tab-${tab}`}
                type="button"
                className={`app-navigation-item ${active ? 'is-active' : ''}`}
                onClick={() => selectTab(tab)}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
                {tab === 'operator' && pendingOperatorCount > 0 && <b className="app-nav-badge">{pendingOperatorCount}</b>}
              </button>
            );
          })}
          <div className="app-navigation-divider" />
          <div className="app-navigation-section-label">АДМИНИСТРИРОВАНИЕ</div>
          {navigation.slice(2).map(({ tab, label, icon: Icon }) => {
            const active = activeTab === tab;
            return (
              <button key={tab} id={`sidebar-tab-${tab}`} type="button" className={`app-navigation-item ${active ? 'is-active' : ''}`} onClick={() => selectTab(tab)}>
                <Icon aria-hidden="true" /><span>{label}</span>
              </button>
            );
          })}
        </nav>
        <button type="button" className={`app-architecture-link ${activeTab === 'architecture' ? 'is-active' : ''}`} onClick={() => selectTab('architecture')}>Архитектура</button>
      </aside>

      {isMenuOpen && <button type="button" aria-label="Закрыть меню" className="app-menu-backdrop" onClick={() => setIsMenuOpen(false)} />}

      <header className={`app-topbar ${isDark ? 'app-topbar-dark' : ''}`}>
        <button type="button" className="app-mobile-menu-button" aria-label="Открыть меню" onClick={() => setIsMenuOpen(true)}><Menu /></button>
        <button type="button" className="app-mobile-brand" onClick={() => selectTab('home')}>TEXT2BUSINESS</button>
        <div className="app-topbar-spacer" />
        <div className="app-global-controls">          <div className="app-date-control" aria-label={`Текущие дата и время: ${formattedDate}, ${formattedTime}`}>
            <span>{formattedDate}</span><strong>{formattedTime}</strong>
          </div>
          <button type="button" className="app-theme-control" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Переключить тему">
            {isDark ? <Moon /> : <Sun />}<span>{isDark ? 'Тёмная' : 'Светлая'}</span>
          </button>
          <div ref={modelMenuRef} className="model-picker">
            <button id="header-model-dropdown" type="button" className={`app-model-control ${isModelOpen ? 'is-open' : ''}`} onClick={() => setIsModelOpen((open) => !open)} aria-haspopup="listbox" aria-expanded={isModelOpen}>
              <span>{selectedModel}</span><span className="model-picker-chevron" aria-hidden="true" />
            </button>
            {isModelOpen && (
              <div className={`model-picker-menu ${isDark ? 'model-picker-menu-dark' : ''}`} role="listbox" aria-label="Выбор AI-модели">
                <div className="model-picker-scroll">
                  {models.map((model) => <button key={model} type="button" role="option" aria-selected={selectedModel === model} className={selectedModel === model ? 'is-selected' : ''} onClick={() => { setSelectedModel?.(model); setIsModelOpen(false); }}>{model}</button>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
