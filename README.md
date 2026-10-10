# Dot Wars

Telegram Mini App. A PvP RTS in the style of [State.io](https://state.io): capture bases, send troops, hold the map.

**Play:** [Open in Telegram](https://t.me/dotwars_bot/Dotwars) · [Web](https://dotwars.candysshare.online)

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

## What’s in this release

- Vs bots (two-bot FFA) and invite 1v1 PvP
- Guest duel screen: accept / decline
- Invite PvP escrow: non-custodial TON contract, 10% rake, winner payout / draw refund
- Gram/TON wallet login (`ton_proof`); temporary **DEV** stub for demos
- Origami Klein-blue UI, fullscreen Mini App, iPhone safe area
- Live host: `dotwars.candysshare.online`

Public matchmaking (**Find a match**) is a Coming soon stub. Stats live in a JSON file on the server, not Postgres yet.

---

## Versioning

The game is **one version** for the whole monorepo (`0.3.0` now). Client, server, `shared`, and the escrow contract keep the same number. Do not version packages separately.

Source of truth: a git tag `vX.Y.Z` plus a [GitHub Release](https://github.com/pirgooo/Dotwars/releases).

| Bump | When |
| --- | --- |
| `MAJOR` (`v1.0.0`) | Breaking protocol or a public 1.0 |
| `MINOR` (`v0.3.0`) | Features (queue, escrow, …) |
| `PATCH` (`v0.2.1`) | Fixes |

Until 1.0 we stay on `0.x`. Release: merge to `main` → tag → GitHub Release → pull and rebuild on the VPS. The main menu shows `vX.Y.Z` in the bottom-right corner from `@dotwars/client`’s `package.json`.

---

## Stack

| Layer | Tech |
| --- | --- |
| Monorepo | TypeScript, npm workspaces |
| Client | Vite, React, Tailwind CSS v4, PixiJS v8, `@telegram-apps/sdk`, TonConnect |
| Server | Node.js 20+, NestJS, Colyseus |
| Data | JSON player store (`apps/server/data`) |
| Contract | `@dotwars/shared` — types, DTOs, Colyseus schemas |

---

## Local setup

Requires **Node.js 20+**.

```bash
git clone https://github.com/pirgooo/Dotwars.git
cd Dotwars
npm install
cp apps/server/.env.example apps/server/.env
npm run dev
```

`npm run dev` builds `packages/shared` and starts in parallel:

| Process | URL |
| --- | --- |
| Client (Vite) | http://localhost:5173 |
| Server (NestJS + Colyseus) | http://localhost:2567 |
| Health-check | http://localhost:2567/health |

```bash
npm run build              # shared → server → client
npm run start              # production server build
```

In a regular browser the UI works; Telegram chrome is skipped. Use **DEV** to log in without a wallet.

---

## Production

Live Mini App: [https://t.me/dotwars_bot/Dotwars](https://t.me/dotwars_bot/Dotwars)

Nginx, systemd, and env templates for `dotwars.candysshare.online` are in [`deploy/`](./deploy).

Client build-time env (`apps/client/.env.production`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | HTTPS API origin |
| `VITE_COLYSEUS_URL` | `wss://` game server |
| `VITE_TELEGRAM_APP_URL` | Invite deep link (`https://t.me/dotwars_bot/Dotwars`) |

Server env (`apps/server/.env`):

| Variable | Purpose |
| --- | --- |
| `SESSION_SECRET` | Required in production |
| `ALLOW_STUB_AUTH` | `1` keeps the **DEV** login |
| `TON_PROOF_DOMAINS` | Domains allowed in `ton_proof` |
| `ESCROW_CONTRACT` | Deployed escrow contract (holds stakes) |
| `ORACLE_WALLET` | Server signer, Wallet v4R2 (cannot withdraw the pot) |
| `ORACLE_MNEMONIC` | Oracle key: open / settle / refund only |
| `TREASURY_ADDRESS` | Rake recipient baked into the contract at deploy |
| `RAKE_BPS` | House cut in basis points (`1000` = 10% of the pot) |
| `GRAM_NANOTON` | Nanoton per 1 GRAM (`1000000000` = 1 TON) |
| `TON_ENDPOINT` | Toncenter JSON-RPC |
| `TON_API_KEY` | Toncenter API key |

---

## Monorepo layout

```
dotwars/
├── apps/
│   ├── client/          # Vite + React + Tailwind + PixiJS + Telegram SDK
│   └── server/          # NestJS + Colyseus (authoritative game server)
├── packages/
│   ├── shared/          # types, DTOs, Colyseus schemas
│   └── escrow-contract/ # Tact escrow (non-custodial)
├── deploy/              # nginx, systemd, production env templates
├── package.json
└── tsconfig.base.json
```

| Package | Name | Role |
| --- | --- | --- |
| `apps/client` | `@dotwars/client` | Mini App: field canvas and React HUD |
| `apps/server` | `@dotwars/server` | HTTP API, invites, `match` room, simulation |
| `packages/shared` | `@dotwars/shared` | client/server DTO contract |
| `packages/escrow-contract` | `@dotwars/escrow-contract` | TON escrow: stakes stay on-chain |

New types, WebSocket messages, and state schemas are added only in `packages/shared`.

---

## Authoritative Server

The full simulation lives on the server: troop updates, collisions, unit movement, winner checks. The client **does not** resolve combat. It sends an intent (for example, “send troops from base A to base B”) and renders **State Sync**.

Player identity is the Gram/TON wallet. The server verifies `ton_proof` and issues a session bound to the address. **DEV** is a stub for tests and demos only.

---

## License

[MIT](./LICENSE)
