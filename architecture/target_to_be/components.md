# Детализация компонентов целевой архитектуры (To-Be / Enterprise)

## 1. Ingress Layer (Envoy Gateway)
- Envoy Proxy с расширением Rate Limit и Lua filter для валидации HMAC вебхуков Telegram и Mailgun/Email.
- gRPC Streaming интерфейс для прямой подачи аудиопотоков со станций telephony/SIP.

## 2. Event Streaming Layer (Apache Kafka)
- **Топики Kafka:**
  - `ingress.messages.v1`: Входящие тексты и метаданные.
  - `stt.audio.v1`: Аудиофрагменты звонков.
  - `ai.extracted_facts.v1`: Результаты извлечения JSON структурированных фактов.
  - `core.tickets.v1`: Изменения статусов заявок.
  - `erp.sync.v1`: Очередь отправки документов в 1С:Предприятие.

## 3. Microservices Core Layer
- **Service 1: STT Microservice (Python/FastAPI + Yandex SpeechKit SDK):** Потоковый распознаватель речи.
- **Service 2: AI Perception Agent (Python + LangGraph / vLLM):** Векторная фильтрация RAG + LLM Fact Extraction с автозаменой недоступных провайдеров.
- **Service 3: Core Decision Engine (Go + Temporal.io Worker):** Декларативный Temporal Workflow, хранящий устойчивое состояние каждой обращения с возможностью возобновления после решения оператора (HITL).

## 4. Data & Observability Layer
- **PostgreSQL 18 + pgvector:** Хранение истории обращений, векторных эмбеддингов документов и журналов аудита.
- **Redis:** Кэширование контекста сессий и токенов пользователей.
- **OpenTelemetry Collector & Arize AI:** Мониторинг галлюцинаций LLM, полноты извлечения фактов и трассировка вызовов end-to-end.
