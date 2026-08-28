import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { Role, TabType } from '../navigation';
import { navItemsForRole } from '../navigation';
import { Button, PageHeader, SectionHeader } from './ui/system';

/**
 * Справка: как пользоваться системой.
 *
 * Здесь собран текст, которому больше нет места на рабочих экранах.
 * Пояснения из потока смены были убраны намеренно — диспетчер читает их
 * один раз, а дальше они конкурируют с цифрами за внимание. Но убрать
 * текст можно только тогда, когда есть куда за ним прийти: этот раздел
 * и есть то место.
 *
 * Отсюда сознательно исключено описание внутреннего устройства системы:
 * для этого есть раздел «Архитектура». Справка отвечает на вопросы
 * работающего человека — что делать сейчас и что означает то, что он
 * видит на экране.
 */

interface HelpViewProps {
  role: Role;
  onNavigate: (tab: TabType) => void;
}

/** Шаги смены — настоящая последовательность, поэтому нумерация уместна. */
const SHIFT_STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Посмотреть сводку смены',
    body: 'Четыре крупные цифры наверху рабочего места отвечают на вопрос «что сейчас важно»: сколько обращений ждут уточнения, сколько заявок в работе, у скольких срок под угрозой и сколько уже просрочено. Цифру видно с трёх метров, читать подписи не обязательно.',
  },
  {
    title: 'Разобрать обращения, требующие уточнения',
    body: 'Сюда попадают обращения, в которых системе не хватило данных для заявки — например, не указано оборудование или неясна суть поломки. Под каждым перечислено, чего именно не хватает. Откройте обращение и запросите недостающее у клиента.',
  },
  {
    title: 'Следить за заявками в работе',
    body: 'Графа «в работе» показывает переданные исполнителям заявки и остаток срока по каждой. Отсчёт идёт непрерывно, поэтому графу достаточно просматривать — искать просроченные вручную не нужно, они сами меняют цвет.',
  },
  {
    title: 'Подтвердить заявку',
    body: 'Запись в реестр и передачу в 1С:ERP делает диспетчер кнопкой «Подтвердить». Система готовит заявку и предлагает решение, но не сохраняет его сама: последнее слово остаётся за человеком.',
  },
];

/** Статусы соответствуют полю status заявки. */
const STATUSES: Array<{ code: string; title: string; action: string }> = [
  { code: 'NEW', title: 'Новая, ещё не взята в работу', action: 'Проверить и передать исполнителю' },
  { code: 'WAITING_DISPATCHER', title: 'Не хватает данных для заявки', action: 'Запросить уточнение у клиента' },
  { code: 'IN_PROGRESS', title: 'Передана исполнителю, идут работы', action: 'Следить за остатком срока' },
  { code: 'RESOLVED', title: 'Работы выполнены', action: 'Убедиться, что клиент подтвердил' },
  { code: 'CLOSED', title: 'Заявка закрыта', action: 'Действий не требуется' },
];

/** Критичность соответствует полю priority заявки. */
const PRIORITIES: Array<{ code: string; meaning: string }> = [
  { code: 'critical', meaning: 'Оборудование остановлено, работа заказчика встала' },
  { code: 'high', meaning: 'Есть риск остановки, резерва нет' },
  { code: 'medium', meaning: 'Работает с ограничениями, резерв есть' },
  { code: 'low', meaning: 'Плановое обращение, срок не горит' },
];

const SLA_STATES: Array<{ percent: number; state: string; label: string; body: string; tone: string }> = [
  {
    percent: 35,
    state: 'ok',
    label: 'Время есть',
    body: 'Срок соблюдается, отсчёт идёт в обычном режиме.',
    tone: 'text-ink',
  },
  {
    percent: 80,
    state: 'warn',
    label: 'Срок под угрозой',
    body: 'До нарушения меньше часа. Стоит проверить, что исполнитель уже занят заявкой.',
    tone: 'text-warn',
  },
  {
    percent: 100,
    state: 'over',
    label: 'Просрочено',
    body: 'Срок по договору нарушен. По части договоров с этого момента начисляется неустойка.',
    tone: 'text-danger',
  },
];

export const HelpView: React.FC<HelpViewProps> = ({ role, onNavigate }) => {
  /* Разделы перечисляются из того же списка, что строит меню: справка не
     может рассказать о разделе, которого у роли нет. */
  const sections = navItemsForRole(role).filter(({ tab }) => tab !== 'help' && tab !== 'home');

  return (
    <div className="flex w-full flex-col gap-10">
      <PageHeader
        eyebrow="Справка"
        title="Как работать в системе"
        actions={
          <Button variant="primary" onClick={() => onNavigate('operator')}>
            Открыть рабочее место <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        }
      />

      {/* --------------------------------------------------------------
          Порядок работы. Главный раздел справки: отвечает на вопрос
          «что я делаю в смене», а не «как устроена система».
          -------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Порядок работы в смене"
          description="Четыре шага, из которых состоит смена диспетчера."
        />

        {/* .journal-row сам по себе display:block — flex задаём явно, иначе
            номер шага встаёт над заголовком, а не слева от него. */}
        <ol className="journal">
          {SHIFT_STEPS.map((step, index) => (
            <li key={step.title} className="journal-row flex items-start gap-4">
              {/* Номер шага — часть настоящей последовательности. */}
              <span className="reg-no shrink-0 tabular-nums" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="font-sans text-base font-bold text-ink">{step.title}</h3>
                <p className="max-w-prose font-sans text-sm leading-relaxed text-ink-2">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* --------------------------------------------------------------
          Сроки. Цвет здесь несёт смысл, поэтому показан таким же, каким
          диспетчер видит его в журнале, а не описан словами.
          -------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Остаток срока и его цвет"
          description="Срок берётся из договора с заказчиком: у планов Gold, Silver и Standard он разный."
        />

        {/* На узком экране колонка в 160px оставляла пояснению 3–4 слова в
            строку, поэтому до sm легенда и текст идут друг под другом. */}
        <div className="journal">
          {SLA_STATES.map((s) => (
            <div key={s.state} className="journal-row flex flex-col items-start gap-2 sm:flex-row sm:gap-4">
              <div className="flex w-full shrink-0 flex-col gap-1.5 sm:w-40">
                <span className={`font-mono text-sm font-medium ${s.tone}`}>{s.label}</span>
                <span className="sla-track" aria-hidden="true">
                  <span className="sla-fill" data-state={s.state} style={{ width: `${s.percent}%` }} />
                </span>
              </div>
              <p className="max-w-prose font-sans text-sm leading-relaxed text-ink-2">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="max-w-prose font-sans text-sm leading-relaxed text-ink-3">
          Тонкая линейка под отсчётом показывает, какая часть отведённого времени уже прошла.
        </p>
      </section>

      {/* --------------------------------------------------------------
          Статусы и критичность: две таблицы вместо двух абзацев прозы.
          -------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="Статусы заявки" description="Что означает статус и что с ним делать." />

        {/* Прокрутка по горизонтали — как в реестре: на телефоне три графы
            не умещаются, и без неё правая обрезалась. */}
        <div className="journal overflow-x-auto">
          <table className="ledger">
            <thead>
              <tr>
                <th>Статус</th>
                <th>Что означает</th>
                <th>Что делать</th>
              </tr>
            </thead>
            <tbody>
              {STATUSES.map((s) => (
                <tr key={s.code}>
                  <td className="cell-mono">{s.code}</td>
                  <td className="cell-key">{s.title}</td>
                  <td>{s.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Критичность"
          description="Определяет срок реакции и порядок разбора очереди."
        />

        <div className="journal overflow-x-auto">
          <table className="ledger">
            <thead>
              <tr>
                <th>Уровень</th>
                <th>Когда назначается</th>
              </tr>
            </thead>
            <tbody>
              {PRIORITIES.map((p) => (
                <tr key={p.code}>
                  <td className="cell-mono uppercase">{p.code}</td>
                  <td className="cell-key">{p.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --------------------------------------------------------------
          Ускорение работы. Показывается только там, где есть клавиатура:
          на телефоне эти подсказки бесполезны.
          -------------------------------------------------------------- */}
      <section className="hidden flex-col gap-4 lg:flex">
        <SectionHeader title="Быстрые приёмы" description="Для работы без мыши." />

        <div className="journal">
          <div className="journal-row flex items-center gap-4">
            <span className="flex w-40 shrink-0 items-center gap-1.5">
              <span className="kbd">Ctrl</span>
              <span className="kbd">K</span>
            </span>
            <p className="font-sans text-sm leading-relaxed text-ink-2">
              Переход в любой раздел из любого места.
            </p>
          </div>

          <div className="journal-row flex items-center gap-4">
            <span className="flex w-40 shrink-0 items-center gap-1.5">
              <span className="kbd">j</span>
              <span className="kbd">k</span>
            </span>
            <p className="font-sans text-sm leading-relaxed text-ink-2">
              Переход между обращениями в очереди уточнений.
            </p>
          </div>

          <div className="journal-row flex items-center gap-4">
            <span className="flex w-40 shrink-0 items-center gap-1.5">
              <span className="kbd">1</span>
              <span className="text-ink-3">–</span>
              <span className="kbd">9</span>
            </span>
            <p className="font-sans text-sm leading-relaxed text-ink-2">
              Открыть обращение по его номеру в очереди.
            </p>
          </div>
        </div>

        <p className="max-w-prose font-sans text-sm leading-relaxed text-ink-3">
          На телефоне и планшете графы журнала листаются свайпом, а точки под лентой показывают
          число записей и текущее место.
        </p>
      </section>

      {/* --------------------------------------------------------------
          Состав разделов — из общего списка навигации, а не переписанный
          вручную: иначе справка разойдётся с меню при первом изменении.
          -------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Разделы системы"
          description={
            role === 'admin'
              ? 'Доступны вам как администратору.'
              : 'Доступны вам как диспетчеру.'
          }
        />

        <div className="journal">
          {sections.map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => onNavigate(item.tab)}
              className="journal-row group w-full text-left"
            >
              <item.icon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
              <span className="flex min-w-0 flex-col">
                <span className="font-sans text-base font-bold text-ink">{item.label}</span>
                <span className="font-sans text-sm leading-relaxed text-ink-2">{item.hint}</span>
              </span>
              <ArrowRight
                className="ml-auto h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
