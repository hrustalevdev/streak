# Streak — трекер привычек на LangGraph

AI-агент на естественном языке для трекинга привычек. Принимает текстовые запросы, вызывает API через LangChain tools и возвращает ответ в фиксированном формате.

**Стек:** TypeScript · LangGraph · Ollama (локально) / OpenRouter (облако) · Hono

---

## Быстрый старт

### Вариант 1 — локально, с локальной моделью через Ollama (по умолчанию)

```bash
# 1. Зависимости
npm install

# 2. Переменные окружения
cp .env.example .env
# По умолчанию LLM_PROVIDER=ollama — нужен установленный и запущенный Ollama
# с моделью, поддерживающей tool calling (см. таблицу ниже). Если Ollama
# крутится не на этой машине — поменяйте OLLAMA_BASE_URL.

# 3. Запустить mock API (терминал 1)
npm run api

# 4. Запустить агента (терминал 2)
npm run agent "отметь медитацию выполненной"
```

### Вариант 1b — локально, с облачной моделью через OpenRouter

```bash
cp .env.example .env
# В .env поставить LLM_PROVIDER=openrouter и вставить OPENROUTER_API_KEY
# из openrouter.ai (бесплатно)

npm run api        # терминал 1
npm run agent "отметь медитацию выполненной"   # терминал 2
```

### Вариант 2 — Docker (облачная модель через OpenRouter)

```bash
cp .env.example .env
# LLM_PROVIDER=openrouter, вставить OPENROUTER_API_KEY из openrouter.ai

docker compose up api -d

QUERY="создай привычку медитация" docker compose run --rm agent
QUERY="отметь медитацию выполненной" docker compose run --rm agent
QUERY="покажи все мои привычки" docker compose run --rm agent
```

> Локальная Ollama-модель в Docker не задействуется автоматически — контейнеру нужен сетевой доступ к хосту с Ollama (`OLLAMA_BASE_URL` в `.env`).

---

## Примеры запросов

```bash
npm run agent "создай привычку читать книги"
npm run agent "отметь медитацию выполненной"
npm run agent "какой у меня стрик по медитации?"
npm run agent "покажи все мои привычки"
npm run agent "что такое streak?"
```

Ответ всегда в формате:
```
Status: success | error
Action: <что сделал агент>
Data: <результат>
Errors: <ошибка или ->
```

---

## API

Mock API поднимается локально на `http://localhost:3000`.

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/habits` | Создать привычку |
| `POST` | `/habits/:id/completions` | Отметить выполнение на сегодня |
| `GET` | `/habits/:id/streak` | Получить streak |
| `GET` | `/habits` | Список всех привычек со streak'ами |

---

## Архитектура агента

```mermaid
flowchart TD
    A([Запрос пользователя]) --> B{agent node}
    B -->|есть tool_calls| C["tools node<br/>HTTP-вызов к API"]
    C --> B
    B -->|нет tool_calls| D([Ответ])
```

Реализован ручной `StateGraph` (`src/agent/graph.ts`) с явными узлами и рёбрами.

---

## Структура проекта

```
streak/
├── src/
│   ├── api/
│   │   ├── routes.ts       # In-memory хранилище + 4 эндпоинта
│   │   └── server.ts       # Запуск Hono-сервера
│   ├── agent/
│   │   ├── graph.ts        # StateGraph: agent ↔ tools
│   │   ├── tools.ts        # 4 LangChain tools (HTTP-обёртки)
│   │   └── prompt.ts       # Системный prompt
│   └── main.ts             # CLI точка входа
├── prompts/
│   └── system.md           # Системный prompt + описание tools
├── docs/
│   ├── DESIGN.md           # PRD + технический дизайн
│   └── report.md           # Отчёт по домашнему заданию
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Переменные окружения

| Переменная | Описание |
|---|---|
| `API_BASE_URL` | URL mock API (по умолчанию `http://localhost:3000`) |
| `LLM_PROVIDER` | `ollama` (по умолчанию, локальная модель) или `openrouter` (облачная) |
| `OLLAMA_BASE_URL` | OpenAI-совместимый эндпоинт Ollama (по умолчанию `http://localhost:11434/v1`, можно указать другую машину в сети) |
| `OLLAMA_MODEL` | Модель в Ollama, обязательно с поддержкой tool calling (по умолчанию `qwen3.5:9b`, см. таблицу ниже) |
| `OPENROUTER_API_KEY` | API-ключ из [openrouter.ai](https://openrouter.ai) (бесплатно), нужен только при `LLM_PROVIDER=openrouter` |

Секреты хранятся в `.env` (в репозиторий не коммитится). Шаблон: `.env.example`.

### Локальные модели: что проверено

По результатам стресс-теста (`docs/progress.md`, раунд 2) на многошаговых цепочках tool-вызовов (list → create → mark):

| Модель | Итог |
|---|---|
| `qwen3.5:9b` | ✅ Рекомендуется. Стабильно соблюдает порядок вызовов, не дублирует привычки, не выдумывает id |
| `llama3.1:8b` | ⚠️ Не рекомендуется для этого проекта. Регулярно пропускает обязательный `list_habits`, дублирует привычки, в отдельных случаях подставляет в ответ несуществующие данные вместо реального результата tool-вызова |

Модель обязательно должна поддерживать tool calling — проверить можно через `curl http://<host>:11434/api/tags` и посмотреть на `capabilities` (`tools` должно быть в списке).

---

## Документация

- [`docs/DESIGN.md`](docs/DESIGN.md) — PRD и технический дизайн
- [`docs/report.md`](docs/report.md) — отчёт по домашнему заданию
- [`prompts/system.md`](prompts/system.md) — системный prompt агента
