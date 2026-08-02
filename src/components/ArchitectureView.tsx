import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  FileText,
  ShieldAlert,
  Terminal,
  Cpu,
  Database,
  Server,
  Zap,
  Activity,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Code,
  GitBranch,
} from 'lucide-react';

interface ArchitectureViewProps {
  theme: 'dark' | 'light';
}

type ArchTab = 'target' | 'report' | 'adrs' | 'diagrams' | 'openapi';

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [activeSubTab, setActiveSubTab] = useState<ArchTab>('target');
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedAdr, setSelectedAdr] = useState<string>('ADR-000');

  const targetAsciiDiagram = `┌────────────────────────────────────────┐
│       ОМНИКАНАЛЬНЫЙ INGRESS GATEWAY    │
│        (Envoy Gateway)                 │
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│   KAFKA / RABBITMQ EVENT BUS (EVENTS)  │
└──────┬──────────────────────┬──────────┘
       │                      │
   ┌───┴──────────────┐   ┌───┴─────────────────┐
   ▼                  │   ▼                     │
┌───────────────────┐ │ ┌───────────────────┐   │
│ SERVICE 1: STT    │ │ │ SERVICE 2: AI     │   │
│ (Yandex / Mochi)  │ │ │ (Python/LangGraph)│   │
└─────────┬─────────┘ │ └─────────┬─────────┘   │
          │           │           │             │
          └───────────┼───────────┘             │
                      ▼                         │
┌────────────────────────────────────────┐      │
│     SERVICE 3: CORE DECISION ENGINE    │◄─────┘
│        (Go / Temporal.io State)        │
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│      DATA LAYER & OBSERVABILITY        │
│  • PostgreSQL 18 + pgvector + Redis    │
│  • Arize AI (OTel Metrics)             │
│  • 1C:ERP OData Enterprise Adapter     │
└────────────────────────────────────────┘`;

  const adrList = [
    {
      id: 'ADR-000',
      title: 'Целевая событийная микросервисная архитектура',
      status: 'Принято (Target)',
      date: '2026-08-02',
      summary: 'Переход на Envoy Gateway, Kafka Event Bus, Yandex STT, Python LangGraph AI, Go Temporal.io и 1С OData Adapter.',
      tags: ['Kafka', 'Temporal.io', 'Envoy', 'LangGraph', '1C OData'],
    },
    {
      id: 'ADR-001',
      title: 'Стандартизация на Structured Output (JSON Mode)',
      status: 'Принято',
      date: '2026-06-30',
      summary: 'Строгое извлечение фактов из текста обращений через JSON Schema и response_format: json_object.',
      tags: ['LLM', 'JSON Schema', 'Structured Data'],
    },
    {
      id: 'ADR-002',
      title: 'MVP Scope и Контур Интеграции 1С:Предприятие',
      status: 'Принято',
      date: '2026-06-30',
      summary: 'Поддержка каналов Telegram, Email, Telephony, REST с операторской HITL-консолью и 1С OData API.',
      tags: ['MVP', '1C:ERP', 'HITL', 'Webhooks'],
    },
    {
      id: 'ADR-003',
      title: 'Go / Temporal.io для Core Decision Engine',
      status: 'Принято',
      date: '2026-06-30',
      summary: 'Оркестрация распределенных транзакций (Saga Pattern) и длинных пауз ожидания действий диспетчера.',
      tags: ['Go', 'Temporal.io', 'State Machine'],
    },
    {
      id: 'ADR-005',
      title: 'Роутер Выбора Моделей (GitHub Models / vLLM)',
      status: 'Принято',
      date: '2026-06-30',
      summary: 'Динамическое переключение gpt-4o, qwen3.6-27b, gemma4:e4b, deepseek-reasoner, nemotron при наличии токена.',
      tags: ['GitHub Models', 'gpt-4o', 'DeepSeek', 'Qwen'],
    },
    {
      id: 'ADR-006',
      title: 'Air-Gapped LLM Контур (vLLM)',
      status: 'Принято',
      date: '2026-06-30',
      summary: 'Полная изоляция данных для корпоративных заказчиков без внешних DNS/HTTP вызовов.',
      tags: ['Air-Gap', 'vLLM', 'Enterprise Security'],
    },
  ];

  const handleCopyAscii = () => {
    navigator.clipboard.writeText(targetAsciiDiagram);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Top Banner Header */}
      <div
        className={`p-6 rounded-2xl border backdrop-blur-md shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isDark
            ? 'bg-gradient-to-r from-[#030712] via-[#09152a] to-[#030712] border-cyan-500/40 text-white shadow-[0_0_30px_rgba(34,211,238,0.15)]'
            : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-blue-800 text-white shadow-xl'
        }`}
      >
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-inner">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-400 text-slate-950 uppercase">
                Enterprise Target
              </span>
              <span className="text-xs font-mono text-cyan-300">v2.0 • 2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight mt-1">
              Архитектура AI-Диспетчера Обращений
            </h1>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Событийно-ориентированная микросервисная платформа (EDA, Envoy, Kafka, Temporal, 1C OData)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={handleCopyAscii}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition flex items-center space-x-1.5"
          >
            {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copiedCode ? 'Схема скопирована' : 'Скопировать ASCII'}</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div
        className={`flex items-center space-x-2 p-1.5 rounded-xl border overflow-x-auto no-scrollbar font-mono text-xs ${
          isDark ? 'bg-[#060612] border-cyan-500/30' : 'bg-white border-slate-300 shadow-sm'
        }`}
      >
        <button
          onClick={() => setActiveSubTab('target')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'target'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                : 'bg-blue-900 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/5'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Целевая Схема (Target)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('report')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'report'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                : 'bg-blue-900 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/5'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Технический Отчёт</span>
        </button>

        <button
          onClick={() => setActiveSubTab('adrs')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'adrs'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                : 'bg-blue-900 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/5'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          <span>ADR Реестр ({adrList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('diagrams')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'diagrams'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                : 'bg-blue-900 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/5'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Code className="h-4 w-4" />
          <span>C1 / C2 & Sequence</span>
        </button>

        <button
          onClick={() => setActiveSubTab('openapi')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeSubTab === 'openapi'
              ? isDark
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                : 'bg-blue-900 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/5'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>OpenAPI 3.0</span>
        </button>
      </div>

      {/* SUBTAB 1: TARGET ARCHITECTURE */}
      {activeSubTab === 'target' && (
        <div className="space-y-6">
          {/* Main Target Diagram Box */}
          <div
            className={`p-6 rounded-2xl border shadow-2xl relative overflow-hidden ${
              isDark
                ? 'bg-[#030712] border-cyan-500/40 text-cyan-300 shadow-[0_0_40px_rgba(34,211,238,0.1)]'
                : 'bg-slate-900 border-slate-700 text-cyan-300 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-cyan-500/30 mb-4 font-mono text-xs">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="font-extrabold text-white uppercase tracking-wider">
                  Target Event-Driven Architecture Map
                </span>
              </div>
              <span className="text-slate-400 text-[11px]">Envoy • Kafka • Temporal • 1C OData</span>
            </div>

            <pre className="font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto p-4 bg-[#010309] rounded-xl border border-cyan-500/30 text-cyan-300 shadow-inner">
              {targetAsciiDiagram}
            </pre>
          </div>

          {/* Component Deep-Dive Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#060612] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b pb-2 border-slate-700/40">
                <Server className="h-4 w-4" />
                <span>1. Ingress & Event Bus</span>
              </div>
              <ul className="space-y-2 text-slate-300 text-[11px]">
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-white">Envoy Gateway:</strong> Единый защищенный вход TLS 1.3, Rate Limiting и Webhooks.
                  </span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-white">Kafka / RabbitMQ:</strong> Буферизация событий и сглаживание пиковых нагрузок.
                  </span>
                </li>
              </ul>
            </div>

            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#060612] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b pb-2 border-slate-700/40">
                <Zap className="h-4 w-4" />
                <span>2. AI & Speech Microservices</span>
              </div>
              <ul className="space-y-2 text-slate-300 text-[11px]">
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-white">STT Service:</strong> Потоковая расшифровка Yandex SpeechKit / Mochi для звонков.
                  </span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-white">AI Service:</strong> LangGraph Python агенты для структурированного извлечения фактов.
                  </span>
                </li>
              </ul>
            </div>

            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#060612] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b pb-2 border-slate-700/40">
                <Database className="h-4 w-4" />
                <span>3. Decision Engine & Data Layer</span>
              </div>
              <ul className="space-y-2 text-slate-300 text-[11px]">
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-white">Go Temporal State:</strong> Надежная оркестрация процессов и HITL паузы.
                  </span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-white">PostgreSQL 18 & 1C OData:</strong> Хранение pgvector и регистрация ЗаявокНаРемонт.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: EXECUTIVE REPORT */}
      {activeSubTab === 'report' && (
        <div
          className={`p-6 rounded-2xl border font-mono space-y-6 ${
            isDark ? 'bg-[#060612] border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800 shadow-md'
          }`}
        >
          <div className="border-b border-slate-700/50 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              <span>Технический Архитектурный Отчёт</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Документ утвержден Техническим Советом и описывает стандарт развертывания платформы
            </p>
          </div>

          <div className="space-y-4 text-xs leading-relaxed">
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">1. Назначение и Бизнес-Цели</h3>
              <p>
                Система обеспечивает автоматическую обработку входящих текстовых и голосовых обращений клиентов
                со скоростью реакции менее 1 секунды. Выделенный модуль extraction извлекает следующие сущности:
                Заказчик, Объект, Код Актива, Суть Проблемы, Срочный дедлайн и Наличие Резерва.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">2. Контур Безопасности & Air-Gapped Mode</h3>
              <p>
                Платформа может быть развернута как в облачной среде (с использованием GitHub Models gpt-4o / qwen3.6-27b),
                так и в полностью закрытом периметре (Air-Gapped) на базе локального vLLM с моделями DeepSeek-R1 / Gemma 4.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">3. Гарантии Интеграции с 1С:Предприятие</h3>
              <p>
                Интеграционный слой на базе OData REST протокола гарантирует синхронизацию документов
                «ЗаявкаНаРемонт» с проверкой корректности заполнения всех обязательных реквизитов.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ADRs */}
      {activeSubTab === 'adrs' && (
        <div className="space-y-4 font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adrList.map((adr) => (
              <div
                key={adr.id}
                onClick={() => setSelectedAdr(adr.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedAdr === adr.id
                    ? isDark
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                      : 'bg-blue-50 border-blue-500 text-slate-900 shadow-md'
                    : isDark
                    ? 'bg-[#060612] border-slate-800 text-slate-300 hover:border-slate-700'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {adr.id}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">{adr.status}</span>
                </div>
                <h4 className="text-sm font-bold mt-2 text-white">{adr.title}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{adr.summary}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {adr.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: DIAGRAMS */}
      {activeSubTab === 'diagrams' && (
        <div
          className={`p-6 rounded-2xl border font-mono space-y-4 ${
            isDark ? 'bg-[#060612] border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <h3 className="text-sm font-bold text-cyan-400">PlantUML C1 Context & Sequence Specification</h3>
          <p className="text-xs text-slate-400">
            Исходные файлы PlantUML находятся в <code className="text-cyan-300">/architecture/docs/diagrams/</code>
          </p>

          <pre className="p-4 rounded-xl bg-[#010309] border border-cyan-500/30 text-cyan-300 text-xs overflow-x-auto">
{`@startuml C1_Context
!include <C4/C4_Context>
title C1 — System Context: Text2Business AI-Диспетчер

Person(client, "B2B Клиент / Заказчик", "Отправляет заявки через Telegram, Email, Голос")
System(dispatcher_app, "AI-Диспетчер", "Автоматический прием, извлечение фактов и проведение")
System_Ext(github_models, "GitHub Models API", "gpt-4o, qwen, gemma, deepseek")
System_Ext(erp_1c, "1С:ERP", "Реестр ЗаявокНаРемонт по OData")

Rel(client, dispatcher_app, "Шлет обращение", "HTTPS")
Rel(dispatcher_app, github_models, "Извлечение фактов", "JSON Mode")
Rel(dispatcher_app, erp_1c, "Проведение документов", "OData REST")
@enduml`}
          </pre>
        </div>
      )}

      {/* SUBTAB 5: OPENAPI */}
      {activeSubTab === 'openapi' && (
        <div
          className={`p-6 rounded-2xl border font-mono space-y-4 ${
            isDark ? 'bg-[#060612] border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-sm font-bold text-cyan-400">OpenAPI 3.0 Specification</h3>
            <span className="text-xs text-emerald-400">/architecture/api/openapi.yaml</span>
          </div>
          <pre className="p-4 rounded-xl bg-[#010309] border border-cyan-500/30 text-cyan-300 text-xs overflow-x-auto">
{`openapi: 3.0.3
info:
  title: Text2Business AI-Dispatcher API
  version: 2.0.0
paths:
  /api/webhooks/dispatch:
    post:
      summary: Диспетчеризация входящего обращения
    get:
      summary: Проверка статуса и Swagger-тест
  /api/llm/config:
    post:
      summary: Настройка GITHUB_MODELS_TOKEN и активной модели
  /api/1c/tickets:
    get:
      summary: OData синхронизация с 1С`}
          </pre>
        </div>
      )}
    </div>
  );
};
