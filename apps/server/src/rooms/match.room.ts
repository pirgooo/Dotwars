import { Client, Room } from "colyseus";
import {
  applyArrival,
  applyGrowth,
  applyLaunch,
  BaseState,
  BOT_PLAYER_ID,
  ClientMessage,
  chooseBotPortion,
  collectAliveOwners,
  COUNTDOWN_SECONDS,
  createStarterMap,
  MATCH_DURATION_SECONDS,
  pickMapIndex,
  GameState,
  PLAYER_COLORS,
  PlayerState,
  resolveTimeoutWinner,
  resolveWinner,
  stepTroop,
  STREAM_GAP,
  troopsForPortion,
  type SendPortion,
  TroopState,
  type SendTroopsPayload,
} from "@dotwars/shared";

interface SpawnJob {
  at: number;
  ownerId: string;
  fromBaseId: string;
  toBaseId: string;
}

export class MatchRoom extends Room<GameState> {
  maxClients = 2;
  patchRate = 50;
  state = new GameState();


  private simTime = 0;
  private troopSeq = 0;
  private nextBotAt = 4;
  private bluePlayerId = "";
  private redPlayerId = BOT_PLAYER_ID;
  private growAcc = new Map<string, number>();
  private spawnQueue: SpawnJob[] = [];
  private lobbyEndsAt = 0;

  onCreate() {
    this.onMessage(ClientMessage.SendTroops, (client, payload: SendTroopsPayload) => {
      if (!payload?.fromBaseId || !payload.toBaseId) {
        return;
      }
      const portion: SendPortion = payload.portion === "all" ? "all" : "half";
      this.trySendTroops(client.sessionId, payload.fromBaseId, payload.toBaseId, portion);
    });
    this.onMessage(ClientMessage.RestartMatch, () => {
      this.restartMatch();
    });
    this.setSimulationInterval((ms) => this.tick(ms / 1000), 50);
  }

  onJoin(client: Client, options?: { name?: string; telegramId?: number }) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.telegramId = options?.telegramId ?? 0;

    if (this.clients.length <= 1) {
      this.removeHumanPlayersExcept(client.sessionId);
      player.name = options?.name ?? "Синие";
      player.color = PLAYER_COLORS[0];
      this.state.players.set(client.sessionId, player);
      this.bluePlayerId = client.sessionId;
      this.redPlayerId = BOT_PLAYER_ID;
      this.beginWaiting();
      return;
    }

    if (this.state.phase === "playing") {
      throw new Error("match in progress");
    }

    player.name = options?.name ?? "Красные";
    player.color = PLAYER_COLORS[1];
    this.state.players.set(client.sessionId, player);
    this.seatRedPlayer(client.sessionId);
    if (this.state.phase === "ended") {
      this.beginWaiting();
      return;
    }
    this.state.countdown = COUNTDOWN_SECONDS;
    this.lobbyEndsAt = Date.now() + COUNTDOWN_SECONDS * 1000;
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    if (client.sessionId === this.bluePlayerId) {
      this.bluePlayerId = BOT_PLAYER_ID;
      this.releaseSeatToBot(client.sessionId);
      this.swapIfNeeded();
    } else if (client.sessionId === this.redPlayerId) {
      this.redPlayerId = BOT_PLAYER_ID;
      this.releaseSeatToBot(client.sessionId);
    }
    this.syncJoinLock();
    if (this.clients.length === 0) {
      this.lobbyEndsAt = 0;
    }
  }

  private beginWaiting() {
    this.maxClients = 2;
    void this.unlock();
    this.resetField();
    this.state.phase = "waiting";
    this.state.countdown = COUNTDOWN_SECONDS;
    this.state.timeLeft = MATCH_DURATION_SECONDS;
    this.state.timedOut = false;
    this.lobbyEndsAt = Date.now() + COUNTDOWN_SECONDS * 1000;
  }

  private beginPlaying() {
    if (this.clients.length === 0) {
      this.lobbyEndsAt = 0;
      return;
    }
    this.lobbyEndsAt = 0;
    this.state.countdown = 0;
    this.state.timeLeft = MATCH_DURATION_SECONDS;
    this.state.timedOut = false;
    this.state.winnerId = "";
    this.state.phase = "playing";
    this.simTime = 0;
    this.nextBotAt = 4;
    this.maxClients = this.state.versusBot ? 1 : 2;
    this.syncJoinLock();
  }

  private restartMatch() {
    if (this.state.phase !== "ended") {
      return;
    }
    this.beginWaiting();
  }

  private resetField() {
    this.simTime = 0;
    this.troopSeq = 0;
    this.nextBotAt = 4;
    this.spawnQueue = [];
    this.growAcc.clear();
    this.clearCollection(this.state.troops);
    this.clearCollection(this.state.bases);

    if (this.redPlayerId === BOT_PLAYER_ID || this.bluePlayerId === BOT_PLAYER_ID) {
      this.ensureBotPlayer();
    } else {
      this.state.players.delete(BOT_PLAYER_ID);
    }

    this.state.seed = pickMapIndex(this.state.seed);
    for (const spec of createStarterMap(this.bluePlayerId, this.redPlayerId, this.state.seed)) {
      const base = new BaseState();
      base.id = spec.id;
      base.x = spec.x;
      base.y = spec.y;
      base.garrison = spec.garrison;
      base.ownerId = spec.ownerId;
      this.state.bases.set(spec.id, base);
      this.growAcc.set(spec.id, 0);
    }

    this.state.versusBot = this.redPlayerId === BOT_PLAYER_ID || this.bluePlayerId === BOT_PLAYER_ID;
    this.state.winnerId = "";
    this.state.timedOut = false;
    this.state.timeLeft = MATCH_DURATION_SECONDS;
  }

  private syncJoinLock() {
    if (this.state.phase === "playing" || this.state.phase === "ended") {
      void this.lock();
      return;
    }
    void this.unlock();
  }

  private seatRedPlayer(playerId: string) {
    this.transferOwner(BOT_PLAYER_ID, playerId);
    this.redPlayerId = playerId;
    this.state.players.delete(BOT_PLAYER_ID);
    this.state.versusBot = false;
  }

  private releaseSeatToBot(fromId: string) {
    this.ensureBotPlayer();
    this.transferOwner(fromId, BOT_PLAYER_ID);
    this.state.versusBot = true;
  }

  private swapIfNeeded() {
    if (this.bluePlayerId !== BOT_PLAYER_ID || this.redPlayerId === BOT_PLAYER_ID) {
      return;
    }
    this.bluePlayerId = this.redPlayerId;
    this.redPlayerId = BOT_PLAYER_ID;
  }

  private ensureBotPlayer() {
    if (this.state.players.has(BOT_PLAYER_ID)) {
      return;
    }
    const bot = new PlayerState();
    bot.id = BOT_PLAYER_ID;
    bot.name = "Bot";
    bot.color = PLAYER_COLORS[1];
    this.state.players.set(BOT_PLAYER_ID, bot);
  }

  private transferOwner(fromId: string, toId: string) {
    this.state.bases.forEach((base) => {
      if (base.ownerId === fromId) {
        base.ownerId = toId;
      }
    });
    this.state.troops.forEach((troop) => {
      if (troop.ownerId === fromId) {
        troop.ownerId = toId;
      }
    });
    for (const job of this.spawnQueue) {
      if (job.ownerId === fromId) {
        job.ownerId = toId;
      }
    }
  }

  private clearCollection(collection: { forEach: (cb: (value: unknown, key: string) => void) => void; delete: (key: string) => void }) {
    const ids: string[] = [];
    collection.forEach((_value, id) => ids.push(id));
    for (const id of ids) {
      collection.delete(id);
    }
  }

  private trySendTroops(
    ownerId: string,
    fromBaseId: string,
    toBaseId: string,
    portion: SendPortion,
  ) {
    if (this.state.phase !== "playing" || fromBaseId === toBaseId) {
      return;
    }

    const from = this.state.bases.get(fromBaseId);
    const to = this.state.bases.get(toBaseId);
    if (!from || !to || from.ownerId !== ownerId) {
      return;
    }

    const count = troopsForPortion(from.garrison, portion);
    if (count <= 0) {
      return;
    }

    from.garrison = applyLaunch(from.garrison, count);
    for (let i = 0; i < count; i += 1) {
      this.spawnQueue.push({
        at: this.simTime + i * STREAM_GAP,
        ownerId,
        fromBaseId,
        toBaseId,
      });
    }
  }

  private tick(dt: number) {
    if (this.state.phase === "waiting") {
      if (this.clients.length === 0 || this.lobbyEndsAt === 0) {
        return;
      }
      const left = (this.lobbyEndsAt - Date.now()) / 1000;
      this.state.countdown = Math.max(0, left);
      if (left <= 0) {
        this.beginPlaying();
      }
      return;
    }

    if (this.state.phase !== "playing") {
      return;
    }

    this.simTime += dt;
    this.state.timeLeft = Math.max(0, this.state.timeLeft - dt);
    this.flushSpawns();
    this.moveTroops(dt);
    this.growBases(dt);
    this.tickBot();
    if (this.state.timeLeft <= 0) {
      this.endByTimeout();
      return;
    }
    this.checkWinner();
  }

  private removeHumanPlayersExcept(keepId: string) {
    const remove: string[] = [];
    this.state.players.forEach((_player, id) => {
      if (id !== keepId && id !== BOT_PLAYER_ID) {
        remove.push(id);
      }
    });
    for (const id of remove) {
      this.state.players.delete(id);
    }
  }

  private checkWinner() {
    if (this.clients.length === 0) {
      return;
    }

    const contestants: string[] = [];
    this.state.players.forEach((player) => contestants.push(player.id));
    if (contestants.length < 2) {
      return;
    }

    const bases: { ownerId: string }[] = [];
    this.state.bases.forEach((base) => bases.push(base));
    const troops: { ownerId: string }[] = [];
    this.state.troops.forEach((troop) => troops.push(troop));

    const alive = collectAliveOwners(
      bases,
      troops,
      this.spawnQueue.map((job) => job.ownerId),
    );
    const winnerId = resolveWinner(contestants, alive);
    if (!winnerId) {
      return;
    }

    this.state.winnerId = winnerId;
    this.state.timedOut = false;
    this.state.phase = "ended";
    this.spawnQueue = [];
    this.syncJoinLock();
  }

  private endByTimeout() {
    const bases: { ownerId: string; garrison: number }[] = [];
    this.state.bases.forEach((base) => bases.push(base));
    const troops: { ownerId: string }[] = [];
    this.state.troops.forEach((troop) => troops.push(troop));
    this.state.winnerId =
      resolveTimeoutWinner(
        this.bluePlayerId,
        this.redPlayerId,
        bases,
        troops,
        this.spawnQueue.map((job) => job.ownerId),
      ) ?? "";
    this.state.timedOut = true;
    this.state.timeLeft = 0;
    this.state.phase = "ended";
    this.spawnQueue = [];
    this.syncJoinLock();
  }

  private flushSpawns() {
    const ready: SpawnJob[] = [];
    const waiting: SpawnJob[] = [];
    for (const job of this.spawnQueue) {
      if (job.at <= this.simTime) {
        ready.push(job);
      } else {
        waiting.push(job);
      }
    }
    this.spawnQueue = waiting;

    for (const job of ready) {
      const from = this.state.bases.get(job.fromBaseId);
      if (!from) {
        continue;
      }
      const troop = new TroopState();
      troop.id = `troop-${this.troopSeq}`;
      this.troopSeq += 1;
      troop.ownerId = job.ownerId;
      troop.fromBaseId = job.fromBaseId;
      troop.toBaseId = job.toBaseId;
      troop.x = from.x;
      troop.y = from.y;
      this.state.troops.set(troop.id, troop);
    }
  }

  private moveTroops(dt: number) {
    const arrived: string[] = [];

    this.state.troops.forEach((troop) => {
      const target = this.state.bases.get(troop.toBaseId);
      if (!target) {
        arrived.push(troop.id);
        return;
      }

      const next = stepTroop(troop.x, troop.y, target.x, target.y, dt);
      troop.x = next.x;
      troop.y = next.y;
      if (!next.arrived) {
        return;
      }

      const result = applyArrival(target.garrison, target.ownerId, troop.ownerId);
      target.garrison = result.garrison;
      target.ownerId = result.ownerId;
      arrived.push(troop.id);
    });

    for (const id of arrived) {
      this.state.troops.delete(id);
    }
  }

  private growBases(dt: number) {
    this.state.bases.forEach((base) => {
      const acc = this.growAcc.get(base.id) ?? 0;
      const grown = applyGrowth(base.garrison, base.ownerId, acc, dt);
      base.garrison = grown.garrison;
      this.growAcc.set(base.id, grown.growAcc);
    });
  }

  private tickBot() {
    if (!this.state.versusBot || this.simTime < this.nextBotAt) {
      return;
    }
    this.nextBotAt = this.simTime + 3.5;

    let source: BaseState | undefined;
    this.state.bases.forEach((base) => {
      if (base.ownerId !== BOT_PLAYER_ID) {
        return;
      }
      if (!source || base.garrison > source.garrison) {
        source = base;
      }
    });
    if (!source || source.garrison < 4) {
      return;
    }

    let botBaseCount = 0;
    this.state.bases.forEach((base) => {
      if (base.ownerId === BOT_PLAYER_ID) {
        botBaseCount += 1;
      }
    });

    let target: BaseState | undefined;
    let best = Number.POSITIVE_INFINITY;
    this.state.bases.forEach((base) => {
      if (base.ownerId === BOT_PLAYER_ID || !source) {
        return;
      }
      const dist = Math.hypot(base.x - source.x, base.y - source.y);
      if (dist < best) {
        best = dist;
        target = base;
      }
    });
    if (!target) {
      return;
    }

    const portion = chooseBotPortion(source.garrison, target.garrison, botBaseCount);
    this.trySendTroops(BOT_PLAYER_ID, source.id, target.id, portion);
  }
}
