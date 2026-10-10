# Dot Wars

Telegram Mini App. A PvP RTS in the style of [State.io](https://state.io): capture bases, send troops, hold the map.

The client draws the field with **PixiJS v8** and the UI with **React + Tailwind CSS**. Networking and simulation run on **Colyseus** on **NestJS**. The player only sees a synchronized state delta: the server computes and decides.

```
  Telegram Mini App
          │
          ▼
   React + Tailwind UI
   PixiJS Canvas (field)
          │  State Sync
          ▼
   NestJS + Colyseus
   Authoritative Server
```

---

## Stack

| Layer | Tech |
| --- | --- |
| Monorepo | TypeScript, npm workspaces |
| Client | Vite, React, Tailwind CSS v4, PixiJS v8, `@telegram-apps/sdk` |
| Server | Node.js, NestJS, Colyseus |
| Data | PostgreSQL, Redis |
| Contract | `@dotwars/shared` — types, DTOs, Colyseus schemas |

---

## Local setup

Requires **Node.js 20+**.

```bash
git clone https://github.com/pirgooo/Dotwars.git
cd dotwars
npm install
npm run dev
```

`npm run dev` builds `packages/shared` and starts in parallel:

| Process | URL |
| --- | --- |
| Client (Vite) | http://localhost:5173 |
| Server (NestJS + Colyseus) | http://localhost:2567 |
| Health-check | http://localhost:2567/health |

Separately:

```bash
npm run build              # shared → server → client
npm run start              # production server build
npm run dev -w @dotwars/client
npm run dev -w @dotwars/server
```

The mini app opens inside Telegram. In a regular browser the UI works; the Telegram SDK does not initialize — that is expected.

---

## Monorepo layout

```
dotwars/
├── apps/
│   ├── client/          # Vite + React + Tailwind + PixiJS + Telegram SDK
│   └── server/          # NestJS + Colyseus (authoritative game server)
├── packages/
│   └── shared/          # shared types, interfaces, DTOs, and Colyseus schemas
├── package.json         # npm workspaces, npm run dev
└── tsconfig.base.json
```

| Package | Name | Role |
| --- | --- | --- |
| `apps/client` | `@dotwars/client` | Mini App: field canvas (PixiJS) and React HUD |
| `apps/server` | `@dotwars/server` | HTTP API, matchmaking, `match` room, simulation |
| `packages/shared` | `@dotwars/shared` | single contract for client and server |

New types, WebSocket messages, and state schemas are added only in `packages/shared`. Client and server import them instead of duplicating.

---

## Authoritative Server

Game logic follows the **Authoritative Server** pattern.

The full simulation lives on the server: troop updates, collisions, unit movement, winner checks. The client **does not** resolve combat and **does not** decide the match. It sends an intent (for example, “send troops from base A to base B”) and renders **State Sync**: Colyseus sends a `GameState` delta, not a full snapshot every frame.

Client-side cheats cannot change the world. PixiJS is a display layer, not the source of truth.

Player identity is the Gram/TON wallet. On local dev, Connect wallet is a login stub. Production will verify `ton_proof`.
