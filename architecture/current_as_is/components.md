# Состав компонентов текущей архитектуры (As-Is / MVP)

## 1. Express Backend Gateway (`server.ts`)
- **Webhook Handlers:**
  - `POST /api/webhooks/dispatch`: Единый вход обработки текстовых и голосовых сообщений.
  - `GET /api/webhooks/dispatch`: Тестовый Swagger эндпоинт и проверка работоспособности.
  - `POST /api/llm/config`: Динамическая установка токенов и моделей (`gpt-4o`, `qwen3.6-27b`, `deepseek-reasoner`).
- **1C OData Synchronization:**
  - `GET /api/1c/tickets`: Получение текущих заявок в формате OData REST.
  - `POST /api/1c/tickets`: Проведение заявки "ЗаявкаНаРемонт" в эмулятор 1С:ERP.

## 2. Deterministic Dispatch Rules Engine (`src/dispatcherEngine.ts`)
- **Guardrails Inspector:** Выявление невалидных или вредоносных запросов, запросов не по теме.
- **Fact Extractor:** Получение фактов (Заказчик, Объект, Ассет, Детали, Срочность) от LLM или локального эвристического алгоритма.
- **Asset Resolver:** Поиск по коду/названию и разрешения неоднозначности (например, при наличии открытой заявки на тот же ассет).
- **SLA Engine:** Расчет сроков выполнения на основе типа договора (`GOLD`, `SILVER`, `STANDARD`).

## 3. In-Memory Database (`src/mockDb.ts`)
- Репо с предзагруженными тестовыми контрагентами (ООО "СеверФуд", ООО "ВекторТрейд" и др.), объектами и оборудованием (Компрессоры ХУ-17, Холодильные горки).

## 4. Frontend SPA (`src/components/*`)
- `Header.tsx`: Верхнее меню переключения режимов (Диспетчер, Каналы, БД, Логи, Архитектура) и индикатор токена GitHub Models.
- `OperatorConsoleView.tsx`: Консоль диспетчера для утверждения/редактирования неполных заявок (HITL).
- `DatabaseInspectorView.tsx`: Просмотр таблиц базы данных и активных контрактов.
- `LogsTracesView.tsx`: Трейсинг обращений, логи Dry-Run и JSON ответы LLM.
- `ArchitectureView.tsx`: Архитектурный центр с интерактивными PlantUML схемами и C4 диаграммами.
