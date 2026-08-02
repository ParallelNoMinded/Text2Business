# Архитектурная документация проекта Text2Business AI-Диспетчер (ArcSpace)

Данная директория содержит полный комплект архитектурных артефактов enterprise-уровня для промышленного AI-Диспетчера обработки входящих бизнес-обращений.

## Структура директории

```text
/architecture
├── README.md                           # Главный обзор архитектуры
├── adr/                                # Архитектурные решения (Architecture Decision Records)
│   ├── adr-000-target-architecture.md   # Целевая событийная микросервисная архитектура
│   ├── adr-001-structured-output.md     # Выделенное структурированное извлечение сущностей (JSON Mode)
│   ├── adr-002-mvp-scope.md             # Границы MVP и контур интеграции 1С:Предприятие
│   ├── adr-003-go-backend.md            # Выбор Go/Temporal для Core State Engine
│   ├── adr-004-d2-c4-model.md           # Описание C4 Model & PlantUML
│   ├── adr-005-multi-provider-ai-router.md # Роутер LLM провайдеров (GitHub Models / vLLM / Yandex)
│   ├── adr-006-air-gapped-llm.md        # Air-gapped развертывание в закрытом контуре
│   ├── adr-007-wbs-catalog-supabase.md  # Хранилище реестров и WBS-смет
│   ├── adr-008-csv-export-dolya.md      # Интеграционный экспорт данных в 1С / ERP
│   ├── adr-009-nvidia-glm-pipeline-agent-c4.md # Интеграция агентов и инференса
│   └── adr-010-repository-structure.md  # Организация структуры репозитория
├── report/                             # Технические отчёты и спецификации
│   ├── report.md                        # Полный технический отчет архитектуры
│   └── style.css                        # Стили оформления экспорта в PDF/HTML
├── api/                                # Спецификации интерфейсов
│   └── openapi.yaml                     # OpenAPI 3.0 спецификация Webhook & OData API
└── docs/                               # Схемы и диаграммы C4 / Sequence / Deployment
    ├── README.md
    └── diagrams/                        # Исходный код PlantUML (.puml)
        ├── c1_context.puml
        ├── c2_container.puml
        ├── target_architecture.puml
        ├── deployment_cloud.puml
        ├── deployment_onprem.puml
        ├── er_diagram.puml
        └── sequence_unified.puml
```

## Целевая Схема Архитектуры (Target Event-Driven Architecture)

```text
┌────────────────────────────────────────┐
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
└────────────────────────────────────────┘
```
