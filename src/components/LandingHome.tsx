import React, { useState } from 'react';
import { TabType } from './Header';
import {
  ArrowRight,
  Activity,
  Database,
  Send,
  ShieldCheck,
  UserCheck,
  Workflow,
  Zap,
  Lock,
  ChevronDown,
  MapPin,
  Clock,
} from 'lucide-react';
import { AppRole, canAccessTab } from '../roles';

interface LandingHomeProps {
  setActiveTab: (tab: TabType) => void;
  theme?: 'dark' | 'light';
  onRequestDemo?: () => void;
  sessionRole?: AppRole;
  onResetRole?: () => void;
}

const STEPS: Array<{ tab: TabType; n: string; title: string; text: string }> = [
  {
    tab: 'channels',
    n: '01',
    title: 'Подключите каналы',
    text: 'Telegram, почта, голос и приём из внешних систем — одна очередь обращений.',
  },
  {
    tab: 'console',
    n: '02',
    title: 'Прогоните готовые сценарии',
    text: 'Четыре контрольных случая: разбор фактов, сроки реакции, пробный прогон и подтверждение.',
  },
  {
    tab: 'operator',
    n: '03',
    title: 'Закройте неоднозначное',
    text: 'Диспетчер уточняет поля и передаёт заявку в реестр и 1С.',
  },
];

const FLOW = [
  {
    n: '01',
    title: 'Входящее обращение',
    text: 'Сообщение из чата, письма или звонка попадает в общую очередь без ручной сортировки.',
  },
  {
    n: '02',
    title: 'Разбор фактов',
    text: 'Система выделяет клиента, объект, оборудование и суть проблемы — с цитатой из текста.',
  },
  {
    n: '03',
    title: 'Решение',
    text: 'Создать заявку, запросить уточнение или передать диспетчеру — по правилам сервиса.',
  },
  {
    n: '04',
    title: 'Реестр и учёт',
    text: 'После подтверждения запись сохраняется и уходит в 1С:ERP.',
  },
];

const PREVIEWS = [
  {
    k: 'Карта заявок',
    d: 'Объекты и выезды на одной схеме',
    lines: ['ТЦ «Север» · чиллер ХУ-17', 'Склад №2 · холодильная камера', 'БЦ «Орбита» · вентиляция'],
  },
  {
    k: 'Диспетчер',
    d: 'Уточнение без потери контекста',
    lines: ['Не хватает кода оборудования', 'Черновик ответа клиенту', 'Передача в 1С после проверки'],
  },
  {
    k: 'Поле',
    d: 'Выездные инженеры и обходы',
    lines: ['Назначение на объект', 'Срок прибытия по нормативу', 'Закрытие с актом'],
  },
  {
    k: 'Аналитика',
    d: 'Сроки, очередь, журнал обработки',
    lines: ['Очередь: 3 на уточнении', 'Срок реакции: 2 ч 15 мин', 'Автоматически закрыто: 86%'],
  },
];

const FAQ = [
  {
    q: 'Что происходит с обращением?',
    a: 'Текст разбирается на факты, система предлагает действие и показывает цепочку шагов. В реестр запись попадает только после подтверждения.',
  },
  {
    q: 'Зачем выбирать роль?',
    a: 'Демонстрационный стенд и рабочее место диспетчера разделены: в одной сессии открыт один контур, чтобы не смешивать сценарии.',
  },
  {
    q: 'Можно ли пробовать без записи в учёт?',
    a: 'Да. Пробный прогон ничего не сохраняет. Сохранение в реестр — отдельная кнопка «Подтвердить».',
  },
];

export const LandingHome: React.FC<LandingHomeProps> = ({
  setActiveTab,
  theme = 'light',
  onRequestDemo,
  sessionRole = 'guest' as AppRole,
  onResetRole,
}) => {
  const isDark = theme === 'dark';
  const card = isDark
    ? 'bg-[#1A1D22] border-[#2C3139]'
    : 'bg-white border-[#E6E8EC] shadow-[0_12px_40px_rgba(16,24,40,0.05)]';
  const [flowIndex, setFlowIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const goIfAllowed = (tab: TabType) => {
    if (canAccessTab(sessionRole, tab)) setActiveTab(tab);
  };

  return (
    <div className="w-full overflow-x-clip">
      <section className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-10 sm:pt-16 pb-8 text-center">
        <p className={`mb-4 text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          NeuroBiz
        </p>
        <h1 className="text-[28px] sm:text-4xl lg:text-[44px] font-extrabold tracking-tight leading-[1.15] text-balance">
          Платформа для сервиса: от поддержки до выездных работ
        </h1>
        <p className={`mx-auto mt-5 max-w-2xl text-sm sm:text-base leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          NeuroBiz принимает обращения из чатов, писем и звонков, считает сроки реакции без ручной раздачи заявок
          и передаёт работу в реестр и 1С:ERP. Выберите роль — интерфейс останется в ней до конца сессии.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
          <button
            type="button"
            disabled={sessionRole === 'dispatcher'}
            onClick={() => goIfAllowed('console')}
            className={`rounded-3xl border p-5 transition hover:-translate-y-0.5 ${card} ${
              sessionRole === 'dispatcher' ? 'opacity-40 cursor-not-allowed' : ''
            } ${sessionRole === 'demo' ? 'ring-2 ring-zinc-400/60' : ''}`}
          >
            <div className="flex items-center gap-2 font-extrabold">
              <Zap className="h-4 w-4 text-[#52525B]" />
              Демонстрационный стенд
              {sessionRole === 'dispatcher' && <Lock className="h-3.5 w-3.5 ml-auto text-zinc-400" />}
            </div>
            <p className={`text-sm mt-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Готовые сценарии, факты и решение. Рабочее место диспетчера в этой сессии будет закрыто.
            </p>
          </button>
          <button
            type="button"
            disabled={sessionRole === 'demo'}
            onClick={() => goIfAllowed('operator')}
            className={`rounded-3xl border p-5 transition hover:-translate-y-0.5 ${card} ${
              sessionRole === 'demo' ? 'opacity-40 cursor-not-allowed' : ''
            } ${sessionRole === 'dispatcher' ? 'ring-2 ring-zinc-400/60' : ''}`}
          >
            <div className="flex items-center gap-2 font-extrabold">
              <UserCheck className="h-4 w-4 text-[#52525B]" />
              Диспетчер
              {sessionRole === 'demo' && <Lock className="h-3.5 w-3.5 ml-auto text-zinc-400" />}
            </div>
            <p className={`text-sm mt-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Очередь уточнений и передача в 1С. Стенд в этой сессии будет закрыт.
            </p>
          </button>
        </div>

        {sessionRole !== 'guest' && (
          <button
            type="button"
            onClick={onResetRole}
            className={`mt-4 text-xs font-semibold underline-offset-4 hover:underline ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}
          >
            Сменить роль
          </button>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRequestDemo}
            className={`w-full sm:w-auto rounded-full border px-7 py-3 text-sm font-bold ${
              isDark ? 'border-[#3A404A] hover:bg-white/5' : 'border-[#E6E8EC] bg-white hover:bg-zinc-50'
            }`}
          >
            Запросить показ
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-6">
        <h2 className="text-center text-xl sm:text-2xl font-extrabold mb-2">Как проходит обращение</h2>
        <p className={`text-center text-sm mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Нажмите шаг — откроется короткое пояснение.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {FLOW.map((step, i) => {
            const active = flowIndex === i;
            return (
              <button
                key={step.n}
                type="button"
                onClick={() => setFlowIndex(i)}
                className={`rounded-2xl border p-4 text-left transition ${card} ${
                  active ? 'ring-2 ring-zinc-400/50' : 'hover:-translate-y-0.5'
                }`}
              >
                <div className="text-[#52525B] text-[11px] font-bold tracking-widest">{step.n}</div>
                <div className="mt-1 text-sm font-extrabold leading-snug">{step.title}</div>
              </button>
            );
          })}
        </div>
        <div className={`mt-3 rounded-3xl border p-5 animate-fadeIn ${card}`}>
          <p className="text-sm font-extrabold">{FLOW[flowIndex].title}</p>
          <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {FLOW[flowIndex].text}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFlowIndex((i) => (i === 0 ? FLOW.length - 1 : i - 1))}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                isDark ? 'border-[#3A404A] hover:bg-white/5' : 'border-[#E6E8EC] hover:bg-zinc-50'
              }`}
            >
              Назад
            </button>
            <button
              type="button"
              onClick={() => setFlowIndex((i) => (i + 1) % FLOW.length)}
              className="rounded-full bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              Дальше
            </button>
            <span className={`ml-auto text-[11px] font-semibold ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {flowIndex + 1} из {FLOW.length}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-10">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
          {PREVIEWS.map((item, i) => {
            const active = previewIndex === i;
            return (
              <button
                key={item.k}
                type="button"
                onClick={() => setPreviewIndex(i)}
                className={`min-w-[240px] snap-start rounded-3xl border p-5 text-left transition ${card} ${
                  active ? 'ring-2 ring-zinc-400/50' : 'hover:-translate-y-0.5'
                }`}
              >
                <div
                  className={`rounded-2xl mb-4 p-3 space-y-2 ${isDark ? 'bg-[#121417]' : 'bg-[#F3F4F6]'}`}
                >
                  {item.lines.map((line) => (
                    <div
                      key={line}
                      className={`flex items-center gap-2 text-[11px] font-medium ${
                        isDark ? 'text-zinc-300' : 'text-zinc-600'
                      }`}
                    >
                      {i === 0 ? (
                        <MapPin className="h-3 w-3 shrink-0 text-[#52525B]" />
                      ) : (
                        <Clock className="h-3 w-3 shrink-0 text-[#52525B]" />
                      )}
                      <span className="truncate">{line}</span>
                    </div>
                  ))}
                </div>
                <div className="font-extrabold text-sm">{item.k}</div>
                <div className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.d}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        <h2 className="text-center text-xl sm:text-2xl font-extrabold mb-6">Понятный путь пользователя</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s) => {
            const locked = !canAccessTab(sessionRole, s.tab);
            return (
              <button
                key={s.n}
                type="button"
                disabled={locked}
                onClick={() => goIfAllowed(s.tab)}
                className={`rounded-3xl border p-5 text-left transition ${card} ${
                  locked ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-0.5'
                }`}
              >
                <div className="text-[#52525B] text-xs font-bold tracking-widest">{s.n}</div>
                <div className="mt-2 font-extrabold">{s.title}</div>
                <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{s.text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#52525B]">
                  {locked ? 'Закрыто для роли' : 'Перейти'} <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Send, tab: 'channels' as TabType, title: 'Каналы', text: 'Бот, почта, телефония, приём из систем.' },
            { icon: UserCheck, tab: 'operator' as TabType, title: 'Диспетчер', text: 'Уточнение фактов и эскалация.' },
            { icon: Database, tab: 'database' as TabType, title: 'Реестр', text: 'Объекты, активы и заявки.' },
            { icon: Activity, tab: 'logs_traces' as TabType, title: 'Наблюдение', text: 'Журнал, цепочки обработки, сроки.' },
          ].map((t) => {
            const locked = !canAccessTab(sessionRole, t.tab);
            return (
              <button
                key={t.title}
                type="button"
                disabled={locked}
                onClick={() => goIfAllowed(t.tab)}
                className={`rounded-3xl border p-5 text-left group ${card} ${
                  locked ? 'opacity-40 cursor-not-allowed' : isDark ? 'hover:border-[#52525B]/50' : 'hover:border-[#52525B]/40'
                }`}
              >
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center mb-3 ${isDark ? 'bg-white/5' : 'bg-zinc-50'}`}>
                  <t.icon className="h-4 w-4 text-[#52525B]" />
                </div>
                <div className="font-extrabold">{t.title}</div>
                <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {locked ? 'Недоступно в текущей роли' : t.text}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        <h2 className="text-center text-xl sm:text-2xl font-extrabold mb-5">Коротко по делу</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} className={`rounded-2xl border ${card}`}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="text-sm font-extrabold">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <p className={`px-5 pb-4 text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8 text-center">
        <div className="inline-flex items-center gap-2 text-sm font-semibold mb-3">
          <Workflow className="h-4 w-4 text-[#52525B]" />
          Контрольные сценарии на месте
        </div>
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Сценарии TC-01…TC-04, пробный прогон и подтверждение диспетчером сохранены — сменился только интерфейс.
        </p>
        <div className="mt-5 flex justify-center">
          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs ${isDark ? 'border-[#2C3139] text-zinc-400' : 'border-[#E6E8EC] text-zinc-500'}`}>
            <ShieldCheck className="h-4 w-4" /> Пробный режим по умолчанию
          </span>
        </div>
      </section>
    </div>
  );
};
