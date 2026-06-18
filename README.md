# Streak — трекер привычек на LangGraph

AI-агент на естественном языке для трекинга привычек. Принимает текстовые запросы, вызывает API через LangChain tools и возвращает ответ в фиксированном формате.

**Стек:** TypeScript · LangGraph · qwen3-32b (Groq) · Hono

---

## Быстрый старт

### Вариант 1 — локально

```bash
# 1. Зависимости
npm install

# 2. Переменные окружения
cp .env.example .env
# Вставить ANTHROPIC_API_KEY из console.anthropic.com

# 3. Запустить mock API (терминал 1)
npm run api

# 4. Запустить агента (терминал 2)
npm run agent "отметь медитацию выполненной"
```

### Вариант 2 — Docker

```bash
cp .env.example .env
# Вставить ANTHROPIC_API_KEY

QUERY="отметь медитацию выполненной" docker compose run --rm agent
```

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

```
Запрос пользователя
       ↓
  [agent node] — LLM решает: вызвать tool или ответить
       ↓ (если есть tool_calls)
  [tools node] — HTTP-вызов к API
       ↓
  [agent node] — видит результат, принимает следующее решение
       ↓ (нет tool_calls)
     Ответ
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
| `ANTHROPIC_API_KEY` | API-ключ из [console.anthropic.com](https://console.anthropic.com) |
| `API_BASE_URL` | URL mock API (по умолчанию `http://localhost:3000`) |

Секреты хранятся в `.env` (в репозиторий не коммитится). Шаблон: `.env.example`.

---

## Документация

- [`docs/DESIGN.md`](docs/DESIGN.md) — PRD и технический дизайн
- [`docs/report.md`](docs/report.md) — отчёт по домашнему заданию
- [`prompts/system.md`](prompts/system.md) — системный prompt агента
