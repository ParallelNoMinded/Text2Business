# Text2Business — план цельного responsive-редизайна

> **Режим:** только анализ и дизайн-план. Функциональность существующего проекта не меняется.

## Цель

Перестроить текущий React-интерфейс Text2Business из демонстрационного dark/glass UI в спокойную корпоративную рабочую среду диспетчера, сохранив все маршруты, состояния, API-вызовы, CRUD-операции, сценарии, модалки и архитектурный контент.

## Визуальный источник истины

Основной визуальный ориентир — утверждённый набор пользовательских макетов: `Главный экран.png`, `Диспетчер.png`, `Реестр.png`, `Каналы.png`, `Демо-стенд.png`, `Демо-стенд запущен.png`, `Логиитрейсы.png`.

Не создавать новую стилистику поверх них. При реализации воспроизводить их app shell и интерфейсный язык: тёмный фиолетово-графитовый sidebar, светлая рабочая область, бирюзовый primary-accent, белые поверхности с тонкими серыми границами, крупный sans-serif, мягкие пастельные status badges и очень умеренные тени. Изображения заданы для desktop; для tablet/mobile строить полноценные перестройки, сохраняя тот же язык.

Если макет содержит несуществующие в текущем проекте данные, названия или контроль, переносить лишь его визуальную форму на уже доступные состояние и функции: не добавлять новые API, страницы, фильтры, пагинацию или действия без отдельного согласования.

## Что обнаружено в исходной версии

Стек: React 19 + TypeScript + Vite + Tailwind CSS v4 + lucide-react. Точка композиции и общее состояние находятся в `src/App.tsx`.

Существующие экраны:

1. `home` — `src/components/LandingHome.tsx`: hero, фон ParticleSwarmCanvas, четыре навигационные плитки: Каналы, Диспетчер, Реестр, Логи & Трейсы.
2. `channels` — `ChannelsConfigView.tsx`: Telegram token/polling, Email IMAP/MCP, Telephony STT/SIP, REST API sandbox, browser voice input, response output.
3. `console` — inline в `App.tsx` + `ScenarioRunner.tsx`, `FactExtractorView.tsx`, `DispatchCard.tsx`, `ExecutionTraceTimeline.tsx`: выбор 4 пресетов, текст обращения, канал, timestamp, dry-run, запуск пайплайна, факты, решение, SLA, draft ответа, commit, раскрываемая трассировка.
4. `operator` — `OperatorConsoleView.tsx`: pending HITL-карточки, таблица активных заявок, модалка диалога, ответ клиенту, ручное заполнение и передача в 1С.
5. `database` — `DatabaseInspectorView.tsx`: поиск, reset БД, вкладки открытых/закрытых заявок, контрагентов, объектов, оборудования, договоров; таблицы, добавление, удаление, закрытие заявок и CRUD-модалки.
6. `logs_traces` — `LogsTracesView.tsx`: живые логи с фильтрами/поиском/refresh, OpenTelemetry traces, analytics и вычисляемые метрики.
7. `architecture` — `ArchitectureView.tsx`: As-Is/To-Be, вложенная навигация, PlantUML visual/code/both, компоненты, data flow, migration, ADR, OpenAPI, reports.
8. Глобальная `GithubTokenModal.tsx`: GitHub Models token + X-Dispatch-Token, показать/скрыть, очистить, подключить модель.

Существующая логика и контракты, которые запрещено менять: состояния и handlers `App.tsx`, API endpoints, типы в `src/types.ts`, сценарии `src/scenarios.ts`, данные `src/mockDb.ts`, identifiers (`id`/`data`-селекторы) компонентов, Web Speech API, polling, clipboard, keyboard shortcut Ctrl/Cmd+Enter.

## Дизайн-система

### Принцип

Приоритет: диспетчерская работа и читаемость, а не демонстрация технологий. Главный визуальный фокус — входящая заявка, действие AI, уровень сервиса и необходимость участия человека.

### Цвета

- Light по умолчанию для рабочих экранов: `#F5F7FA` фон, `#FFFFFF` surface, `#E2E8F0` border, `#172033` primary text, `#64748B` secondary.
- Dark сохранить как полноценную тему: `#0F172A` фон, `#111C2F` surface, `#24344D` border, `#F8FAFC` primary text, `#94A3B8` secondary.
- Brand accent: blue `#2563EB` / dark `#60A5FA`; неоновый cyan/purple/glow удалить из декоративных ролей.
- Семантика: green success, amber attention/HITL, red critical/error, violet только для AI/trace secondary state.
- Контраст light theme минимум AA: темный текст в полях, таблицах и кнопках.

### Типографика

- UI: system sans (`Inter`-подобный stack), 14px базовый размер, line-height 1.45.
- IDs, timestamps, endpoints, JSON, PlantUML: моноширинный шрифт только локально.
- Page title 24/28 desktop, 20/24 mobile; section title 15/18; labels 12/16; table 13/18.
- Убрать повсеместный uppercase и micro-text; uppercase допустим только для коротких статусов и технических меток.

### Layout tokens

- App shell: sidebar 248px desktop + content; content max-width 1440px, padding 32px desktop / 24px tablet / 16px mobile.
- Header 64px; page sections gap 24px desktop / 16px mobile.
- Cards radius 12px, border 1px, shadow `0 1px 3px rgb(.../.08)`; no glass blur, gradients, particle grid, scale hover.
- Buttons min-height 40px desktop, 44px touch; focus ring visible.
- Content grids use `minmax(0, 1fr)` and allow wrapping; no fixed-width text containers.

### Navigation shell

`Header.tsx` становится общим app shell:
- desktop: постоянный левый sidebar с логотипом, группами «Работа» (Главная, Диспетчер, Демо-стенд), «Данные» (Реестр), «Наблюдение» (Логи & Трейсы), «Система» (Каналы, Архитектура); активный пункт с blue tint.
- sidebar показывает badge pendingOperatorCount рядом с «Диспетчер».
- верхняя компактная toolbar: текущая модель, token status, dry-run status, theme, mobile menu.
- tablet: sidebar collapses to icon rail или drawer; label доступен в tooltip/открытом drawer.
- mobile/small mobile: header с logo + pending badge + menu button; навигация drawer поверх контента с закрытием после выбора; никакого горизонтального tab-strip.
- Не удалять ни одну текущую кнопку/ссылку: архитектура, token modal, theme, model selector и все переходы должны остаться в доступном меню/toolbar.

## Редизайн экранов

### 1. Главная

Структура: page intro «AI-диспетчер», короткий operational summary без декоративного hero; primary CTA «Открыть диспетчер» и secondary «Запустить демо». Ниже — 4 функциональные карточки в сетке и компактный блок «Состояние системы» (только существующие статические/доступные действия, без добавления функций).

- Desktop: intro слева, справа спокойная panel с 3–4 тезисами о pipeline; карточки 4 колонки.
- Tablet: intro full width, карточки 2 колонки.
- Mobile: CTA stack, карточки одна колонка; скрыть только декоративный canvas, не интерактивные действия.
- Главное: вход в Диспетчер и pending attention. Вторичное: Каналы/Реестр/Логи.

### 2. Каналы и интеграции

Сверху title + status summary. Основная сетка: 5 responsive connector sections (Telegram, Email, Телефония, REST API, voice input). Каждый блок: icon/status, описание, поля, primary test/save action, inline result.

- Desktop: 2 колонки; voice input и REST response могут занимать всю ширину, если контент длинный.
- Tablet: 2 колонки только если ширина позволяет; иначе 1.
- Mobile: 1 колонка; поля Email не делить на две колонки на ширине <640px; длинные кнопки переносятся/становятся full width; JSON сохраняет горизонтальную прокрутку только внутри code area.
- Секреты маскировать, eye buttons сохранять. Не превращать форму в accordion, если это затрудняет доступность текущих функций.

### 3. Демо-стенд / pipeline

Сделать главный workspace, а не вертикальный список одинаковых карточек:
- top bar: title, dry-run badge и model context;
- основной двухколоночный блок: слева «Входящее обращение» (пресеты, channel, time, textarea, run/reset); справа «Результат» (decision, status, commit);
- ниже full-width «Извлеченные факты», затем «Проект ответа», затем collapsible execution trace.

До результата правая колонка показывает empty state, не меняя существующее поведение.

- Desktop: 5fr/7fr или 40/60, sticky action area не перекрывает содержимое.
- Tablet: input и result друг под другом или 45/55 только при min-width 900px.
- Mobile: все одна колонка, порядок строго input → facts → decision → trace; CTA full width; preset cards горизонтально прокручиваются внутри только своей области либо 2x2 без обрезания; textarea auto-height минимум 140px.
- Главными сделать run, status, action, «Уровень сервиса», commit. Технические reasoning/details вторичны и раскрываемы.

### 4. Рабочее место диспетчера

Сверху title + заметный, но спокойный счетчик attention. Далее pending tickets — вертикальные rows/cards с ID, кратким summary, missing fields, сроком и кнопкой «Открыть диалог». Ниже активные заявки таблицей.

- Desktop: pending list может быть 1 колонкой с full-width rows для сравнения; таблица active tickets.
- Tablet: pending cards 2 колонки, если нет переполнения.
- Mobile: pending rows one-column; active table превращается в stacked ticket cards с теми же полями и действиями, а не в широкую таблицу.
- Modal: desktop max 720px, mobile bottom-sheet/full-height с safe padding; header и actions sticky внутри modal, message stream scrolls independently; reply textarea и quick actions не перекрываются клавиатурой; preserve send/approve/close controls.

### 5. Реестр БД

Page header с поиском и reset. Вкладки сущностей — horizontally scrollable only within tab nav или select на mobile; active dataset summary. CRUD table container.

- Desktop: таблица с фиксированным action column, sensible column widths, wrapping summary/address.
- Tablet: скрывать второстепенные колонки только если их данные доступны в detail/modal; не терять данные.
- Mobile: вместо нечитаемой таблицы — list cards per entity с key-value rows; actions always visible; search full width; add/reset buttons wrap.
- CRUD modal: responsive 2-column form desktop, 1-column mobile, max-height + internal scroll, footer actions sticky. Delete/close actions visually separated and not adjacent to destructive primary by accident.

### 6. Логи, трейсы и аналитика

Header + three view tabs; metrics cards below. Preserve auto-refresh, filter, search and refresh.

- Logs: terminal styling only for log body, controls remain normal UI; each event is grid with channel, time, message, latency.
- Traces: span bars use proportional width but labels wrap; no fixed overflow.
- Analytics: progress bars in cards, not neon dashboards.
- Desktop 4 metrics columns; tablet 2; mobile 1/2 depending width. Tabs wrap or become segmented scroll without clipping.

### 7. Архитектура

Treat as documentation workspace: title, As-Is/To-Be segmented control, contextual sub-navigation, content panel. Preserve all PlantUML visual/code/both modes, diagrams, components, migration, ADR, OpenAPI, reports.

- Desktop: subnav sidebar 220px + document content; code and diagrams in bounded panels.
- Tablet: subnav horizontal/wrapped; content full width.
- Mobile: mode and subnav stacked; code blocks scroll only internally; tables/cards stack; long headings wrap; no global horizontal scroll.
- Use a restrained documentation palette and consistent code panel, not separate unrelated neon treatments.

### 8. Token modal

Keep existing fields and behavior. New modal hierarchy: title/status → model notice → token field → dispatch token field → helper copy → footer. Desktop max 520px; mobile width calc(100%-24px), max-height 90vh, internal scroll, footer wraps. Touch targets >=44px; focus trap/escape/backdrop behavior should be checked without changing logic.

## Responsive acceptance checklist

- 320px, 360px, 390px: no body horizontal scroll; all primary buttons visible; headings wrap; modal usable.
- 768px: no accidental desktop sidebar overlap; tables use card transformation or bounded scroll.
- 1024px: two-column layouts do not create narrow unreadable panels.
- 1280/1440px: content does not stretch excessively; main dispatcher hierarchy remains obvious.
- All icon-only buttons have title/aria-label; focus styles visible; color is not the sole status signal.
- Verify long Russian strings, JSON, addresses, ticket summaries, endpoint labels and trace details.

## Likely implementation order (после утверждения)

1. `src/index.css`: tokens, base reset, shell utilities, responsive primitives; remove particle/glow dependence from shared visual language.
2. `src/components/Header.tsx`: responsive sidebar/drawer and toolbar, preserving IDs and callbacks.
3. `src/App.tsx`: replace outer shell classes only; keep state/effects/handlers/API untouched.
4. `LandingHome.tsx`.
5. `ScenarioRunner.tsx`, `FactExtractorView.tsx`, `DispatchCard.tsx`, `ExecutionTraceTimeline.tsx` and console composition.
6. `OperatorConsoleView.tsx` + modal.
7. `DatabaseInspectorView.tsx` + CRUD modal/table responsive patterns.
8. `ChannelsConfigView.tsx`.
9. `LogsTracesView.tsx`.
10. `ArchitectureView.tsx`.
11. `GithubTokenModal.tsx`.
12. Run `npm run lint`, `npm run test`, `npm run build`; then manually verify viewport matrix.

## Risks / constraints

- `ArchitectureView.tsx` (1658 lines), `ChannelsConfigView.tsx` (940), and `DatabaseInspectorView.tsx` (938) are large: edit visual sections incrementally, avoid rereading whole files.
- Existing Tailwind class strings are heavily duplicated and conditionally encode theme contrast; visual refactor must not alter handlers or API state.
- Existing `SlaMatrixView.tsx` is a standalone component but is not currently rendered from `App.tsx`; do not add a new route/function without approval. Its content may be reused only if the existing architecture screen already exposes it.
- Particle canvas is decorative; disable/hide it on constrained screens rather than altering component behavior.
- User will provide reference images later. Once supplied, do a second visual pass using direct visual analysis and preserve this functional/responsive foundation.
