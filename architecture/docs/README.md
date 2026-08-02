# Архитектурные Диаграммы и Схемы

Директория содержит исходные файлы PlantUML (`.puml`) для генерации C4-диаграмм и контекстных схем.

## Состав диаграмм

| Файл | Описание |
|------|----------|
| `target_architecture.puml` | Target Event-Driven Architecture (Envoy Gateway, Kafka, STT, AI LangGraph, Go Temporal, PostgreSQL 18, 1C OData, Arize AI) |
| `c1_context.puml` | C1 System Context — взаимодействие клиента, AI-Диспетчера, GitHub Models и 1С:ERP |
| `c2_container.puml` | C2 Container — структура веб-приложения (React SPA, Backend Engine, Mock DB, OData Adapter) |
| `sequence_unified.puml` | Sequence Diagram — сквозной поток обработки сообщения от Telegram до проведения в 1С |

## Рендеринг PlantUML

Для генерации SVG/PNG диаграмм локально:
```bash
java -jar plantuml.jar architecture/docs/diagrams/*.puml
```
