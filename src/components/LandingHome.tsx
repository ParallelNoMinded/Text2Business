import React from 'react';
import { TabType, UserRole } from './Header';
import { Cpu, ArrowRight, ShieldCheck, MonitorCog, BriefcaseBusiness } from 'lucide-react';

interface LandingHomeProps {
  setActiveTab: (tab: TabType) => void;
  userRole?: UserRole;
  setUserRole?: (role: UserRole) => void;
  theme?: 'dark' | 'light';
  onRunPreset?: (presetId: string) => void;
  homeRoleSelection?: boolean;
  setHomeRoleSelection?: (v: boolean) => void;
}

export const LandingHome: React.FC<LandingHomeProps> = ({
  setActiveTab,
  userRole = 'admin',
  setUserRole,
  theme = 'dark',
  homeRoleSelection = false,
  setHomeRoleSelection,
}) => {
  const isDark = theme === 'dark';

  const cards = homeRoleSelection
    ? [
        {
          id: 'dispatcher',
          label: 'Рабочее место Диспетчера',
          status: 'HITL ACTIVE',
          description: 'Интерактивный диалог, уточнение недостающих параметров у клиента в чате, интеллектуальная маршрутизация обращений и моментальная передача подтверждённых заявок в 1С:ERP.',
          action: 'Открыть место диспетчера',
          icon: <BriefcaseBusiness className="h-5 w-5" />,
          accent: 'cyan',
        },
        {
          id: 'admin',
          label: 'Панель Администратора',
          status: 'SYSTEM CONTROL',
          description: 'Управление интеграциями, мониторинг системных логов и трассировок выполнения ИИ-сценариев. Тонкая настройка процессов, API-клиентов и SMTP/IMAP шлюзов.',
          action: 'Перейти к администрированию',
          icon: <MonitorCog className="h-5 w-5" />,
          accent: 'blue',
        },
      ]
    : userRole === 'dispatcher'
    ? [
        {
          id: 'demo-stand',
          label: 'Рабочее место Диспетчера',
          status: 'HITL ACTIVE',
          description: 'Интерактивный диалог, уточнение недостающих параметров у клиента в чате, интеллектуальная маршрутизация обращений и моментальная передача подтверждённых заявок в 1С:ERP.',
          action: 'Открыть место диспетчера',
          icon: <BriefcaseBusiness className="h-5 w-5" />,
          accent: 'cyan',
        },
        {
          id: 'requests',
          label: 'Заявки',
          status: 'SYSTEM CONTROL',
          description: 'Управление интеграциями, мониторинг системных логов и трассировок выполнения ИИ-сценариев. Тонкая настройка процессов, API-клиентов и SMTP/IMAP шлюзов.',
          action: 'Перейти в заявки',
          icon: <ShieldCheck className="h-5 w-5" />,
          accent: 'cyan',
        },
      ]
    : [
        {
          id: 'dispatcher',
          label: 'Рабочее место Диспетчера',
          status: 'HITL ACTIVE',
          description: 'Интерактивный диалог, уточнение недостающих параметров у клиента в чате, интеллектуальная маршрутизация обращений и моментальная передача подтверждённых заявок в 1С:ERP.',
          action: 'Открыть место диспетчера',
          icon: <BriefcaseBusiness className="h-5 w-5" />,
          accent: 'cyan',
        },
        {
          id: 'admin',
          label: 'Панель Администратора',
          status: 'SYSTEM CONTROL',
          description: 'Управление интеграциями, мониторинг системных логов и трассировок выполнения ИИ-сценариев. Тонкая настройка процессов, API-клиентов и SMTP/IMAP шлюзов.',
          action: 'Перейти к администрированию',
          icon: <MonitorCog className="h-5 w-5" />,
          accent: 'blue',
        },
      ];

  const handleCardClick = (id: string) => {
    // If user is choosing role on home, set the role explicitly
    if (id === 'dispatcher' || id === 'demo-stand') {
      setUserRole?.('dispatcher');
      setHomeRoleSelection?.(false);
      setActiveTab('console');
      return;
    }
    if (id === 'requests') {
      setActiveTab('operator');
      return;
    }
    if (id === 'admin') {
      setUserRole?.('admin');
      setHomeRoleSelection?.(false);
      setActiveTab('channels');
      return;
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[1280px] px-0 py-0">
      {/* Золотое сечение: вертикальный ритм по шкале φ (8/13/21/34/55/89), герой ≈ 61.8% высоты первого экрана */}
      <div className={`min-h-screen rounded-none border-0 px-3 py-0 sm:px-5 lg:px-10 ${isDark ? 'bg-[#141414] text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className="mx-auto max-w-[1200px] pt-[21px]">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-[13px] flex items-center gap-[13px] pt-[8px]">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border sm:h-14 sm:w-14 ${isDark ? 'border-[#2A2A2A] bg-[#1C1B1B]' : 'border-blue-900/30 bg-white shadow-md'}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${isDark ? 'bg-[#222222] text-slate-300' : 'bg-blue-950 text-blue-100'}`}>
                  <Cpu className="h-5 w-5" />
                </div>
              </div>
              <div className="flex flex-col items-start">
                <div className={`font-mono text-[22px] font-black uppercase tracking-tight sm:text-[28px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  TEXT2BUSINESS
                </div>
                <div className={`mt-1 inline-flex rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'border-[#2A2A2A] bg-[#222222] text-slate-300' : 'border-blue-900/30 bg-blue-950 text-blue-100'}`}>
                  AI-ДИСПЕТЧЕР
                </div>
              </div>
            </div>

            {/* Типографическая шкала φ: 28 → 45 (×1.618), межблочный ритм 34px */}
            <h1 className={`max-w-[1080px] text-[28px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[36px] lg:text-[45px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Превращаем хаос входящих обращений
              <span className={`block ${isDark ? 'text-slate-300' : 'text-blue-900'}`}>в управляемый сервис</span>
            </h1>

            <p className={`mt-[21px] max-w-[1000px] text-[15px] leading-[1.618] tracking-[-0.02em] sm:text-[16px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Умный AI-диспетчер для холодильного оборудования. Понимает контекст в письмах, чатах и звонках,
              рассчитывает SLA без ошибок и передает тикет напрямую в 1С:ERP.
            </p>
          </div>

          <div className="mt-[34px] grid gap-[21px] md:grid-cols-2">
            {cards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card.id)}
                className={`group flex min-h-[220px] flex-col justify-between rounded-2xl border p-[21px] text-left transition duration-200 ${
                  isDark
                    ? 'border-[#2A2A2A] bg-[#1C1B1B] hover:border-slate-500/50'
                    : 'border-slate-300 bg-white shadow-sm hover:border-blue-900/50 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isDark ? 'border-[#2A2A2A] bg-[#222222] text-slate-300' : 'border-blue-900/30 bg-blue-950 text-blue-100'}`}>
                      {card.icon}
                    </div>
                    <div className={`font-sans text-[18px] font-medium leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {index + 1}. {card.label}
                    </div>
                  </div>

                  <span className={`rounded-md border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${isDark ? 'border-[#2A2A2A] bg-[#222222] text-slate-400' : 'border-slate-300 bg-slate-100 text-slate-700'}`}>
                    {card.status}
                  </span>
                </div>

                <div className={`mt-[13px] text-[14px] leading-[1.618] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{card.description}</div>

                <div className={`mt-[21px] flex items-center gap-[13px] font-mono text-[15px] font-medium ${isDark ? 'text-slate-300' : 'text-blue-900'}`}>
                  <span className="pr-1">{card.action}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>

          <div className={`mt-[34px] mb-[21px] flex flex-col gap-[8px] text-[11px] sm:flex-row sm:items-center sm:justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span>Текстовый AI-Диспетчер для бизнеса</span>
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>/</span>
              <span>Промышленная архитектура</span>
            </div>
            <div className="text-left sm:text-right">
              Архитектор AI-решений / Техлид AI-внедрения • Full-Stack контейнер Cloud Run
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};