import React from 'react';
import { ArrowRight, Database, Headphones, LifeBuoy, Settings2 } from 'lucide-react';
import { TabType } from './Header';
import { Button, PageHeader, SectionHeader } from './ui/system';

interface LandingHomeProps {
  setActiveTab: (tab: TabType) => void;
  role: 'dispatcher' | 'admin';
  pendingCount?: number;
}

const adminLinks: Array<{ tab: TabType; title: string; description: string }> = [
  { tab: 'channels', title: 'Каналы', description: 'Источники входящих обращений' },
  { tab: 'database', title: 'Реестр', description: 'Заявки и справочники' },
  { tab: 'logs_traces', title: 'Контроль', description: 'Логи, трассы и SLA' },
  { tab: 'architecture', title: 'Документация', description: 'О проекте и архитектурные схемы' },
  { tab: 'users', title: 'Доступ', description: 'Пользователи и роли' },
];

const pendingLabel = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const noun = mod10 === 1 && mod100 !== 11 ? 'обращение' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'обращения' : 'обращений';
  return `${count} ${noun} ${count === 1 ? 'ожидает' : 'ожидают'} проверки`;
};

export const LandingHome: React.FC<LandingHomeProps> = ({ setActiveTab, role, pendingCount = 0 }) => (
  <div className="flex w-full flex-col gap-10">
    <PageHeader
      eyebrow="Рабочая смена"
      title={role === 'admin' ? 'Состояние диспетчерской' : 'Начните с очереди обращений'}
    />

    <section className="journal-section" aria-labelledby="start-shift-heading">
      <div className="journal-index" aria-hidden="true">01</div>
      <div className="min-w-0 flex-1">
        <SectionHeader title="Начать смену" description={pendingCount > 0 ? pendingLabel(pendingCount) : 'Новых обращений для проверки нет'} />
        {/* Пояснение убрано: заголовок и кнопка сами говорят, куда ведёт шаг.
            Кнопка держится рядом с заголовком, а не улетает к правому краю
            широкого монитора — иначе связь между ними теряется. */}
        <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Headphones className="h-5 w-5 text-accent" aria-hidden="true" />
            <h3 className="text-xl font-bold text-ink">Рабочее место диспетчера</h3>
          </div>
          <Button variant="primary" onClick={() => setActiveTab('operator')} className="shrink-0">Открыть рабочее место <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
        </div>
      </div>
    </section>

    <section aria-labelledby="directions-heading">
      <SectionHeader title={role === 'admin' ? 'Управление системой' : 'Дополнительный сценарий'} description={role === 'admin' ? 'Настройки отделены от оперативной работы.' : 'Проверьте разбор сообщения без записи в реестр.'} />
      {role === 'admin' ? (
        <div className="journal-list mt-4">
          {adminLinks.map((item, index) => <button key={item.tab} type="button" onClick={() => setActiveTab(item.tab)} className="journal-row group">
            <span className="journal-row-index">{String(index + 2).padStart(2, '0')}</span>
            <span className="min-w-0 flex-1"><strong className="block text-base text-ink">{item.title}</strong><span className="mt-0.5 block text-sm text-ink-2">{item.description}</span></span>
            <ArrowRight className="h-4 w-4 text-ink-3 group-hover:text-accent" aria-hidden="true" />
          </button>)}
        </div>
      ) : (
        <button type="button" onClick={() => setActiveTab('console')} className="journal-row mt-4 w-full text-left">
          <span className="journal-row-index"><Settings2 className="h-4 w-4" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-base text-ink">Демо-разбор обращения</strong><span className="mt-0.5 block text-sm text-ink-2">Проверить распознавание и решение на готовом сценарии</span></span>
          <ArrowRight className="h-4 w-4 text-ink-3" aria-hidden="true" />
        </button>
      )}
    </section>

    {/* Тихие ссылки в конце страницы. Справка нужна обеим ролям: пояснения
        убраны с рабочих экранов, и это то место, куда за ними идут. */}
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-6">
      {role === 'admin' && <button type="button" onClick={() => setActiveTab('database')} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-accent hover:underline"><Database className="h-4 w-4" aria-hidden="true" />Открыть реестр заявок</button>}
      <button type="button" onClick={() => setActiveTab('help')} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-accent hover:underline"><LifeBuoy className="h-4 w-4" aria-hidden="true" />Как работать в системе</button>
    </div>
  </div>
);
