# ADR-005: Роутер Выбора Моделей (GitHub Models / Local Fallback)

**Статус:** Принято  

## 1. Контекст
Приложение должно поддерживать переключение между моделями:
- `qwen3.6-27b`
- `gpt-4o`
- `gemma4:e4b`
- `deepseek-reasoner`
- `nemotron-3-ultra-550b-a55b`

## 2. Решение
При наличии токена `GITHUB_MODELS_TOKEN` все вызовы адресуются через единый эндпоинт `https://models.inference.ai.azure.com/chat/completions`. В случае отсутствия ключа включается локальный эвристический распознаватель фактов.
