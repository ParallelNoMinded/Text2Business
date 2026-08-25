# Текущая Архитектура (As-Is / MVP) — Text2Business AI-Диспетчер

**Тип системы:** Монолитный Full-Stack контейнер  
**Стек:** Node.js 20, Express, TypeScript, React 19, Vite, Tailwind CSS  
**Состояние БД:** In-Memory JSON State (`mockDb.ts`)  
**Провайдеры AI:** GitHub Models API (`gpt-4o`, `qwen3.6-27b`, `deepseek-reasoner`), Google Gemini API, локальный эвристический фаллбэк  

---

## 1. Общий обзор текущего состояния

Текущая реализация представляет собой быстродействующий прототип (MVP) в едином Node.js/Express контейнере, объединяющем клиентскую SPA-консоль и бэкенд-сервер.

```text
[ Telegram / Email / Voice / REST ]
               │
               ▼
   ┌───────────────────────┐
   │ Express Webhook Engine│ ──► [ GitHub Models / Gemini API (JSON Mode) ]
   └───────────┬───────────┘
               │ (Extracted Facts)
               ▼
   ┌───────────────────────┐
   │ Deterministic Dispatch│ ──► [ In-Memory DB (mockDb.ts) ]
   │ Rules Engine (TS)     │
   └───────────┬───────────┘
               │
               ▼
   ┌───────────────────────┐
   │ 1C:ERP OData Adapter  │ ──► [ React SPA Диспетчера (HITL) ]
   └───────────────────────┘
```

---

## 2. Компоненты приложения

1. **Express Server (`server.ts`):**
   - Обрабатывает входящие Webhooks от Telegram, Email, Телефонии и REST API.
   - Обеспечивает связь с GitHub Models API (`https://models.inference.ai.azure.com/chat/completions`) с обязательным параметром `response_format: { type: 'json_object' }`.
   - Эмулирует OData REST интерфейс 1С:ERP (`/api/1c/tickets`).

2. **Deterministic Dispatch Engine (`src/dispatcherEngine.ts`):**
   - Проверяет ввод на промпт-инъекции (`checkGuardrails`).
   - Выполняет поиск клиентов, объектов и оборудования в локальной базе.
   - Разрешает неоднозначности оборудования за счет анализа открытых заявок (Сценарий TC-02).
   - Рассчитывает дедлайны по SLA (Gold: 60 мин 24x7, Silver: 240 мин, Standard: 480 мин).

3. **In-Memory Store (`src/mockDb.ts`):**
   - Содержит предзагруженные реестры контрагентов, объектов, оборудования, договоров, открытых и закрытых заявок.

4. **React SPA (`src/components/*`):**
   - Консоль оператора (HITL), инструмент тестирования пресетов (TC-01 ... TC-04), трассировщик вызовов и инспектор БД.
