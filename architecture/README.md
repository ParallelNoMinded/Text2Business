# Архитектурный Реестр Проекта Text2Business AI-Диспетчер

Данный раздел содержит полный комплект архитектурных материалов платформы, строго разделенный на **Текущее состояние (As-Is / MVP)** и **Целевую архитектуру (To-Be / Enterprise Target)**.

---

## 📂 Структура Архитектурного Реестра

```text
/architecture
├── README.md                            # Главный реестр архитектуры (Карта разделения As-Is / To-Be)
│
├── current_as_is/                       # ══ БЛОК 1: ТЕКУЩАЯ АРХИТЕКТУРА (AS-IS / MVP) ══
│   ├── README.md                        # Полное описание текущего монолита Node.js/Vite/Express
│   ├── components.md                    # Состав компонентов (Express Backend, React SPA, Mock DB, Rules Engine)
│   ├── data_flow.md                      # Пайплайн обработки от вебхука до вызова LLM и детерминированного ядра
│   └── diagrams/                        # Схемы текущего состояния (PlantUML)
│       ├── c1_context_current.puml       # C1 System Context текущего приложения
│       ├── c2_container_current.puml     # C2 Container (Node.js/Express + React SPA + In-Memory DB)
│       └── sequence_current.puml         # Sequence-диаграмма текущего вызова
│
├── target_to_be/                        # ══ БЛОК 2: ЦЕЛЕВАЯ АРХИТЕКТУРА (TO-BE / ENTERPRISE) ══
│   ├── README.md                        # Полное описание целевой микросервисной EDA-архитектуры
│   ├── components.md                    # Разбор сервисов (Envoy Gateway, Kafka, Python LangGraph, Go Temporal, Postgres 18)
│   ├── migration_plan.md                # Пошаговый план миграции As-Is -> To-Be
│   └── diagrams/                        # Схемы целевого состояния (PlantUML)
│       ├── c1_context_target.puml        # C1 System Context целевой платформы
│       ├── c2_container_target.puml      # C2 Container (Envoy, Kafka, Microservices)
│       ├── target_architecture.puml     # Событийная карта (Event-Driven Architecture)
│       └── sequence_target.puml          # Sequence-диаграмма целевого асинхронного потока
│
├── adr/                                 # Архитектурные решения (ADR)
│   ├── adr-000-roadmap-as-is-to-be.md   # Стратегия перехода As-Is -> To-Be
│   ├── adr-001-structured-output.md     # Использование JSON Schema / Structured Output
│   ├── adr-002-mvp-scope.md             # Границы MVP и контур 1С OData
│   ├── adr-003-go-temporal-engine.md    # Выбор Go/Temporal.io для целевого ядра
│   └── adr-005-multi-provider-ai.md     # Роутинг LLM (GitHub Models / Gemini / Local vLLM)
│
├── api/                                 # Спецификации API
│   ├── openapi_current.yaml             # API текущего Express сервера
│   └── openapi_target.yaml              # OpenAPI целевого Envoy Ingress
│
└── report/                              # Технические отчеты
    ├── report_as_is.md                  # Архитектурный отчет по текущей версии
    └── report_to_be.md                  # Технический отчет по целевой системе
```

---

## 🔀 Сравнение Архитектурных Блоков

| Параметр | Блок 1: Текущая (As-Is / MVP) | Блок 2: Целевая (To-Be / Enterprise) |
| :--- | :--- | :--- |
| **Архитектурный паттерн** | Монолитный Full-Stack контейнер | Event-Driven Microservices Architecture (EDA) |
| **Ядро обработки** | Node.js / Express / TypeScript (`dispatcherEngine.ts`) | Go + Temporal.io Workflow Engine |
| **Извлечение фактов (AI)** | GitHub Models / Gemini API (JSON Mode) / Fallback | Python / LangGraph + vLLM / GitHub Models |
| **Шина данных** | In-Process Memory Call | Apache Kafka / RabbitMQ Event Bus |
| **Хранилище данных** | In-Memory Object State (`mockDb.ts`) | PostgreSQL 18 + `pgvector` + Redis |
| **Входной Gateway** | Express Webhook Routes | Envoy Gateway (Rate Limit, TLS 1.3, Circuit Breaker) |
| **Наблюдаемость** | Встроенный UI-Трассировщик & Dry-Run Logs | OpenTelemetry Collector + Arize AI / Prometheus |
| **STT & Голос** | Web Speech API / Client-side STT | Yandex SpeechKit v3 / Mochi Streaming STT |
| **Интеграция 1С** | OData REST Эмулятор (`/api/1c/tickets`) | 1C OData Enterprise Sync Adapter |

---

## 🔗 Быстрые ссылки

- 📘 [Документация по ТЕКУЩЕЙ архитектуре (As-Is)](./current_as_is/README.md)
- 🚀 [Документация по ЦЕЛЕВОЙ архитектуре (To-Be)](./target_to_be/README.md)
- 🗺️ [План миграции (Migration Roadmap)](./target_to_be/migration_plan.md)
- 📜 [Индекс ADR (Architecture Decision Records)](./adr/)
