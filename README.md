# Dot Wars

Telegram Mini App. PvP RTS в стиле [State.io](https://state.io): захватывай базы, перекидывай войска, удерживай карту.

Клиент рисует поле на **PixiJS v8**, интерфейс — на **React + Tailwind CSS**. Сеть и симуляция — **Colyseus** на **NestJS**. Игрок видит только синхронизированную дельту состояния: считает и решает сервер.

```
  Telegram Mini App
          │
          ▼
   React + Tailwind UI
   PixiJS Canvas (поле)
          │  State Sync
          ▼
   NestJS + Colyseus
   Authoritative Server
```

---

## Стек

| Слой | Технологии |
| --- | --- |
| Монорепозиторий | TypeScript, npm workspaces |
| Клиент | Vite, React, Tailwind CSS v4, PixiJS v8, `@telegram-apps/sdk` |
| Сервер | Node.js, NestJS, Colyseus |
| Данные | PostgreSQL, Redis |
| Контракт | `@dotwars/shared` — типы, DTO, схемы Colyseus |

---

## Локальный запуск

Нужен **Node.js 20+**.

```bash
git clone https://github.com/pirgooo/Dotwars.git
cd dotwars
npm install
npm run dev
```

`npm run dev` собирает `packages/shared` и параллельно поднимает:

| Процесс | Адрес |
| --- | --- |
| Клиент (Vite) | http://localhost:5173 |
| Сервер (NestJS + Colyseus) | http://localhost:2567 |
| Health-check | http://localhost:2567/health |

Отдельно:

```bash
npm run build              # shared → server → client
npm run start              # прод-сборка сервера
npm run dev -w @dotwars/client
npm run dev -w @dotwars/server
```

Мини-приложение открывается внутри Telegram. В обычном браузере UI работает, SDK Telegram при этом не инициализируется — так и задумано.

---

## Структура монорепозитория

```
dotwars/
├── apps/
│   ├── client/          # Vite + React + Tailwind + PixiJS + Telegram SDK
│   └── server/          # NestJS + Colyseus (авторитетный игровой сервер)
├── packages/
│   └── shared/          # общие типы, интерфейсы, DTO и Colyseus-схемы
├── package.json         # npm workspaces, скрипт npm run dev
└── tsconfig.base.json
```

| Пакет | Имя | Назначение |
| --- | --- | --- |
| `apps/client` | `@dotwars/client` | Mini App: Canvas поля (PixiJS) и HUD на React |
| `apps/server` | `@dotwars/server` | HTTP API, матчмейкинг, комната `match`, симуляция |
| `packages/shared` | `@dotwars/shared` | единый контракт клиента и сервера |

Новые типы, сообщения WebSocket и схемы состояния добавляются только в `packages/shared`. Клиент и сервер их импортируют, а не дублируют.

---

## Authoritative Server

Игровая логика построена на паттерне **Authoritative Server**.

Вся симуляция живёт на сервере: пересчёт войск, коллизии, движение юнитов, проверка победителя. Клиент **не** считает бой и **не** решает исход стычки. Он отправляет намерение (например, «отправь войска с базы A на базу B») и рисует то, что пришло по **State Sync**: Colyseus шлёт дельту `GameState`, а не полную картину каждый кадр.

Так читы на клиенте не меняют мир, а PixiJS остаётся слоем отображения, а не источником правды.

Авторизация Telegram-пользователя проверяется на NestJS: HMAC-SHA256 подпись `initData` валидируется на сервере, клиентской доверенной сессии нет.
