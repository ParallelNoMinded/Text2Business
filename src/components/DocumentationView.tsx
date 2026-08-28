import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Braces,
  CheckCircle2,
  Database,
  FileText,
  GitBranch,
  MessageSquareText,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

import { ArchitectureView } from './ArchitectureView';

type DocumentationSection = 'overview' | 'architecture';

interface DocumentationViewProps {
  theme: 'dark' | 'light';
}

const workflow = [
  {
    title: 'Получение обращения',
    description: 'Система принимает свободный текст из интерфейса, Telegram, почты, телефонии или REST API.',
    icon: MessageSquareText,
  },
  {
    title: 'Извлечение фактов',
    description: 'LLM или локальный распознаватель определяет клиента, объект, оборудование и описание проблемы.',
    icon: Bot,
  },
  {
    title: 'Проверка правил',
    description: 'Детерминированное ядро сверяет реестр, ищет дубликаты, рассчитывает SLA и выбирает действие.',
    icon: Braces,
  },
  {
    title: 'Контроль диспетчера',
    description: 'Оператор уточняет недостающие данные и подтверждает передачу подготовленной заявки в учётный контур.',
    icon: UserCheck,
  },
];

const capabilities = [
  'Единая очередь обращений с контролем сроков',
  'Безопасный демо-режим без записи заявки',
  'Реестр клиентов, объектов, оборудования и договоров',
  'Журнал обработки и техническая трассировка',
  'Ролевой доступ диспетчера и администратора',
  'Защита от prompt injection и ручное подтверждение действий',
];

const stack = [
  ['Интерфейс', 'React 19, TypeScript, Vite, Tailwind CSS'],
  ['Сервер', 'Node.js, Express, Vercel Functions'],
  ['Данные и доступ', 'Neon PostgreSQL, Better Auth'],
  ['Обработка текста', 'Google Gemini и локальный fallback'],
];

function ProjectOverview() {
  return (
    <div className="flex flex-col gap-5">
      <section className="sheet overflow-hidden" aria-labelledby="documentation-title">
        <div className="border-b border-rule p-5 sm:p-7">
          <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            <FileText className="h-4 w-4" aria-hidden="true" />
            README · обзор проекта
          </div>
          <h1 id="documentation-title" className="max-w-4xl font-sans text-2xl font-bold tracking-tight text-ink text-balance sm:text-3xl">
            Text2Business — AI-диспетчер сервисных обращений
          </h1>
          <p className="mt-3 max-w-3xl font-sans text-base leading-relaxed text-ink-2 text-pretty">
            Учебный full-stack проект, который превращает неструктурированное сообщение клиента в проверенную сервисную заявку. Нейросеть понимает текст, а критичные бизнес-решения остаются за строгими правилами и диспетчером.
          </p>
        </div>

        <div className="grid gap-px bg-rule lg:grid-cols-2">
          <article className="bg-panel p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-ink">
              <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
              Цель проекта
            </h2>
            <p className="mt-3 font-sans text-sm leading-relaxed text-ink-2">
              Сократить ручную работу диспетчера: собрать обращения из разных каналов, извлечь факты, проверить их по реестру и подготовить решение с понятным обоснованием.
            </p>
          </article>
          <article className="bg-panel p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-ink">
              <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" />
              Решаемая проблема
            </h2>
            <p className="mt-3 font-sans text-sm leading-relaxed text-ink-2">
              Клиенты описывают поломки свободно и часто пропускают адрес, код оборудования или важные детали. Ручная обработка таких сообщений занимает время и повышает риск ошибки или нарушения SLA.
            </p>
          </article>
        </div>
      </section>

      <section className="sheet p-5 sm:p-6" aria-labelledby="workflow-title">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Пользовательский путь</span>
          <h2 id="workflow-title" className="font-sans text-xl font-bold tracking-tight text-ink">От сообщения до подтверждённой заявки</h2>
        </div>
        <ol className="mt-5 grid gap-3 lg:grid-cols-4">
          {workflow.map(({ title, description, icon: Icon }, index) => (
            <li key={title} className="flex min-w-0 flex-col border border-rule bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                <span className="font-mono text-[11px] text-ink-3">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-5 font-sans text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-ink-2">{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <section className="sheet p-5 sm:p-6" aria-labelledby="capabilities-title">
          <h2 id="capabilities-title" className="font-sans text-lg font-bold text-ink">Что умеет система</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {capabilities.map((capability) => (
              <li key={capability} className="flex items-start gap-3 font-sans text-sm leading-relaxed text-ink-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{capability}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="sheet p-5 sm:p-6" aria-labelledby="stack-title">
          <h2 id="stack-title" className="flex items-center gap-2 font-sans text-lg font-bold text-ink">
            <Database className="h-5 w-5 text-accent" aria-hidden="true" />
            Технологии
          </h2>
          <dl className="mt-4 flex flex-col divide-y divide-rule border-y border-rule">
            {stack.map(([term, description]) => (
              <div key={term} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="font-sans text-sm font-semibold text-ink">{term}</dt>
                <dd className="font-mono text-xs leading-relaxed text-ink-3 sm:max-w-[65%] sm:text-right">{description}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <aside className="sheet flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-label="Переход к архитектуре">
        <div>
          <div className="flex items-center gap-2 font-sans font-semibold text-ink">
            <GitBranch className="h-5 w-5 text-accent" aria-hidden="true" />
            Нужны технические детали?
          </div>
          <p className="mt-1 font-sans text-sm leading-relaxed text-ink-2">Диаграммы As-Is и To-Be, компоненты, API и план развития находятся в подпункте «Архитектура».</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 font-mono text-xs text-accent">
          Выберите вкладку выше <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </aside>
    </div>
  );
}

export function DocumentationView({ theme }: DocumentationViewProps) {
  const [section, setSection] = useState<DocumentationSection>('overview');

  return (
    <div className="flex flex-col gap-5">
      <nav className="sheet flex flex-col gap-2 p-2 sm:flex-row" aria-label="Разделы документации">
        <button
          type="button"
          onClick={() => setSection('overview')}
          aria-current={section === 'overview' ? 'page' : undefined}
          className={`flex min-h-11 flex-1 items-center gap-3 px-4 text-left font-sans text-sm font-semibold transition-colors ${
            section === 'overview' ? 'bg-accent-bg text-accent' : 'text-ink-2 hover:bg-panel-2 hover:text-ink'
          }`}
        >
          <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="block">О проекте</span>
            <span className="block font-normal text-ink-3">README и пользовательский путь</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSection('architecture')}
          aria-current={section === 'architecture' ? 'page' : undefined}
          className={`flex min-h-11 flex-1 items-center gap-3 px-4 text-left font-sans text-sm font-semibold transition-colors ${
            section === 'architecture' ? 'bg-accent-bg text-accent' : 'text-ink-2 hover:bg-panel-2 hover:text-ink'
          }`}
        >
          <GitBranch className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="block">Архитектура</span>
            <span className="block font-normal text-ink-3">Схемы, компоненты и отчёты</span>
          </span>
        </button>
      </nav>

      {section === 'overview' ? <ProjectOverview /> : <ArchitectureView theme={theme} />}
    </div>
  );
}
