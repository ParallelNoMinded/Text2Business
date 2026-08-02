# Технический Отчет: Целевая Событийно-Ориентированная Архитектура (To-Be / Enterprise Target)

**Проект:** Text2Business AI-Диспетчер Platform  
**Архитектурный стиль:** Event-Driven Microservices Architecture (EDA)  
**Дата:** 2 августа 2026 г.  

---

## 1. Исполнительное Резюме
Целевая платформа построена на принципах асинхронной событийно-ориентированной архитектуры (EDA), гарантирующей отказоустойчивость, высокую пропускную способность (10,000+ обращений/мин) и масштабируемость отдельных модулей.

## 2. Разбор Сервисов Target Схемы

### 2.1 Omnichannel Ingress Gateway (Envoy Gateway)
- Прием и валидация входящих HTTPS/gRPC подключений от Telegram, Email, SIP Телефонии и REST.
- TLS Termination, Rate Limiting и защита от DDoS.

### 2.2 Event Streaming Layer (Apache Kafka)
- Асинхронная передача событий между микросервисами (`ingress.messages.v1`, `ai.extracted_facts.v1`, `core.tickets.v1`).

### 2.3 Service 1: STT & Speech Engine (Yandex SpeechKit / Mochi)
- Потоковая транскрипция входящей речи с диаризацией (Оператор / Заказчик).

### 2.4 Service 2: Perception & AI Engine (Python / LangGraph + vLLM)
- Извлечение сущностей, проверкой Guardrails и поддержка RAG в закрытом контуре (Air-Gapped).

### 2.5 Service 3: Core Decision Engine (Go / Temporal.io)
- Оркестрация бизнес-процессов с надежным сохранением состояния и организацией HITL-пауз.

### 2.6 Data Layer & Observability (PostgreSQL 18 + pgvector + Arize AI)
- Хранение реляционных и векторных данных, мониторинг галлюцинаций LLM и метрик OTel.
