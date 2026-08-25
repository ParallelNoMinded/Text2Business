import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  FileText,
  Terminal,
  Server,
  Zap,
  Database,
  CheckCircle2,
  Copy,
  Check,
  Code,
  GitBranch,
  ArrowRight,
  Monitor,
  Cloud,
  Cpu,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sliders,
} from 'lucide-react';

interface ArchitectureViewProps {
  theme: 'dark' | 'light';
}

type ModeTab = 'as_is' | 'to_be';
type AsIsSubTab = 'diagrams' | 'components' | 'data_flow' | 'openapi' | 'report';
type ToBeSubTab = 'diagrams' | 'components' | 'migration' | 'adrs' | 'openapi' | 'report';

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [mainMode, setMainMode] = useState<ModeTab>('to_be');
  const [asIsSubTab, setAsIsSubTab] = useState<AsIsSubTab>('diagrams');
  const [toBeSubTab, setToBeSubTab] = useState<ToBeSubTab>('diagrams');

  const [selectedPuml, setSelectedPuml] = useState<'c1' | 'c2' | 'c3' | 'deployment' | 'sequence' | 'er' | 'api' | 'eda'>('eda');
  const [copiedCode, setCopiedCode] = useState(false);
  const [pumlRenderMode, setPumlRenderMode] = useState<'visual' | 'code' | 'both'>('visual');

  // PlantUML Sources
  const plantUmlCodes = {
    // Current As-Is
    c1_current: `@startuml c1_context_current
!include <C4/C4_Context>
LAYOUT_TOP_DOWN()

title C1 — System Context: Text2Business AI-Диспетчер (Текущая реализация / As-Is)

Person(client, "B2B Заявитель / Клиент", "Отправляет сервисные обращения через Telegram, Email, Голосовую телефонию или REST API")
Person(operator, "Диспетчер-Оператор (HITL)", "Контролирует неопределенные обращения, ведет диалог с клиентом в боте, дозаполняет факты")
Person(tech_lead, "AI Solution Architect / Tech Lead", "Анализирует трассировку вызовов, проверяет метрики точности LLM, правила SLA и Guardrails")

System(dispatcher_app, "AI-Диспетчер (Text2Business)", "Монолитное веб-приложение: прием сообщений, извлечение фактов, детерминированная диспетчеризация, расчёт SLA и регистрация заявок")

System_Ext(github_models, "GitHub Models API / Gemini API", "LLM инференс (gpt-4o, qwen3.6-27b, deepseek) с гарантией вывода в JSON Mode (Structured Output)")
System_Ext(telegram_api, "Telegram Bot API", "Серверная платформа Telegram для приема обновлений (Long Polling / Webhook) и отправки ответов")
System_Ext(erp_1c, "1С:Предприятие 8 / 1С:ERP", "Корпоративная ERP-система: получение и проведение документов 'ЗаявкаНаРемонт' по протоколу OData REST")

Rel(client, telegram_api, "Отправляет обращение в свободном формате", "HTTPS / Chat")
Rel(client, dispatcher_app, "Ввод через Web UI / Email / Voice / REST", "HTTPS / JSON")
Rel(telegram_api, dispatcher_app, "Передача обновлений бота (Long Polling / Webhook)", "HTTPS / JSON")

Rel(operator, dispatcher_app, "Интерактивный контроль (HITL Workbench), дозаполнение полей", "HTTPS / React UI")
Rel(tech_lead, dispatcher_app, "Анализ трассировки (Trace), логов, SLA матрицы и CRUD БД", "HTTPS / React UI")

Rel(dispatcher_app, github_models, "Запрос извлечения фактов с JSON Schema (Perception Core)", "HTTPS / Bearer JSON")
Rel(dispatcher_app, telegram_api, "Отправка сообщений и ответов клиенту в чат", "HTTPS / POST sendMessage")
Rel(dispatcher_app, erp_1c, "Синхронизация и проведение тикетов", "OData REST / JSON")

SHOW_LEGEND()
@enduml`,

    c2_current: `@startuml c2_container_current
!include <C4/C4_Container>
LAYOUT_TOP_DOWN()

title C2 — Container: Text2Business AI-Диспетчер (Текущая реализация / As-Is)

Person(client, "B2B Заявитель", "Email / Telegram / Voice")
Person(operator, "Диспетчер (HITL)", "Оператор системы")

System_Boundary(monolith_app, "Text2Business Full-Stack Container (Port 3000)") {
  Container(frontend_spa, "React SPA UI", "React 19, TypeScript, Vite, Tailwind CSS", "Одностраничное веб-приложение: Рабочее место HITL, Запуск пресетов, Инспектор БД, Логи/Трейсы, Архитектура")
  
  Container(express_server, "Express Web Server & API Gateway", "Node.js 20, Express, TypeScript (server.ts)", "Прием Webhooks (Telegram, Email, Telephony, REST), Long Polling цикл Telegram, HTTP роутинг, 1C OData эмулятор")
  
  Container(llm_perception, "LLM Perception Core Module", "TypeScript (\`server.ts\`)", "Формирование системного промпта, отправка JSON Schema, вызов GitHub Models / Gemini API или локальный Fallback")
  
  Container(dispatcher_engine, "Deterministic Dispatch Engine", "TypeScript (\`src/dispatcherEngine.ts\`)", "Детерминированный 8-шаговый пайплайн: Guardrails, поиск контрагента, дедупликация, расчет SLA и вызов Dry-Run")
  
  ContainerDb(in_memory_db, "In-Memory DB Store", "TypeScript Data Schema (\`src/mockDb.ts\`)", "Реляционное хранилище в ОЗУ: Контрагенты, Объекты, Оборудование, Договоры, Открытые/Закрытые заявки")
}

System_Ext(github_models, "GitHub Models / Gemini API", "Inference API")
System_Ext(telegram_api, "Telegram Bot API", "Bot Platform")
System_Ext(erp_1c, "1C:ERP OData Service", "1C Enterprise OData")

Rel(client, telegram_api, "Сообщение в бот", "HTTPS")
Rel(telegram_api, express_server, "Long Polling getUpdates / Webhook", "HTTPS / JSON")
Rel(client, express_server, "Прямые REST / Webhook запросы", "HTTP / JSON")

Rel(operator, frontend_spa, "Управление и утверждение тикетов", "HTTPS / Browser")
Rel(frontend_spa, express_server, "Внутренний REST API (\`/api/dispatch\`, \`/api/database\`, \`/api/operator/reply\`)", "HTTP / JSON")

Rel(express_server, llm_perception, "Передача неструктурированного текста", "In-Process Call")
Rel(llm_perception, github_models, "Запрос извлечения фактов (response_format: json_object)", "HTTPS / POST")
Rel(llm_perception, express_server, "Возврат структурированного JSON ExtractedFacts", "In-Process Return")

Rel(express_server, dispatcher_engine, "Запуск \`runDeterministicDispatch(db, facts, text)\`", "In-Process Call")
Rel(dispatcher_engine, in_memory_db, "Чтение справочников и поиск открытых заявок", "In-Process Memory Access")
Rel(express_server, in_memory_db, "Сохранение / Обновление тикетов", "In-Process Memory Write")

Rel(express_server, telegram_api, "Отправка ответа клиенту (\`sendTelegramMessage\`)", "HTTPS / POST")
Rel(express_server, erp_1c, "Экспорт документа ЗаявкаНаРемонт (\`/api/1c/tickets\`)", "OData REST / JSON")

SHOW_LEGEND()
@enduml`,

    c3_current: `@startuml c3_component_current
!include <C4/C4_Component>
LAYOUT_TOP_DOWN()

title C3 — Component: Text2Business AI-Диспетчер (Детализация модулей кода As-Is)

Container_Boundary(express_app, "Express Backend & Decision Engine (server.ts & dispatcherEngine.ts)") {
  Component(ingress_router, "Ingress Webhook Router", "Express Router (\`server.ts\`)", "Принимает входящие запросы \`/api/webhooks/dispatch\`, \`/api/webhooks/telegram\`, \`/api/webhooks/email\`, \`/api/webhooks/telephony\`")
  Component(telegram_poller, "Telegram Bot Manager", "Async Polling Loop (\`pollTelegramUpdates\`)", "Слушает сообщения Telegram через \`getUpdates\`, обрабатывает команды \`/start\`, \`/help\` и управляет отправкой ответов")
  Component(llm_service, "LLM Perception Service", "Async Extractor (\`extractFactsWithGemini\` / \`extractFactsWithGitHubModels\`)", "Формирует JSON Schema для \`gpt-4o\` / \`qwen\` / \`gemini\`, вызывает API с параметром \`json_object\`")
  Component(fallback_extractor, "Rule-Based Fallback Extractor", "Function (\`extractFactsFromText\`)", "Локальный эвристический парсер регулярных выражений, включающийся при отсутствии API-ключей")
  Component(guardrail_checker, "Guardrail Inspector", "Function (\`checkGuardrails\`)", "Проверяет входящий текст на промпт-инъекции, команды 'SYSTEM OVERRIDE', 'SET SLA' и попытки удаления БД")
  Component(site_lookup, "Customer & Site Lookup Tool", "Function (\`tool_find_customer_or_site\`)", "Выполняет нечеткий поиск контрагентов в базе по названию компании и адресу склада")
  Component(asset_disambiguator, "Asset Disambiguator & Matcher", "Function (\`tool_find_assets_and_open_tickets\`)", "Разрешает неоднозначности оборудования (например '17-я') путем сопоставления открытых заявок T-884 по объектам")
  Component(sla_calculator, "SLA & Penalty Calculator", "Function (\`tool_get_contract_and_sla\`)", "Рассчитывает дедлайны на основе тарифных планов (Gold: 60m 24x7, Silver: 240m, Standard: 480m) и штрафы")
  Component(decision_matrix, "Decision Core Matrix", "Function (\`runDeterministicDispatch\`)", "Принимает решение: \`CREATE_TICKET\`, \`UPDATE_TICKET\`, \`REQUEST_CLARIFICATION\`, \`ESCALATE_TO_HUMAN\`, \`REJECT\`")
  Component(odata_adapter, "1C:ERP OData Adapter", "Express Route (\`/api/1c/tickets\`)", "Преобразует тикеты из внутреннего формата в стандартный JSON/XML OData-контекст \`Document_ЗаявкаНаРемонт\`")
  Component(trace_collector, "Execution Trace Logger", "In-Memory Collector", "Замеряет задержки \`duration_ms\` каждого шага пайплайна и формирует Trace для UI")
  ComponentDb(db_manager, "In-Memory Repository Manager", "State Manager (\`INITIAL_DATABASE\` / \`mockDb\`)", "Предоставляет CRUD-операции к массивам \`contractors\`, \`sites\`, \`assets\`, \`contracts\`, \`open_tickets\`, \`closed_tickets\`")
}

Container_Boundary(frontend_app, "React SPA UI Components (src/components/)") {
  Component(landing_ui, "Landing Home", "React (\`LandingHome.tsx\`)", "Главная страница с интерактивным сетчатым фоном и 4 плитками навигации")
  Component(scenario_ui, "Scenario Runner", "React (\`ScenarioRunner.tsx\`)", "Панель быстрого запуска кейсов TC-01 ... TC-04 с хоткеем Ctrl+Enter")
  Component(hitl_ui, "Operator Console", "React (\`OperatorConsoleView.tsx\`)", "Рабочее место HITL-диспетчера: чат с ботом, укомплектование неполных тикетов, передача в 1С")
  Component(channels_ui, "Channels Config & STT", "React (\`ChannelsConfigView.tsx\`)", "Конфигуратор токенов, тест Web Speech API микрофона и Swagger REST API Sandbox")
  Component(db_ui, "Database Inspector", "React (\`DatabaseInspectorView.tsx\`)", "Таблицы контрагентов, объектов, оборудования, открытых/закрытых заявок с функциями CRUD")
  Component(logs_ui, "Logs & Traces View", "React (\`LogsTracesView.tsx\`)", "Визуализатор OpenTelemetry трейсов, задержек и дашбордов метрик")
}

Rel(ingress_router, llm_service, "Запрос извлечения фактов", "Async Call")
Rel(telegram_poller, llm_service, "Запрос извлечения фактов из чата", "Async Call")
Rel(llm_service, fallback_extractor, "Переключение при отсутствии токена / ошибке API", "Fallback Call")
Rel(ingress_router, decision_matrix, "Запуск диспетчеризации с извлеченными фактами", "Function Call")
Rel(telegram_poller, decision_matrix, "Запуск диспетчеризации с извлеченными фактами", "Function Call")
Rel(decision_matrix, guardrail_checker, "1. Проверка безопасности текста", "In-Process")
Rel(decision_matrix, site_lookup, "2. Поиск контрагента и объекта", "In-Process")
Rel(decision_matrix, asset_disambiguator, "3. Поиск оборудования и проверка открытых тикетов", "In-Process")
Rel(decision_matrix, sla_calculator, "4. Расчет SLA дедлайна по договору", "In-Process")
Rel(decision_matrix, trace_collector, "5. Фиксация задержек и параметров шагов", "In-Process")
Rel(decision_matrix, db_manager, "6. Чтение и сохранение состояния тикетов", "In-Memory Read/Write")
Rel(odata_adapter, db_manager, "Чтение открытых тикетов для экспорта в 1С", "In-Memory Read")
Rel(scenario_ui, ingress_router, "POST /api/dispatch", "HTTP / JSON")
Rel(hitl_ui, ingress_router, "POST /api/operator/reply, /api/commit-ticket", "HTTP / JSON")
Rel(channels_ui, ingress_router, "POST /api/telegram/config, /api/webhooks/telephony", "HTTP / JSON")
Rel(db_ui, db_manager, "GET /api/database, POST /api/database/reset", "HTTP / JSON")

SHOW_LEGEND()
@enduml`,

    deployment_current: `@startuml deployment_current
!include <C4/C4_Deployment>
LAYOUT_TOP_DOWN()

title Deployment — Схема развертывания Текущей системы (As-Is)

Deployment_Node(user_node, "Клиентские Устройства", "Браузер / Telegram App") {
  Deployment_Node(browser, "Веб-Браузер Диспетчера", "Chrome / Firefox / Edge") {
    Container(react_app, "React 19 SPA", "JavaScript / DOM", "Фронтенд консоли диспетчера и панелей навигации")
  }
  Deployment_Node(tg_mobile, "Мобильный клиент Telegram", "iOS / Android / Desktop") {
    Container(tg_app, "Telegram Messenger", "Native Client", "Интерфейс общения B2B заявителя")
  }
}

Deployment_Node(cloud_host, "Хост приложения (Cloud Run / Local Node Host)", "Linux Alpine / Docker Container") {
  Deployment_Node(docker_container, "Docker Контейнер (Port 3000)", "Node.js 20 Runtime") {
    Container(express_process, "Express Web Engine", "Node.js Process (dist/server.cjs)", "Сервер обработчик HTTP/HTTPS вебхуков и статичный Vite сервер")
    Container(engine_process, "Deterministic Dispatch Core", "In-Process TypeScript", "Модуль бизнес-логики, Guardrails и расчета SLA")
    ContainerDb(ram_db, "In-Memory Database Store", "Process RAM State (\`mockDb.ts\`)", "Оперативное хранилище JSON справочников и тикетов")
  }
}

Deployment_Node(ext_cloud, "Внешние Облачные Сервисы", "SaaS / PaaS APIs") {
  Deployment_Node(github_cloud, "GitHub Models Cloud", "Azure AI Inference") {
    System_Ext(github_api, "GitHub Models API", "gpt-4o, qwen, deepseek (HTTPS Port 443)")
  }
  Deployment_Node(telegram_cloud, "Telegram Cloud Infrastructure", "Telegram Servers") {
    System_Ext(tg_bot_api, "Telegram Bot API", "api.telegram.org (HTTPS Port 443)")
  }
  Deployment_Node(enterprise_1c, "Корпоративный Сервер 1С", "1С:Предприятие 8.3") {
    System_Ext(1c_odata, "1C:ERP OData Endpoint", "OData HTTP Service")
  }
}

Rel(browser, express_process, "Загрузка SPA и REST API вызовы (\`/api/*\`)", "HTTP/1.1 :3000")
Rel(tg_app, tg_bot_api, "Отправка сообщения в чат", "HTTPS :443")
Rel(tg_bot_api, express_process, "Long Polling (\`getUpdates\`) / Webhook", "HTTPS :443")
Rel(express_process, engine_process, "Прямой прямой вызов функций пайплайна", "In-Process Memory")
Rel(engine_process, ram_db, "Чтение и запись справочников", "In-Process RAM")
Rel(express_process, github_api, "Извлечение фактов JSON Mode (\`/chat/completions\`)", "HTTPS :443 / Bearer")
Rel(express_process, tg_bot_api, "Отправка ответа клиенту (\`sendMessage\`)", "HTTPS :443 / POST")
Rel(express_process, 1c_odata, "Экспорт ЗаявкиНаРемонт (\`/api/1c/tickets\`)", "HTTP / OData REST")

SHOW_LEGEND()
@enduml`,

    sequence_current: `@startuml sequence_current
title Sequence — Полный цикл сквозной обработки обращения в текущем монолите (As-Is)

autonumber
actor "B2B Клиент (СеверФуд)" as client
participant "Telegram Bot API" as tg_api
participant "Express Router\n(server.ts)" as server
participant "LLM Perception Core\n(extractFactsWithGitHubModels)" as llm_service
participant "GitHub Models API\n(gpt-4o / JSON Mode)" as github
participant "Deterministic Engine\n(dispatcherEngine.ts)" as engine
database "In-Memory Store\n(mockDb.ts)" as db
participant "React HITL Console\n(Operator UI)" as ui
participant "1С:ERP OData Adapter\n(/api/1c/tickets)" as erp

client -> tg_api: "Снова 17-я: температура уже +8 и растет..."
tg_api -> server: Long Polling getUpdates / POST /api/webhooks/telegram

group 1. Извлечение фактов (LLM Perception Phase)
    server -> llm_service: extractFactsWithGemini(text, 'telegram')
    llm_service -> github: POST /chat/completions (response_format: json_object)
    github --> llm_service: JSON: { customer_name: "СеверФуд", asset_code: "17-я", problem: "температура +8" }
    llm_service --> server: ExtractedFacts object (Confidence: 0.92)
end

group 2. Детерминированная диспетчеризация (Deterministic Rules Core)
    server -> engine: runDeterministicDispatch(mockDb, facts, text, channel, time)
    engine -> engine: checkGuardrails(text) [Проверка инъекций]
    engine -> db: tool_find_customer_or_site("СеверФуд")
    db --> engine: Found sites: [S-MSK-01 (Москва), S-EKB-02 (Екатеринбург)]
    
    note over engine: Разрешение неоднозначности адреса (TC-02):\nПоиск открытых заявок по коду "17-я" (ХУ-17)
    engine -> db: tool_find_assets_and_open_tickets("A-1001")
    db --> engine: Found Open Ticket T-884 on site S-MSK-01
    
    engine -> db: tool_get_contract_and_sla("S-MSK-01")
    db --> engine: Contract: Gold Plan (60m SLA, 24x7)
    
    note over engine: Decision Matrix Decision:\n• Action: UPDATE_TICKET (T-884)\n• Priority: CRITICAL\n• Status: REQUIRES_HUMAN_CONFIRMATION
    engine --> server: ProcessingResult + ExecutionTrace
end

group 3. Исполнение и Доставка ответов (Execution Phase)
    server -> db: saveOrUpdateTicketInDb() [Обновление T-884 и запись сообщений]
    server -> tg_api: sendTelegramMessage(chat_id, "Заявка T-884 переведена в статус CRITICAL...")
    tg_api --> client: Доставка ответа в чат Telegram
end

group 4. Human-in-the-Loop & 1C Sync
    server -> ui: WebSocket/Polling Обновление статуса (Красная плашка HITL)
    ui -> server: Диспетчер нажимает "Утвердить и перенести в 1С"
    server -> erp: GET/POST /api/1c/tickets
    erp --> server: 200 OK (OData Document_ЗаявкаНаРемонт)
end

@enduml`,

    er_current: `@startuml er_diagram_current
title ER Diagram — Схема данных текущей версии (In-Memory Database / mockDb)

entity "Contractor (Контрагенты)" as contractor {
  * customer_id : string <<PK>>
  --
  name : string
  inn : string
  contact_phone : string
  contact_email : string
  contract_number : string
  status : ACTIVE | BLOCKED
}

entity "Site (Объекты / Склады)" as site {
  * site_id : string <<PK>>
  --
  * customer_id : string <<FK>>
  customer_name : string
  address : string
  contact_person : string
  timezone : string
  region : string
}

entity "Asset (Оборудование)" as asset {
  * asset_id : string <<PK>>
  --
  * site_id : string <<FK>>
  local_code : string  ' e.g. "ХУ-17"
  name : string
  criticality : LOW | MEDIUM | HIGH | CRITICAL
  status : OK | WARNING | CRITICAL_FAIL
}

entity "Contract (Договоры & SLA)" as contract {
  * site_id : string <<PK, FK>>
  --
  plan : Gold | Silver | Standard
  sla_minutes : number
  working_hours : string
  penalty_per_hour : string
  active : boolean
}

entity "Ticket (Сервисные Заявки)" as ticket {
  * ticket_id : string <<PK>>
  --
  * customer_id : string <<FK>>
  * site_id : string <<FK>>
  * asset_id : string <<FK>>
  priority : low | medium | high | critical
  summary : string
  description : string
  sla_deadline : string
  assigned_group : string
  status : NEW | IN_PROGRESS | WAITING_DISPATCHER | RESOLVED | CLOSED
  created_at : string
  updated_at : string
  channel : email | telegram | voice | portal
  chat_id : string | number
  missing_fields : string[]
}

entity "TicketMessage (История чата)" as message {
  * id : string <<PK>>
  --
  * ticket_id : string <<FK>>
  sender : client | bot | operator
  author_name : string
  text : string
  timestamp : string
  channel : string
}

entity "TicketHistory (Журнал аудита)" as history {
  * id : string <<PK>>
  --
  * ticket_id : string <<FK>>
  timestamp : string
  note : string
  author : string
}

contractor ||..o{ site : "обслуживает объекты"
site ||..o{ asset : "содержит оборудование"
site ||..|| contract : "имеет SLA договор"
contractor ||..o{ ticket : "заказчик тикета"
site ||..o{ ticket : "локация инцидента"
asset ||..o{ ticket : "ассет в аварии"
ticket ||..o{ message : "содержит диалог"
ticket ||..o{ history : "фиксирует историю"

@enduml`,

    api_current: `@startuml api_routes_current
!include <C4/C4_Component>
LAYOUT_TOP_DOWN()

title API Architecture — Карта REST & Webhook эндпоинтов текущей системы (server.ts)

Container_Boundary(express_app, "Express Server Endpoint Map (Port 3000)") {
  Component(ep_health, "GET /api/health", "Healthcheck Endpoint", "Возвращает статус сервера, статус подключения Gemini, Telegram и список доступных эндпоинтов")
  Component(ep_dispatch, "POST & GET /api/webhooks/dispatch", "Swagger & Dispatcher Webhook", "Основной эндпоинт ручной и авто-диспетчеризации обращений. Запускает LLM Perception + Engine")
  Component(ep_tg_webhook, "POST & GET /api/webhooks/telegram", "Telegram Bot Webhook", "Принимает входящие апдейты Telegram, обрабатывает /start и отправляет ответы обратно в чат")
  Component(ep_email_webhook, "POST & GET /api/webhooks/email", "Email IMAP Webhook", "Принимает письма (from, subject, body), регистрирует тикет и дублирует нотификацию в Telegram")
  Component(ep_voice_webhook, "POST & GET /api/webhooks/telephony", "Voice STT Webhook", "Принимает расшифровки звонков (caller_number, transcript), проводит анализ и создает тикет")
  Component(ep_tg_config, "POST /api/telegram/config", "Telegram Config Endpoint", "Проверяет токен через \`getMe\`, удаляет вебхуки и активирует Long Polling цикл")
  Component(ep_llm_config, "POST & GET /api/llm/config", "GitHub Models Config", "Устанавливает GITHUB_MODELS_TOKEN и переключает модель (gpt-4o, qwen3.6-27b, deepseek)")
  Component(ep_operator_reply, "POST /api/operator/reply", "HITL Dispatcher Reply", "Сохраняет ответ диспетчера в историю тикета и отправляет прямое сообщение клиенту в Telegram")
  Component(ep_commit_ticket, "POST /api/commit-ticket", "Live Commit Endpoint", "Сохраняет утвержденную заявку из режима Dry-Run в реальную БД")
  Component(ep_database, "GET & POST /api/database & /reset", "Database CRUD & Reset", "Возвращает текущую БД, перезаписывает состояние или сбрасывает к дефолтным 4 кейсам")
  Component(ep_1c_odata, "GET & POST /api/1c/tickets", "1C:ERP OData Sync", "Возвращает тикеты в формате 1C OData JSON/XML контекста \`Document_ЗаявкаНаРемонт\`")
}

SHOW_LEGEND()
@enduml`,

    // Target To-Be
    c1_target: `@startuml c1_context_target
!include <C4/C4_Context>
LAYOUT_TOP_DOWN()

title C1 — System Context: Text2Business AI-Платформа (Целевая архитектура / To-Be)

Person(client, "B2B Клиент / Заявитель", "Отправляет обращения через Telegram, Email, Голосовые вызовы (SIP), Веб-Портал или REST API")
Person(operator, "Диспетчер-Оператор (HITL)", "Контролирует неопределенности, утверждает действия при рисках и ведет диалог с клиентом")
Person(tech_lead, "AI Tech Lead / SRE Инженер", "Мониторит дрейф моделей (Model Drift), задержки P99, OpenTelemetry трейсы и метрики SLA в Arize AI")

System(target_platform, "Text2Business Enterprise Platform", "Событийно-ориентированная платформа диспетчеризации: Envoy Ingress, Kafka, STT, AI LangGraph, Go Temporal, Postgres 18")

System_Ext(telegram_cloud, "Telegram Bot API", "Мессенджер-платформа (Webhook Ingress)")
System_Ext(sip_pbx, "Виртуальная АТС / SIP Trunk", "Телефонная сеть и аудиопотоки RTP / gRPC")
System_Ext(email_mcp, "Corporate Email / MCP Gateway", "IMAP/SMTP шлюз корпоративной почты")
System_Ext(ai_inference, "GitHub Models / Azure AI / Local vLLM", "Провайдеры LLM моделей (gpt-4o, qwen3.6-27b, deepseek) с поддержкой JSON Mode")
System_Ext(erp_1c, "1С:ERP Предприятие 8.3", "Корпоративная ERP система (OData REST)")
System_Ext(arize_observability, "Arize AI / OpenTelemetry", "Платформа мониторинга галлюцинаций и задержек AI")

Rel(client, target_platform, "Отправляет обращения", "Telegram / Email / Voice / Portal")
Rel(target_platform, client, "Уведомления и подтверждения", "Telegram / Email")
Rel(operator, target_platform, "Утверждает и дополняет заявки (HITL)", "WSS / HTTPS")
Rel(tech_lead, arize_observability, "Анализирует качество LLM", "HTTPS")

Rel(target_platform, telegram_cloud, "Приём / Отправка сообщений", "HTTPS Webhooks")
Rel(target_platform, sip_pbx, "Приём аудиопотока", "RTP / gRPC")
Rel(target_platform, email_mcp, "Забирает письма", "IMAP / REST")
Rel(target_platform, ai_inference, "Вызовы извлечения фактов", "HTTPS / JSON")
Rel(target_platform, erp_1c, "Проведение документов", "OData REST")
Rel(target_platform, arize_observability, "Экспорт OTel спанов", "OTLP gRPC")

SHOW_LEGEND()
@enduml`,

    c2_target: `@startuml c2_container_target
!include <C4/C4_Container>
LAYOUT_TOP_DOWN()

title C2 — Container: Архитектура контейнеров Целевой платформы (To-Be)

Person(client, "B2B Клиент", "Заявитель")
Person(operator, "Диспетчер (HITL)", "Оператор консоли")

System_Boundary(platform_boundary, "Text2Business Target Platform") {
  Container(envoy, "Envoy Ingress Gateway", "Envoy / C++", "TLS Termination, Rate Limiting, API Routing")
  Container(kafka, "Event Bus (Kafka)", "Apache Kafka Strimzi", "Шина асинхронных событий обращений")
  Container(stt_service, "Service 1: Speech-to-Text", "Go / Yandex SpeechKit", "Обработка и транскрипция аудиопотоков")
  Container(ai_service, "Service 2: Perception AI", "Python / LangGraph", "Извлечение фактов, Guardrails & RAG")
  Container(core_engine, "Service 3: Core Engine", "Go / Temporal.io", "Оркестрация процессов, HITL Диспетчер, SLA")
  Container(frontend, "React SPA Console", "React 19 + TypeScript", "Консоль Диспетчера")
  ContainerDb(postgres, "Enterprise DB & Vector Store", "PostgreSQL 18 + pgvector", "Тикеты, векторные эмбеддинги, кэш")
}

System_Ext(erp_1c, "1С:ERP Предприятие", "OData Interface")
System_Ext(arize, "Arize AI", "Observability")

Rel(client, envoy, "Отправляет обращения", "HTTPS / WSS / gRPC")
Rel(operator, frontend, "Использует Workbench", "HTTPS")
Rel(frontend, envoy, "API Запросы & Signal WSS", "WSS / REST")
Rel(envoy, kafka, "Издает события", "AMQP / gRPC")
Rel(kafka, stt_service, "Аудио события", "Kafka Consumer")
Rel(kafka, ai_service, "Текстовые события", "Kafka Consumer")
Rel(stt_service, kafka, "Транскрипты", "Kafka Producer")
Rel(ai_service, kafka, "Извлеченные факты", "Kafka Producer")
Rel(kafka, core_engine, "Факты обращений", "Kafka Consumer")
Rel(core_engine, postgres, "Сохраняет состояние", "TCP :5432")
Rel(ai_service, postgres, "Vector Search (RAG)", "TCP :5432")
Rel(core_engine, erp_1c, "Проведение документов", "OData REST")
Rel(core_engine, arize, "Метрики и спаны", "OTLP gRPC")

SHOW_LEGEND()
@enduml`,

    c3_target: `@startuml c3_component_target
!include <C4/C4_Component>
LAYOUT_TOP_DOWN()

title C3 — Component: Сервисы AI и Движка решений (Целевое состояние To-Be)

Container_Boundary(ai_service_boundary, "Service 2: Perception & AI Engine (Python / LangGraph)") {
  Component(agent_orchestrator, "LangGraph Agent Orchestrator", "Python Class", "Управляет графом агентов ReAct, логикой повторных попыток и выбора моделей")
  Component(fact_extractor, "Fact Extractor Agent", "Python Agent + Instructor", "Извлекает структурированные сущности (Клиент, Адрес, Ассет, Проблема, Дедлайн)")
  Component(schema_validator, "Pydantic Schema Validator", "Pydantic v2", "Валидирует структуры данных на соответствие \`ExtractedFacts\` схеме")
  Component(rag_retriever, "RAG Knowledge Retriever", "LangChain / pgvector", "Ищет паспорта оборудования и историю инцидентов в PostgreSQL 18 (\`pgvector\`)")
  Component(prompt_guardrail, "Prompt Guardrail Filter", "NeMo Guardrails / Llama Guard", "Блокирует попытки Prompt Injection, Jailbreak и несанкционированные изменения SLA")
}

Container_Boundary(core_engine_boundary, "Service 3: Core Decision Engine (Go / Temporal.io Engine)") {
  Component(workflow_worker, "Dispatch Temporal Workflow Worker", "Go Temporal SDK", "Управляет долгоживущими рабочими процессами (Saga Pattern) обработками заявок")
  Component(act_guardrail, "Guardrail Verification Activity", "Go Activity", "Выполняет жесткую серверную проверку правил безопасности")
  Component(act_db_lookup, "Database Enrichment Activity", "Go Activity", "Выполняет поиск клиентов, складов и договоров в репозитории")
  Component(act_disambiguation, "Asset Disambiguator Activity", "Go Activity", "Разрешает конфликты локаций на основе анализа открытых заявок по кодам оборудования")
  Component(act_sla_calc, "Business Hours SLA Calculator", "Go Activity", "Рассчитывает дедлайн с учетом часовых поясов, рабочих окон (09:00-18:00) и штрафных санкций")
  Component(act_hitl_pause, "HITL Pause & Resume Signal Activity", "Go Activity Signal", "Ставит workflow на паузу при \`Confidence < 0.85\` и ожидает Signal от диспетчера")
  Component(act_1c_commit, "1C ERP Commit Activity", "Go Activity", "Формирует запрос на проведение документа ЗаявкаНаРемонт в 1С:ERP")
}

ContainerDb(postgres, "PostgreSQL 18 + pgvector", "Database")
System_Ext(1c_erp, "1С:ERP", "OData Interface")
System_Ext(llm_cloud, "GitHub Models / vLLM", "LLM APIs")

Rel(agent_orchestrator, prompt_guardrail, "1. Фильтрация текста", "In-Process")
Rel(agent_orchestrator, fact_extractor, "2. Извлечение фактов", "In-Process")
Rel(fact_extractor, llm_cloud, "Запрос к LLM c Pydantic Схемой", "HTTPS / JSON")
Rel(fact_extractor, schema_validator, "3. Валидация вывода", "In-Process")
Rel(agent_orchestrator, rag_retriever, "4. Векторный поиск RAG", "In-Process")
Rel(rag_retriever, postgres, "Поиск схожих эмбеддингов", "SQL / pgvector")

SHOW_LEGEND()
@enduml`,
    deployment_target: `@startuml deployment_target
!include <C4/C4_Deployment>
LAYOUT_TOP_DOWN()

title Deployment — Схема развертывания Целевой системы (To-Be / Kubernetes Cluster)

Deployment_Node(clients, "Внешний контур заявителей", "Заказчики и Операторы") {
  Container(browser_ui, "React Operator Workbench", "React 19 SPA", "Интерфейс оператора HITL c WebSockets")
  Container(tg_cloud, "Telegram App", "iOS / Android / Desktop", "Мессенджер клиентов")
  Container(sip_caller, "IP Телефония / PBX", "SIP / RTP Audio Stream", "Голосовые вызовы клиентов")
}

Deployment_Node(k8s_cluster, "Enterprise Kubernetes Cluster (Production K8s)", "Multi-AZ Cloud / On-Prem High Availability") {
  Deployment_Node(ingress_ns, "Namespace: ingress-layer", "Ingress Infrastructure") {
    Container(envoy_pods, "Envoy Gateway Pods", "Envoy / C++ (3 Replicas)", "TLS 1.3 Termination, Rate Limiting, Webhook Ingress, gRPC Proxy")
  }
  Deployment_Node(event_ns, "Namespace: event-streaming", "Kafka Strimzi Operator") {
    ContainerDb(kafka_cluster, "Kafka Brokers Cluster", "Apache Kafka (3 Nodes StatefulSet)", "Шина событий: \`InboundMessages\`, \`SpeechChunks\`, \`FactsExtracted\`")
    ContainerDb(zookeeper, "KRaft / Zookeeper", "Quorum StatefulSet", "Консенсус кластера Kafka")
  }
  Deployment_Node(services_ns, "Namespace: core-services", "Microservices Workloads") {
    Container(stt_pods, "STT Service Pods", "Go / Python (2 Replicas)", "Обработка аудиопотоков и взаимодействие с Yandex SpeechKit")
    Container(ai_pods, "AI Perception Pods (GPU Nodes)", "Python FastAPI / LangGraph (NVIDIA CUDA)", "Мультиагентный анализ, извлечение фактов и валидация Pydantic")
    Container(temporal_pods, "Temporal.io Cluster Pods", "Temporal Server + History/Matching", "Оркестрация состояния бизнес-процессов (Sagas)")
    Container(core_worker_pods, "Core Decision Workers", "Go Temporal Workers (4 Replicas)", "Детерминированные правила, расчет SLA и вызовы 1С")
    Container(adapter_1c_pods, "1C OData Adapter Pods", "Go Service (2 Replicas)", "Двусторонняя синхронизация документов с 1С:Предприятие")
  }
  Deployment_Node(db_ns, "Namespace: database-layer", "HA Storage Cluster") {
    ContainerDb(postgres_ha, "PostgreSQL 18 HA Cluster", "Patroni / PgBouncer (Primary + 2 Replicas)", "Реляционные тикеты, справочники и pgvector эмбеддинги")
    ContainerDb(redis_cluster, "Redis Cluster", "Redis 7 Sentinel", "Кэширование сессий, лимиты и блокировки (Distributed Locks)")
  }
  Deployment_Node(obs_ns, "Namespace: observability", "Telemetry Infrastructure") {
    Container(otel_pods, "OpenTelemetry Collector Pods", "OTel DaemonSet", "Сбор спанов, метрик задержек и отправка в Arize AI")
  }
}

Deployment_Node(ext_saas, "Внешние SaaS & Enterprise Системы", "Cloud & On-Prem") {
  System_Ext(yandex_stt, "Yandex SpeechKit v3 API", "gRPC Cloud STT")
  System_Ext(llm_cloud, "GitHub Models / Azure AI / vLLM", "LLM Inference APIs")
  System_Ext(1c_server, "1С:ERP Предприятие 8.3", "1C OData REST Server")
  System_Ext(arize_cloud, "Arize AI Observability Platform", "LLM Monitoring SaaS")
}

Rel(browser_ui, envoy_pods, "HTTPS / WSS (Port 443)", "TLS 1.3")
Rel(tg_cloud, envoy_pods, "Telegram Webhooks", "HTTPS :443")
Rel(sip_caller, envoy_pods, "Голосовой поток", "gRPC / RTP")
Rel(envoy_pods, kafka_cluster, "Публикация событий в топики", "Kafka Protocol :9092")
Rel(kafka_cluster, stt_pods, "Чтение аудио событий", "Kafka Consumer")
Rel(stt_pods, yandex_stt, "Потоковая транскрипция речи", "gRPC Streaming :443")
Rel(kafka_cluster, ai_pods, "Чтение текстовых обращений", "Kafka Consumer")
Rel(ai_pods, llm_cloud, "Запрос извлечения фактов (JSON Mode)", "HTTPS :443 / gRPC")
Rel(ai_pods, postgres_ha, "RAG векторный поиск", "TCP :5432 (pgvector)")
Rel(kafka_cluster, core_worker_pods, "Чтение извлеченных фактов", "Kafka Consumer")
Rel(core_worker_pods, temporal_pods, "Регистрация Workflows & Activities", "gRPC :7233")
Rel(core_worker_pods, postgres_ha, "Сохранение состояния процессов", "TCP :5432")
Rel(core_worker_pods, adapter_1c_pods, "Вызов проведения в 1С", "gRPC Internal")
Rel(adapter_1c_pods, 1c_server, "Проведение ЗаявкиНаРемонт", "OData REST / HTTPS")
Rel(ai_pods, otel_pods, "Отправка спанов LLM", "OTLP gRPC :4317")
Rel(core_worker_pods, otel_pods, "Отправка спанов Workflows", "OTLP gRPC :4317")
Rel(otel_pods, arize_cloud, "Экспорт телеметрии", "OTLP / HTTPS")

SHOW_LEGEND()
@endl`,

    er_target: `@startuml er_diagram_target
title ER Diagram — Промышленная схема данных PostgreSQL 18 + pgvector (To-Be)

entity "contractors (Контрагенты)" as contractor {
  * id : uuid <<PK>>
  --
  name : varchar(255)
  inn : varchar(12) <<UNIQUE>>
  kpp : varchar(9)
  contact_phone : varchar(30)
  contact_email : varchar(100)
  contract_number : varchar(50)
  status : varchar(20) ' ACTIVE | BLOCKED
  created_at : timestamptz
  updated_at : timestamptz
}

entity "sites (Объекты / Склады)" as site {
  * id : uuid <<PK>>
  --
  * contractor_id : uuid <<FK>>
  name : varchar(255)
  address : text
  geo_point : point ' Координаты склада
  contact_person : varchar(255)
  timezone : varchar(50) ' Europe/Moscow
  region : varchar(100)
  created_at : timestamptz
}

entity "assets (Оборудование & RAG)" as asset {
  * id : uuid <<PK>>
  --
  * site_id : uuid <<FK>>
  local_code : varchar(50) ' e.g. "ХУ-17"
  name : varchar(255)
  serial_number : varchar(100)
  name_embedding : vector(1536) ' pgvector для семантического поиска
  criticality : varchar(20) ' LOW | MEDIUM | HIGH | CRITICAL
  status : varchar(20) ' OK | WARNING | CRITICAL_FAIL
  created_at : timestamptz
}

entity "contracts (Договоры & SLA)" as contract {
  * id : uuid <<PK>>
  --
  * site_id : uuid <<FK, UNIQUE>>
  plan_type : varchar(20) ' Gold | Silver | Standard
  sla_response_minutes : integer
  service_window_cron : varchar(50) ' 24x7 / 09:00-18:00
  penalty_rate_hourly : numeric(10,2)
  is_active : boolean
}

entity "tickets (Сервисные Заявки)" as ticket {
  * id : uuid <<PK>>
  --
  ticket_number : varchar(50) <<UNIQUE>>
  * contractor_id : uuid <<FK>>
  * site_id : uuid <<FK>>
  * asset_id : uuid <<FK>>
  temporal_workflow_id : varchar(100) <<INDEX>>
  priority : varchar(20) ' LOW | MEDIUM | HIGH | CRITICAL
  summary : text
  description : text
  sla_deadline : timestamptz
  assigned_group : varchar(100)
  status : varchar(30) ' NEW | IN_PROGRESS | WAITING_DISPATCHER | RESOLVED | CLOSED
  confidence_score : numeric(3,2)
  created_at : timestamptz
  updated_at : timestamptz
}

entity "ticket_messages (История сообщений)" as message {
  * id : uuid <<PK>>
  --
  * ticket_id : uuid <<FK>>
  channel : varchar(30) ' telegram | email | voice | portal
  sender_type : varchar(20) ' client | bot | operator
  sender_name : varchar(100)
  text_content : text
  raw_payload : jsonb ' Полный сырой JSON входящего вебхука
  created_at : timestamptz
}

entity "ticket_audit_log (Журнал аудита)" as audit {
  * id : uuid <<PK>>
  --
  * ticket_id : uuid <<FK>>
  action : varchar(50)
  actor : varchar(100)
  details_json : jsonb
  timestamp : timestamptz
}

entity "rag_documents (Паспорта и Инструкции)" as rag_doc {
  * id : uuid <<PK>>
  --
  * asset_id : uuid <<FK>>
  doc_title : varchar(255)
  content_chunk : text
  embedding : vector(1536) ' pgvector индекс
  created_at : timestamptz
}

entity "llm_trace_metrics (Метрики LLM & OTel)" as llm_trace {
  * id : uuid <<PK>>
  --
  * ticket_id : uuid <<FK>>
  trace_id : varchar(100)
  model_name : varchar(50)
  prompt_tokens : integer
  completion_tokens : integer
  latency_ms : integer
  cost_usd : numeric(8,6)
  hallucination_score : numeric(3,2)
  created_at : timestamptz
}

contractor ||..o{ site : "имеет объекты"
site ||..o{ asset : "содержит оборудование"
site ||..|| contract : "имеет SLA контракт"
contractor ||..o{ ticket : "заказчик"
site ||..o{ ticket : "локация"
asset ||..o{ ticket : "ассет в инциденте"
ticket ||..o{ message : "история переписки"
ticket ||..o{ audit : "аудит транзакций"
ticket ||..o{ llm_trace : "телеметрия AI"
asset ||..o{ rag_doc : "документация RAG"

@enduml`,

    api_target: `@startuml api_routes_target
!include <C4/C4_Component>
LAYOUT_TOP_DOWN()

title API Architecture — Карта целевых интерфейсов и микросервисных API (To-Be)

Container_Boundary(envoy_ingress, "Envoy Ingress Gateway (Public & Integration APIs)") {
  Component(api_tg_webhook, "POST /v2/webhooks/telegram", "Telegram Ingress", "Принимает входящие события от Telegram Bot API")
  Component(api_email_mcp, "POST /v2/webhooks/email", "Email MCP Ingress", "Принимает письма от корпоративного почтового IMAP/MCP шлюза")
  Component(api_sip_grpc, "gRPC StreamAudio", "Telephony gRPC Ingress", "Потоковый приём RTP/SIP аудио от виртуальной АТС")
  Component(api_rest_dispatch, "POST /v2/dispatch/submit", "Public Dispatch API", "REST эндпоинт для внешних партнерских систем и личного кабинета")
  Component(api_operator_ws, "WSS & REST /v2/operator/*", "Operator Workbench API", "WebSocket каналы и REST методы для HITL консоли диспетчера")
}

Container_Boundary(microservices_api, "Internal Microservices Interfaces (gRPC & Temporal)") {
  Component(stt_grpc, "gRPC /stt.v1.SpeechService", "STT Microservice", "Внутренний gRPC сервис транскрипции аудиопотоков")
  Component(perception_grpc, "gRPC /perception.v1.FactExtractor", "AI Microservice", "Внутренний gRPC сервис извлечения фактов (Python LangGraph)")
  Component(temporal_grpc, "gRPC :7233 Temporal Service", "Temporal State Engine", "Интерфейс запуска и передачи сигналов (Signals) в Temporal Workflows")
  Component(adapter_1c_rest, "REST /1c/odata/v2/Document_ЗаявкаНаРемонт", "1C OData Enterprise Adapter", "Двусторонняя синхронизация тикетов с 1С:Предприятие 8.3")
  Component(otlp_grpc, "gRPC :4317 OTLP Metrics Exporter", "OpenTelemetry Collector", "Сбор телеметрии задержек и метрик качества нейросетей в Arize AI")
}

SHOW_LEGEND()
@enduml`,

    eda_target: `@startuml Target_Architecture
!include <C4/C4_Container>
LAYOUT_TOP_DOWN()

title Целевая Событийная Архитектура AI-Диспетчера (Target Event-Driven Architecture)

System_Boundary(ingress, "Ingress Layer") {
  Container(gateway, "ОМНИКАНАЛЬНЫЙ INGRESS GATEWAY", "Envoy Gateway", "TLS Termination, Rate Limiting, Telegram/Email/SIP/REST Ingress")
}

System_Boundary(event_bus, "Event Streaming Layer") {
  ContainerDb(kafka, "KAFKA / RABBITMQ EVENT BUS", "Apache Kafka / RabbitMQ", "Асинхронная шина событий и буферизация обращений")
}

System_Boundary(microservices, "Core Services Layer") {
  Container(stt, "SERVICE 1: STT & SPEECH", "Yandex SpeechKit / Mochi", "Потоковая транскрипция аудио и звонков")
  Container(ai_service, "SERVICE 2: PERCEPTION & AI", "Python / LangGraph + vLLM / GitHub Models", "Мультиагентный анализ и извлечение фактов")
  Container(core_engine, "SERVICE 3: CORE DECISION ENGINE", "Go / Temporal.io State Engine", "Оркестрация процессов, HITL Диспетчер, правила проведения")
}

System_Boundary(data_layer, "Data Layer & Observability") {
  ContainerDb(postgres, "PostgreSQL 18 + pgvector + Redis", "PostgreSQL / Redis", "Реляционные заявки, векторные эмбеддинги, кэш сессий")
  Container(arize, "Arize AI (OTel Metrics)", "OpenTelemetry / Arize AI", "Трейсинг и мониторинг качества LLM")
  Container(adapter_1c, "1C:ERP OData Enterprise Adapter", "OData REST Protocol", "Двусторонняя синхронизация с 1С:Предприятие")
}

Rel(gateway, kafka, "Издает события обращений", "gRPC / AMQP")
Rel(kafka, stt, "События аудиопотока", "Event Stream")
Rel(kafka, ai_service, "События текстовых обращений", "Event Stream")
Rel(stt, core_engine, "Транскрипты", "Event Stream")
Rel(ai_service, core_engine, "Извлеченные факты (JSON)", "Event Stream")
Rel(kafka, core_engine, "Прямые события диспетчеризации", "Event Stream")
Rel(core_engine, postgres, "Сохранение состояния и заявок", "TCP 5432")
Rel(core_engine, arize, "Метрики и трейсы", "OTLP gRPC")
Rel(core_engine, adapter_1c, "Проведение документов", "OData REST")

SHOW_LEGEND()
@enduml`,

    sequence_target: `@startuml Sequence_Target
title Sequence — Целевой асинхронный поток обработки заявки (Target / To-Be)

actor "Клиент (ООО СеверФуд)" as client
participant "Envoy Ingress Gateway" as gateway
database "Kafka Event Bus" as kafka
participant "AI Service (LangGraph)" as ai
participant "Go / Temporal Engine" as temporal
database "PostgreSQL 18 + pgvector" as db
participant "1С:ERP OData Adapter" as erp
participant "HITL Консоль Диспетчера" as ui

client -> gateway: POST /v1/ingress/telegram { text: "Срочно сломался компрессор ХУ-17" }
gateway -> kafka: Publish Event ingress.messages.v1
kafka -> ai: Consume ingress.messages.v1
ai -> ai: Extracted facts via LangGraph + JSON Mode
ai -> kafka: Publish Event ai.extracted_facts.v1

kafka -> temporal: Consume ai.extracted_facts.v1
temporal -> temporal: Start Workflow TicketDispatchWorkflow
temporal -> db: Match Customer & Asset via Vector Search
db --> temporal: Customer Match (Gold SLA)

alt High Confidence (>= 0.85)
    temporal -> db: Save Ticket (AUTO_REGISTERED)
    temporal -> erp: POST /api/1c/tickets (OData)
    erp --> temporal: Document_Ref "№ЗР-00042"
    temporal --> client: Async Notification "Заявка №ЗР-00042 создана"
else Low Confidence (< 0.85)
    temporal -> db: Save Ticket (WAITING_DISPATCHER)
    temporal -> ui: Signal HITL Pause
    ui -> ui: Operator completes facts
    ui -> temporal: Signal Resume Workflow
    temporal -> erp: POST /api/1c/tickets
    erp --> temporal: Document_Ref "№ЗР-00042"
end
@endl`,
  };

  const adrList = [
    {
      id: 'ADR-000',
      title: 'Дорожная карта перехода As-Is -> To-Be',
      status: 'Принято',
      date: '2026-08-02',
      summary: '4 фазы миграции монолита на PostgreSQL 18, Kafka, Python LangGraph AI и Go Temporal.io.',
      tags: ['Kafka', 'Temporal.io', 'PostgreSQL', 'LangGraph', '1C OData'],
      file: '/architecture/adr/adr-000-roadmap-as-is-to-be.md',
    },
    {
      id: 'ADR-001',
      title: 'Стандартизация на Structured Output (JSON Mode)',
      status: 'Принято',
      date: '2026-06-30',
      summary: 'Строгое извлечение фактов из текста обращений через JSON Schema и response_format: json_object.',
      tags: ['LLM', 'JSON Schema', 'Structured Data'],
      file: '/architecture/adr/adr-001-structured-output.md',
    },
    {
      id: 'ADR-002',
      title: 'MVP Scope и Контур Интеграции 1С:Предприятие',
      status: 'Принято',
      date: '2026-06-30',
      summary: 'Поддержка каналов Telegram, Email, Telephony, REST с операторской HITL-консолью и 1С OData API.',
      tags: ['MVP', '1C:ERP', 'HITL', 'Webhooks'],
      file: '/architecture/adr/adr-002-mvp-scope.md',
    },
    {
      id: 'ADR-003',
      title: 'Go / Temporal.io для Core Decision Engine',
      status: 'Принято',
      date: '2026-06-30',
      summary: 'Оркестрация распределенных транзакций (Saga Pattern) и длинных пауз ожидания действий диспетчера.',
      tags: ['Go', 'Temporal.io', 'State Machine'],
      file: '/architecture/adr/adr-003-go-temporal-engine.md',
    },
    {
      id: 'ADR-005',
      title: 'Роутер Выбора Моделей (GitHub Models / Gemini / vLLM)',
      status: 'Принято',
      date: '2026-06-30',
      summary: 'Динамическое переключение gpt-4o, qwen3.6-27b, gemma4:e4b, deepseek-reasoner, nemotron при наличии токена.',
      tags: ['GitHub Models', 'gpt-4o', 'DeepSeek', 'Qwen'],
      file: '/architecture/adr/adr-005-multi-provider-ai.md',
    },
  ];

  const getActivePumlCode = () => {
    if (mainMode === 'as_is') {
      if (selectedPuml === 'c1') return plantUmlCodes.c1_current;
      if (selectedPuml === 'c2') return plantUmlCodes.c2_current;
      if (selectedPuml === 'c3') return plantUmlCodes.c3_current;
      if (selectedPuml === 'deployment') return plantUmlCodes.deployment_current;
      if (selectedPuml === 'sequence') return plantUmlCodes.sequence_current;
      if (selectedPuml === 'er') return plantUmlCodes.er_current;
      if (selectedPuml === 'api') return plantUmlCodes.api_current;
      return plantUmlCodes.c1_current;
    } else {
      if (selectedPuml === 'eda') return plantUmlCodes.eda_target;
      if (selectedPuml === 'c1') return plantUmlCodes.c1_target;
      if (selectedPuml === 'c2') return plantUmlCodes.c2_target;
      if (selectedPuml === 'c3') return plantUmlCodes.c3_target;
      if (selectedPuml === 'deployment') return plantUmlCodes.deployment_target;
      if (selectedPuml === 'sequence') return plantUmlCodes.sequence_target;
      if (selectedPuml === 'er') return plantUmlCodes.er_target;
      if (selectedPuml === 'api') return plantUmlCodes.api_target;
      return plantUmlCodes.eda_target;
    }
  };

  // Kroki PlantUML Image URL Generator
  const getKrokiUrl = (pumlText: string) => {
    // Basic encode for Kroki API endpoint
    try {
      const encoded = encodeURIComponent(pumlText);
      return `https://kroki.io/plantuml/svg?puml=${encoded}`;
    } catch {
      return '';
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header Banner */}
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
                ArcSpace Registry
              </span>
              <span className="text-xs font-mono text-cyan-300">/architecture/</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight mt-1">
              Архитектурный Центральный Реестр
            </h1>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Разделение монолита (As-Is / MVP) и целевой событийной микросервисной системы (To-Be / Enterprise)
            </p>
          </div>
        </div>

        {/* Primary Architecture Switcher: AS-IS vs TO-BE */}
        <div className="flex items-center p-1 rounded-xl bg-[#010309] border border-cyan-500/40 shadow-inner font-mono text-xs">
          <button
            onClick={() => {
              setMainMode('as_is');
              if (selectedPuml === 'eda') setSelectedPuml('c2');
            }}
            className={`px-4 py-2 rounded-lg font-extrabold transition flex items-center space-x-2 ${
              mainMode === 'as_is'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="h-4 w-4" />
            <span>Текущая (As-Is / MVP)</span>
          </button>

          <button
            onClick={() => {
              setMainMode('to_be');
              setSelectedPuml('eda');
            }}
            className={`px-4 py-2 rounded-lg font-extrabold transition flex items-center space-x-2 ${
              mainMode === 'to_be'
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="h-4 w-4" />
            <span>Целевая (To-Be / Enterprise)</span>
          </button>
        </div>
      </div>

      {/* Mode Status Indicator Bar */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between font-mono text-xs ${
          mainMode === 'as_is'
            ? isDark
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
              : 'bg-amber-50 border-amber-300 text-amber-900'
            : isDark
            ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-300'
            : 'bg-cyan-50 border-cyan-300 text-cyan-900'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className={`h-2.5 w-2.5 rounded-full ${mainMode === 'as_is' ? 'bg-amber-400' : 'bg-cyan-400'} animate-pulse`}></span>
          <span className="font-bold uppercase tracking-wider">
            {mainMode === 'as_is' ? 'БЛОК 1: ТЕКУЩАЯ АРХИТЕКТУРА (AS-IS / MVP)' : 'БЛОК 2: ЦЕЛЕВАЯ АРХИТЕКТУРА (TO-BE / ENTERPRISE)'}
          </span>
        </div>
        <span className="hidden sm:inline text-[11px] opacity-80">
          {mainMode === 'as_is'
            ? 'Node.js 20 • Express.js • React 19 • In-Memory DB (mockDb.ts)'
            : 'Envoy Gateway • Apache Kafka • Go Temporal.io • PostgreSQL 18'}
        </span>
      </div>

      {/* Sub-Navigation Tabs */}
      <div
        className={`flex items-center space-x-2 p-1.5 rounded-xl border overflow-x-auto no-scrollbar font-mono text-xs ${
          isDark ? 'bg-[#060612] border-cyan-500/30' : 'bg-white border-slate-300 shadow-sm'
        }`}
      >
        {mainMode === 'as_is' ? (
          <>
            <button
              onClick={() => setAsIsSubTab('diagrams')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                asIsSubTab === 'diagrams'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code className="h-4 w-4" />
              <span>PlantUML Диаграммы</span>
            </button>
            <button
              onClick={() => setAsIsSubTab('components')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                asIsSubTab === 'components'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Server className="h-4 w-4" />
              <span>Состав Компонентов</span>
            </button>
            <button
              onClick={() => setAsIsSubTab('data_flow')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                asIsSubTab === 'data_flow'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>Data Flow Пайплайн</span>
            </button>
            <button
              onClick={() => setAsIsSubTab('openapi')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                asIsSubTab === 'openapi'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>OpenAPI Current</span>
            </button>
            <button
              onClick={() => setAsIsSubTab('report')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                asIsSubTab === 'report'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Отчёт As-Is</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setToBeSubTab('diagrams')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                toBeSubTab === 'diagrams'
                  ? 'bg-cyan-400 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code className="h-4 w-4" />
              <span>PlantUML & EDA Схемы</span>
            </button>
            <button
              onClick={() => setToBeSubTab('components')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                toBeSubTab === 'components'
                  ? 'bg-cyan-400 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Микросервисы Target</span>
            </button>
            <button
              onClick={() => setToBeSubTab('migration')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                toBeSubTab === 'migration'
                  ? 'bg-cyan-400 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <GitBranch className="h-4 w-4" />
              <span>План Миграции</span>
            </button>
            <button
              onClick={() => setToBeSubTab('adrs')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                toBeSubTab === 'adrs'
                  ? 'bg-cyan-400 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>ADR Реестр ({adrList.length})</span>
            </button>
            <button
              onClick={() => setToBeSubTab('openapi')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                toBeSubTab === 'openapi'
                  ? 'bg-cyan-400 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>OpenAPI Target</span>
            </button>
            <button
              onClick={() => setToBeSubTab('report')}
              className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                toBeSubTab === 'report'
                  ? 'bg-cyan-400 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Отчёт To-Be</span>
            </button>
          </>
        )}
      </div>

      {/* VIEW: PLANTUML DIAGRAMS & RENDERER (AS-IS & TO-BE) */}
      {((mainMode === 'as_is' && asIsSubTab === 'diagrams') || (mainMode === 'to_be' && toBeSubTab === 'diagrams')) && (
        <div className="space-y-6">
          {/* Controls Bar for Diagrams */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs ${
              isDark ? 'bg-[#060612] border-slate-800' : 'bg-white border-slate-300'
            }`}
          >
            {/* Diagram Switcher */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
              {mainMode === 'to_be' ? (
                <>
                  <button
                    onClick={() => setSelectedPuml('eda')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'eda'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Target EDA Map
                  </button>
                  <button
                    onClick={() => setSelectedPuml('c1')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'c1'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    C1 Context
                  </button>
                  <button
                    onClick={() => setSelectedPuml('c2')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'c2'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    C2 Container
                  </button>
                  <button
                    onClick={() => setSelectedPuml('c3')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'c3'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    C3 Component
                  </button>
                  <button
                    onClick={() => setSelectedPuml('deployment')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'deployment'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Deployment
                  </button>
                  <button
                    onClick={() => setSelectedPuml('sequence')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'sequence'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sequence
                  </button>
                  <button
                    onClick={() => setSelectedPuml('er')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'er'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ER Diagram
                  </button>
                  <button
                    onClick={() => setSelectedPuml('api')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'api'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    API Architecture
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedPuml('c1')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'c1'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    C1 Context
                  </button>
                  <button
                    onClick={() => setSelectedPuml('c2')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'c2'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    C2 Container
                  </button>
                  <button
                    onClick={() => setSelectedPuml('c3')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'c3'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    C3 Component
                  </button>
                  <button
                    onClick={() => setSelectedPuml('deployment')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'deployment'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Deployment
                  </button>
                  <button
                    onClick={() => setSelectedPuml('sequence')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'sequence'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sequence
                  </button>
                  <button
                    onClick={() => setSelectedPuml('er')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'er'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ER Diagram
                  </button>
                  <button
                    onClick={() => setSelectedPuml('api')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedPuml === 'api'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    API Routes
                  </button>
                </>
              )}
            </div>

            {/* View Mode Switcher: Code vs Visual SVG */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-[11px]">Режим показа:</span>
              <div className="flex items-center p-1 rounded-lg bg-[#010309] border border-slate-700">
                <button
                  onClick={() => setPumlRenderMode('visual')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                    pumlRenderMode === 'visual' ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  Визуал (SVG)
                </button>
                <button
                  onClick={() => setPumlRenderMode('code')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                    pumlRenderMode === 'code' ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  Код PlantUML
                </button>
                <button
                  onClick={() => setPumlRenderMode('both')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                    pumlRenderMode === 'both' ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  Оба
                </button>
              </div>

              <button
                onClick={() => handleCopyCode(getActivePumlCode())}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Скопировать исходный код PlantUML"
              >
                {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* PlantUML Diagram Render Panel */}
          <div className="grid grid-cols-1 gap-6">
            {(pumlRenderMode === 'visual' || pumlRenderMode === 'both') && (
              <div
                className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden ${
                  isDark ? 'bg-[#030712] border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-700 text-cyan-300'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 font-mono text-xs">
                  <span className="font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Code className="h-4 w-4 text-cyan-400" />
                    <span>
                      Рендеринг PlantUML — {selectedPuml.toUpperCase()} ({mainMode.toUpperCase()})
                    </span>
                  </span>
                  <a
                    href={getKrokiUrl(getActivePumlCode())}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Открыть SVG в новой вкладке</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex justify-center items-center min-h-[300px] bg-[#010309] rounded-xl border border-cyan-500/30 p-4 overflow-x-auto">
                  <img
                    src={getKrokiUrl(getActivePumlCode())}
                    alt="PlantUML Diagram Render"
                    className="max-w-full h-auto rounded-lg shadow-2xl transition-all hover:scale-[1.01]"
                    onError={(e) => {
                      // Fallback text if Kroki is blocked or offline
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <noscript>Включите JavaScript для просмотра PlantUML схемы</noscript>
                </div>
              </div>
            )}

            {(pumlRenderMode === 'code' || pumlRenderMode === 'both') && (
              <div
                className={`p-6 rounded-2xl border font-mono space-y-3 ${
                  isDark ? 'bg-[#060612] border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="text-xs font-bold text-cyan-400">PlantUML Source Code (.puml)</span>
                  <span className="text-[10px] text-slate-400">Используйте java -jar plantuml.jar для сборки</span>
                </div>
                <pre className="p-4 rounded-xl bg-[#010309] border border-cyan-500/30 text-cyan-300 text-xs overflow-x-auto leading-relaxed">
                  {getActivePumlCode()}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AS-IS: COMPONENTS & DATA FLOW */}
      {mainMode === 'as_is' && asIsSubTab === 'components' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div
            className={`oc-card p-4 space-y-3 ${
              isDark ? 'bg-[#060612] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <h3 className="text-sm font-bold text-amber-400 border-b pb-2 border-slate-700">1. Backend Gateway (`server.ts`)</h3>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Монолитный Express.js сервер, обслуживающий REST Webhook ручки, связь с GitHub Models / Gemini и OData эмулятор 1С.
            </p>
            <ul className="space-y-1 text-[11px] text-slate-400">
              <li>• `POST /api/webhooks/dispatch`: Вход для Telegram, Email и голоса</li>
              <li>• `POST /api/llm/config`: Настройка ключей и выбор нейросети</li>
              <li>• `GET/POST /api/1c/tickets`: Проведение заявок в OData 1С</li>
            </ul>
          </div>

          <div
            className={`oc-card p-4 space-y-3 ${
              isDark ? 'bg-[#060612] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <h3 className="text-sm font-bold text-amber-400 border-b pb-2 border-slate-700">2. Deterministic Engine (`dispatcherEngine.ts`)</h3>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Детерминированный 8-шаговый пайплайн: проверкa Guardrails, сопоставление контрагентов и расчет дедлайнов SLA.
            </p>
            <ul className="space-y-1 text-[11px] text-slate-400">
              <li>• Guardrails Check (защита от промпт-инъекций)</li>
              <li>• Разрешение неоднозначности оборудования (TC-02)</li>
              <li>• Расчет SLA (Gold: 60 мин, Standard: 480 мин)</li>
            </ul>
          </div>
        </div>
      )}

      {/* AS-IS: DATA FLOW */}
      {mainMode === 'as_is' && asIsSubTab === 'data_flow' && (
        <div
          className={`p-6 rounded-2xl border font-mono space-y-4 ${
            isDark ? 'bg-[#060612] border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <h3 className="text-sm font-bold text-amber-400 border-b pb-2 border-slate-700">Пайплайн Обработки Обращения (As-Is MVP)</h3>
          <pre className="p-4 rounded-xl bg-[#010309] border border-amber-500/30 text-amber-300 text-xs overflow-x-auto leading-relaxed">
{`[ Telegram / Email / Voice ]
             │
             ▼
1. Webhook Engine (server.ts)
             │
             ▼
2. LLM Extraction (JSON Mode: customer, site, asset, problem)
             │
             ▼
3. Deterministic Matching (dispatcherEngine.ts -> mockDb.ts)
             │
             ▼
4. SLA & Contract Calculation (Gold / Silver / Standard)
             │
             ▼
5. Decision: Confidence >= 0.85 -> AUTO_REGISTERED -> 1C OData Sync
             Confidence < 0.85  -> WAITING_DISPATCHER -> Operator HITL Console`}
          </pre>
        </div>
      )}

      {/* TO-BE: COMPONENTS & MICROSERVICES */}
      {mainMode === 'to_be' && toBeSubTab === 'components' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div
            className={`oc-card p-4 space-y-3 ${
              isDark ? 'bg-[#060612] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b pb-2 border-slate-700">
              <Server className="h-4 w-4" />
              <span>1. Envoy Ingress Gateway</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Высоконагруженный вход TLS 1.3 с лимитированием частоты запросов, защитой от DDoS и валидацией подписей вебхуков.
            </p>
          </div>

          <div
            className={`oc-card p-4 space-y-3 ${
              isDark ? 'bg-[#060612] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b pb-2 border-slate-700">
              <Zap className="h-4 w-4" />
              <span>2. Apache Kafka Event Bus</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Асинхронная шина событий. Изолирует сетевые сбои external API и сглаживает пиковые нагрузки обращений.
            </p>
          </div>

          <div
            className={`oc-card p-4 space-y-3 ${
              isDark ? 'bg-[#060612] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2 text-cyan-400 font-bold border-b pb-2 border-slate-700">
              <Database className="h-4 w-4" />
              <span>3. Go + Temporal Decision Engine</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Гарантированное управление Workflow с сохранением состояния (Durable Execution) и поддержкой паузы HITL.
            </p>
          </div>
        </div>
      )}

      {/* TO-BE: MIGRATION PLAN */}
      {mainMode === 'to_be' && toBeSubTab === 'migration' && (
        <div
          className={`p-6 rounded-2xl border font-mono space-y-6 ${
            isDark ? 'bg-[#060612] border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <h3 className="text-sm font-bold text-cyan-400 border-b pb-2 border-slate-700">
            План Миграции: От As-Is Монолита к To-Be EDA Платформе
          </h3>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                ФАЗА 1 (Месяц 1): Слой Данных и Контейнеризация
              </span>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Перенос In-Memory store (`mockDb.ts`) в PostgreSQL 18 + `pgvector`.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Настройка таблицы аудита и истории изменений статусов заявок.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                ФАЗА 2 (Месяцы 2-3): Event Bus & AI Microservice
              </span>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Развертывание кластера Apache Kafka.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Вынос AI Fact Extraction в Python / LangGraph сервисы.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                ФАЗА 3 (Месяцы 4-5): Go + Temporal Workflow Engine
              </span>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Перенос ядра принятий решений из `dispatcherEngine.ts` в Go Temporal Worker.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ADR INDEX */}
      {((mainMode === 'as_is' && asIsSubTab === 'report') || (mainMode === 'to_be' && toBeSubTab === 'adrs')) && (
        <div className="space-y-4 font-mono">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Архитектурные Решения (ADR Index)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adrList.map((adr) => (
              <div
                key={adr.id}
                className={`oc-card p-4 transition-all ${
                  isDark ? 'bg-[#060612] border-slate-800 text-slate-300 hover:border-cyan-500/50' : 'bg-white border-slate-200 text-slate-800 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {adr.id}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">{adr.status}</span>
                </div>
                <h4 className="text-sm font-bold mt-2 text-white">{adr.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{adr.summary}</p>
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

      {/* OPENAPI VIEW */}
      {((mainMode === 'as_is' && asIsSubTab === 'openapi') || (mainMode === 'to_be' && toBeSubTab === 'openapi')) && (
        <div
          className={`p-6 rounded-2xl border font-mono space-y-4 ${
            isDark ? 'bg-[#060612] border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-sm font-bold text-cyan-400">
              OpenAPI 3.0 Спецификация ({mainMode === 'as_is' ? '/architecture/api/openapi_current.yaml' : '/architecture/api/openapi_target.yaml'})
            </h3>
            <span className="text-xs text-emerald-400">REST & Webhook Spec</span>
          </div>
          <pre className="p-4 rounded-xl bg-[#010309] border border-cyan-500/30 text-cyan-300 text-xs overflow-x-auto">
{mainMode === 'as_is'
  ? `openapi: 3.0.3
info:
  title: Text2Business AI-Dispatcher API (As-Is Express Monolith)
  version: 1.0.0
paths:
  /api/webhooks/dispatch:
    post:
      summary: Синхронная диспетчеризация входящего обращения
  /api/llm/config:
    post:
      summary: Передача GITHUB_MODELS_TOKEN и активной модели
  /api/1c/tickets:
    get:
      summary: OData REST реестр ЗаявокНаРемонт`
  : `openapi: 3.0.3
info:
  title: Text2Business AI-Dispatcher Platform API (To-Be Envoy Gateway)
  version: 2.0.0
paths:
  /v1/ingress/telegram:
    post:
      summary: Прием входящих вебхуков от Telegram Bot API
  /v1/ingress/speech/stream:
    post:
      summary: Потоковый gRPC аудиоканал
  /v1/tickets:
    get:
      summary: Реестр заявок из PostgreSQL 18`}
          </pre>
        </div>
      )}

      {/* TECHNICAL REPORT */}
      {((mainMode === 'as_is' && asIsSubTab === 'report') || (mainMode === 'to_be' && toBeSubTab === 'report')) && (
        <div
          className={`p-6 rounded-2xl border font-mono space-y-6 ${
            isDark ? 'bg-[#060612] border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <h3 className="text-sm font-bold text-cyan-400 border-b pb-2 border-slate-700">
            {mainMode === 'as_is' ? 'Технический Отчет по Текущей Версии (As-Is)' : 'Технический Отчет по Целевой Системе (To-Be)'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {mainMode === 'as_is'
              ? 'Текущая версия системы представляет собой высокопроизводительный прототип (MVP) в монолитном Node.js 20 контейнере. Извлечение фактов выполняется за <1 секунду с использованием GitHub Models API (gpt-4o) в формате Structured Output (JSON Mode). В случае сбоя внешних сервисов активируется локальный алгоритм.'
              : 'Целевая промышленная платформа спроектирована по паттерну Event-Driven Microservices (EDA) на базе Envoy Gateway, Apache Kafka, Go Temporal.io и PostgreSQL 18. Платформа обеспечивает обработку 10,000+ обращений в минуту с гарантированной сохранностью состояний и поддержкой Air-Gapped режима.'}
          </p>
        </div>
      )}
    </div>
  );
};
