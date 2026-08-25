# Целевая Архитектура (To-Be / Enterprise Target) — Text2Business AI-Диспетчер

**Архитектурный стиль:** Event-Driven Microservices Architecture (EDA)  
**Протоколы:** gRPC, AMQP (Kafka), Webhooks, OData REST, TLS 1.3  
**Хранилище:** PostgreSQL 18 + `pgvector` + Redis  
**Оркестрация процессов:** Go + Temporal.io Workflow Engine  
**AI & STT:** Python LangGraph (ReAct Agents) + vLLM / Yandex SpeechKit  
**Наблюдаемость:** OpenTelemetry Collector + Arize AI / Prometheus  

---

## 1. Общий обзор целевого состояния

Целевая архитектура спроектирована для работы в высоконагруженной среде промышленного масштаба (10,000+ обращений в минуту) с поддержкой асинхронных событий, потокового распознавания речи в реальном времени и гарантированной сохранности состояния процессов при интеграции с 1С:ERP.

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

---

## 2. Разбор целевых микросервисов

1. **Omnichannel Ingress Gateway (Envoy Gateway):**
   - Прием HTTPS Webhooks (Telegram, Email SMTP/IMAP, REST) и gRPC аудиопотоков.
   - Обеспечивает TLS Termination, Rate Limiting и Circuit Breaking.

2. **Event Bus (Apache Kafka / RabbitMQ):**
   - Буферизация событий: `InboundMessageReceived`, `AudioTranscriptCreated`, `FactsExtracted`, `DispatchDecisionMade`.
   - Изоляция сетевых пиков от внутренних микросервисов.

3. **Service 1: STT & Speech Engine (Yandex SpeechKit / Mochi):**
   - Потоковая расшифровка аудиопотока и телефонных звонков с диаризацией (Оператор / Клиент).

4. **Service 2: Perception & AI Engine (Python / LangGraph + vLLM):**
   - Мультиагентные сценарии с подстраховкой (ReAct pattern), работающие как во внешних облаках (GitHub Models), так и в закрытом контуре (Air-Gapped).

5. **Service 3: Core Decision Engine (Go / Temporal.io):**
   - Гарантированное управление Workflow обработки заявки с поддержкой долгих Human-in-the-Loop (HITL) пауз.
   - Формирование проводок документов "ЗаявкаНаРемонт" и "ЗаказНаряд" в 1С:ERP.

6. **Data Layer & Observability:**
   - PostgreSQL 18 + `pgvector`: Хранение заявок и векторный поиск похожих инцидентов (RAG).
   - Arize AI & OpenTelemetry: Мониторинг полноты ответов LLM, дрейфа данных и задержек P99.
