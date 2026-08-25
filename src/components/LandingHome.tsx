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
      <div className="min-h-screen rounded-none border-0 bg-[#141414] px-3 py-0 text-white sm:px-5 lg:px-10">
        <div className="mx-auto max-w-[1200px] pt-2">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-3 flex items-center gap-4 pt-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/40 bg-[#1D1F26] shadow-[0_0_20px_rgba(34,211,238,0.12)] sm:h-14 sm:w-14">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0F141A] text-cyan-400 sm:h-9 sm:w-9">
                  <Cpu className="h-5 w-5" />
                </div>
              </div>
              <div className="flex flex-col items-start">
                <div className="font-mono text-[22px] font-black uppercase tracking-tight text-white sm:text-[28px]">
                  TEXT2BUSINESS
                </div>
                <div className="mt-1 inline-flex rounded-md border border-cyan-500/40 bg-[#101B23] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                  AI-ДИСПЕТЧЕР
                </div>
              </div>
            </div>

            <h1 className="max-w-[1080px] text-[28px] font-extrabold leading-[0.98] tracking-[-0.03em] text-white sm:text-[36px] lg:text-[44px]">
              Превращаем хаос входящих обращений
              <span className="block text-cyan-400">в управляемый сервис</span>
            </h1>

            <p className="mt-4 max-w-[1000px] text-[15px] leading-[1.45] tracking-[-0.02em] text-slate-300 sm:text-[16px]">
              Умный AI-диспетчер для холодильного оборудования. Понимает контекст в письмах, чатах и звонках,
              рассчитывает SLA без ошибок и передает тикет напрямую в 1С:ERP.
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {cards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card.id)}
                className="group flex min-h-[220px] flex-col justify-between rounded-2xl border border-[#2A2A2A] bg-[#1C1B1B] p-4 text-left transition duration-200 hover:border-cyan-500/40 hover:shadow-[0_0_14px_rgba(34,211,238,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-[#222222] text-cyan-400">
                      {card.icon}
                    </div>
                    <div className="font-sans text-[18px] font-medium leading-tight text-white">
                      {index + 1}. {card.label}
                    </div>
                  </div>

                  <span className="rounded-md border border-amber-500/40 bg-[#2A2418] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">
                    {card.status}
                  </span>
                </div>

                <div className="mt-4 text-[14px] leading-[1.5] text-slate-300">{card.description}</div>

                <div className="mt-6 flex items-center gap-4 font-mono text-[15px] font-medium text-cyan-400">
                  <span className="pr-1">{card.action}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span>Текстовый AI-Диспетчер для бизнеса</span>
              <span className="text-slate-500">/</span>
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
