import { Client, Room, ServerError } from "colyseus";
import { verifySession } from "../auth/session";
import { registerInvite, unregisterInvite } from "./invite-store";
import { getPlayer, recordMatchResult, type StoredPlayer } from "../auth/player-store";
import {
  applyArrival,
  applyGrowth,
  applyLaunch,
  BaseState,
  BOT_A_ID,
  BOT_B_ID,
  BOT_PLAYER_IDS,
  chooseBotMove,
  isBotId,
  ClientMessage,
  collectAliveOwners,
  COUNTDOWN_SECONDS,
  type MatchMode,
  createStarterMap,
  MATCH_DURATION_SECONDS,
  ownerScore,
  pickMapIndex,
  GameState,
  PLAYER_COLORS,
  PlayerState,
  resolveTimeoutWinner,
  resolveTroopCollisions,
  resolveWinner,
  stepTroop,
  STREAM_GAP,
  troopsToSend,
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
  private nextBotAt = new Map<string, number>();
  private lastBotMoveAt = -10;
  private bluePlayerId = "";
  private redPlayerId = "";
  private growAcc = new Map<string, number>();
  private spawnQueue: SpawnJob[] = [];
  private lobbyEndsAt = 0;
  private mode: MatchMode = "bot";
  private queue: "open" | "private" = "open";
  private statsRecorded = false;

  onCreate(options?: { mode?: string; queue?: string }) {
    this.mode = options?.mode === "pvp" ? "pvp" : "bot";
    this.queue = options?.queue === "private" ? "private" : "open";
    this.maxClients = this.mode === "bot" ? 1 : 2;
    this.setMetadata({ mode: this.mode, queue: this.queue });
    if (this.queue === "private") {
      void this.setPrivate(true);
    }
    this.onMessage(ClientMessage.SendTroops, (client, payload: SendTroopsPayload) => {
      if (!payload?.fromBaseId || !payload.toBaseId) {
        return;
      }
      this.trySendTroops(client.sessionId, payload.fromBaseId, payload.toBaseId);
    });
    this.onMessage(ClientMessage.RestartMatch, () => {
      this.restartMatch();
    });
    this.setSimulationInterval((ms) => this.tick(ms / 1000), 50);
  }

  async onAuth(_client: Client, options?: { token?: string }) {
    const session = verifySession(options?.token);
    if (!session) {
      throw new ServerError(401, "Connect Gram wallet");
    }
    const profile = await getPlayer(session.address);
    if (!profile) {
      throw new ServerError(401, "Connect Gram wallet");
    }
    return profile;
  }

  onJoin(client: Client) {
    const profile = client.auth as StoredPlayer;
    const player = new PlayerState();
    player.id = client.sessionId;
    player.walletAddress = profile.address;
    player.name = profile.name;
    player.telegramId = 0;

    if (this.clients.length <= 1) {
      this.removeHumanPlayersExcept(client.sessionId);
      player.color = PLAYER_COLORS[0];
      this.state.players.set(client.sessionId, player);
      this.bluePlayerId = client.sessionId;
      this.redPlayerId = "";
      if (this.mode === "pvp") {
        this.beginQueue();
      } else {
        this.beginWaiting();
      }
      this.publishPrivateInvite();
      return;
    }

    if (this.walletAlreadySeated(profile.address, client.sessionId)) {
      throw new ServerError(409, "Already in this match");
    }

    if (this.state.phase === "playing") {
      throw new ServerError(409, "match in progress");
    }

    player.color = PLAYER_COLORS[1];
    this.state.players.set(client.sessionId, player);
    this.redPlayerId = client.sessionId;
    unregisterInvite(this.roomId);
    this.beginWaiting();
  }

  onLeave(client: Client) {
    const leaving = this.state.players.get(client.sessionId);
    this.state.players.delete(client.sessionId);
    if (this.clients.length === 0) {
      this.lobbyEndsAt = 0;
      unregisterInvite(this.roomId);
      if (this.state.phase === "playing") {
        this.state.winnerId = this.mode === "bot" ? BOT_A_ID : "";
        this.state.timedOut = false;
        this.state.phase = "ended";
        this.spawnQueue = [];
        this.recordHumanStats(leaving?.walletAddress);
      }
      this.syncJoinLock();
      return;
    }
    this.bluePlayerId = this.clients[0].sessionId;
    this.redPlayerId = "";
    const remaining = this.state.players.get(this.bluePlayerId);
    if (remaining) {
      remaining.color = PLAYER_COLORS[0];
    }
    if (this.mode === "pvp") {
      if (this.state.phase === "playing") {
        this.state.winnerId = this.bluePlayerId;
        this.state.timedOut = false;
        this.state.phase = "ended";
        this.spawnQueue = [];
        this.recordHumanStats(leaving?.walletAddress);
        this.syncJoinLock();
        return;
      }
      if (this.state.phase === "ended") {
        this.syncJoinLock();
        return;
      }
      this.beginQueue();
      return;
    }
    this.beginWaiting();
  }

  private beginQueue() {
    this.maxClients = 2;
    void this.unlock();
    this.simTime = 0;
    this.troopSeq = 0;
    this.spawnQueue = [];
    this.growAcc.clear();
    this.clearCollection(this.state.troops);
    this.clearCollection(this.state.bases);
    this.clearBotPlayers();
    this.state.versusBot = false;
    this.state.seekingOpponent = true;
    this.state.phase = "waiting";
    this.state.countdown = 0;
    this.state.timeLeft = MATCH_DURATION_SECONDS;
    this.state.timedOut = false;
    this.state.winnerId = "";
    this.lobbyEndsAt = 0;
    this.statsRecorded = false;
    this.publishPrivateInvite();
  }

  private beginWaiting() {
    this.maxClients = this.mode === "bot" ? 1 : 2;
    void this.unlock();
    this.resetField();
    this.state.seekingOpponent = false;
    this.state.phase = "waiting";
    this.state.countdown = COUNTDOWN_SECONDS;
    this.state.timeLeft = MATCH_DURATION_SECONDS;
    this.state.timedOut = false;
    this.lobbyEndsAt = Date.now() + COUNTDOWN_SECONDS * 1000;
    this.statsRecorded = false;
  }

  private beginPlaying() {
    if (this.clients.length === 0) {
      this.lobbyEndsAt = 0;
      return;
    }
    this.lobbyEndsAt = 0;
    this.state.seekingOpponent = false;
    this.state.countdown = 0;
    this.state.timeLeft = MATCH_DURATION_SECONDS;
    this.state.timedOut = false;
    this.state.winnerId = "";
    this.state.phase = "playing";
    this.simTime = 0;
    this.nextBotAt = new Map([
      [BOT_A_ID, 3.3],
      [BOT_B_ID, 6.2],
    ]);
    this.lastBotMoveAt = -10;
    this.maxClients = this.state.versusBot ? 1 : 2;
    this.syncJoinLock();
  }

  private restartMatch() {
    if (this.state.phase !== "ended") {
      return;
    }
    if (this.mode === "pvp" && this.clients.length < 2) {
      this.beginQueue();
      return;
    }
    this.beginWaiting();
  }

  private resetField() {
    this.simTime = 0;
    this.troopSeq = 0;
    this.nextBotAt = new Map([
      [BOT_A_ID, 3.3],
      [BOT_B_ID, 6.2],
    ]);
    this.lastBotMoveAt = -10;
    this.spawnQueue = [];
    this.growAcc.clear();
    this.clearCollection(this.state.troops);
    this.clearCollection(this.state.bases);

    this.state.versusBot = this.mode === "bot";
    if (this.state.versusBot) {
      this.ensureBotPlayers();
    } else {
      this.clearBotPlayers();
    }

    const owners = this.state.versusBot
      ? [this.bluePlayerId, ...BOT_PLAYER_IDS]
      : [this.bluePlayerId, this.redPlayerId];

    this.state.seed = pickMapIndex(this.state.seed);
    for (const spec of createStarterMap(owners, this.state.seed)) {
      const base = new BaseState();
      base.id = spec.id;
      base.x = spec.x;
      base.y = spec.y;
      base.garrison = spec.garrison;
      base.ownerId = spec.ownerId;
      base.polygon = spec.polygon;
      base.active = spec.active;
      this.state.bases.set(spec.id, base);
      this.growAcc.set(spec.id, 0);
    }

    this.state.winnerId = "";
    this.state.timedOut = false;
    this.state.timeLeft = MATCH_DURATION_SECONDS;
  }

  private walletAlreadySeated(address: string, exceptSessionId: string) {
    const needle = address.toLowerCase();
    let taken = false;
    this.state.players.forEach((player, id) => {
      if (id !== exceptSessionId && !isBotId(id) && player.walletAddress.toLowerCase() === needle) {
        taken = true;
      }
    });
    return taken;
  }

  private publishPrivateInvite() {
    if (this.queue !== "private") {
      return;
    }
    void this.setPrivate(true);
    const host = this.state.players.get(this.bluePlayerId) ?? this.state.players.get(this.clients[0]?.sessionId);
    if (host) {
      registerInvite(this.roomId, host.name);
    }
  }

  private syncJoinLock() {
    if (this.state.phase === "playing" || this.state.phase === "ended") {
      void this.lock();
      return;
    }
    void this.unlock();
  }

  private ensureBotPlayers() {
    const specs = [
      { id: BOT_A_ID, name: "Red", color: PLAYER_COLORS[1] },
      { id: BOT_B_ID, name: "Green", color: PLAYER_COLORS[2] },
    ];
    for (const spec of specs) {
      if (this.state.players.has(spec.id)) {
        continue;
      }
      const bot = new PlayerState();
      bot.id = spec.id;
      bot.name = spec.name;
      bot.color = spec.color;
      this.state.players.set(spec.id, bot);
    }
  }

  private clearBotPlayers() {
    for (const id of BOT_PLAYER_IDS) {
      this.state.players.delete(id);
    }
  }

  private clearCollection(collection: { forEach: (cb: (value: unknown, key: string) => void) => void; delete: (key: string) => void }) {
    const ids: string[] = [];
    collection.forEach((_value, id) => ids.push(id));
    for (const id of ids) {
      collection.delete(id);
    }
  }

  private trySendTroops(ownerId: string, fromBaseId: string, toBaseId: string) {
    if (this.state.phase !== "playing") {
      return;
    }

    const from = this.state.bases.get(fromBaseId);
    const to = this.state.bases.get(toBaseId);
    if (!from || !to || !from.active || !to.active || from.ownerId !== ownerId || fromBaseId === toBaseId) {
      return;
    }

    const pending = this.spawnQueue.filter(
      (job) => job.ownerId === ownerId && job.fromBaseId === fromBaseId,
    );
    const extra = troopsToSend(from.garrison);
    const dests = [...new Set(pending.map((job) => job.toBaseId))];
    const isNewDest = !dests.includes(toBaseId);

    if (pending.length === 0) {
      if (extra <= 0) {
        return;
      }
      this.enqueueSpawns(ownerId, fromBaseId, toBaseId, extra, this.simTime);
      from.garrison = applyLaunch(from.garrison, extra);
      return;
    }

    if (!isNewDest) {
      if (extra <= 0) {
        return;
      }
      const lastAt = pending.reduce((max, job) => Math.max(max, job.at), this.simTime);
      this.enqueueSpawns(ownerId, fromBaseId, toBaseId, extra, lastAt + STREAM_GAP);
      from.garrison = applyLaunch(from.garrison, extra);
      return;
    }

    dests.push(toBaseId);
    if (extra > 0) {
      from.garrison = applyLaunch(from.garrison, extra);
    }
    pending.forEach((job, index) => {
      job.toBaseId = dests[index % dests.length];
    });
    if (extra <= 0) {
      return;
    }
    const lastAt = pending.reduce((max, job) => Math.max(max, job.at), this.simTime);
    for (let i = 0; i < extra; i += 1) {
      this.spawnQueue.push({
        at: lastAt + (i + 1) * STREAM_GAP,
        ownerId,
        fromBaseId,
        toBaseId: dests[(pending.length + i) % dests.length],
      });
    }
  }

  private enqueueSpawns(
    ownerId: string,
    fromBaseId: string,
    toBaseId: string,
    count: number,
    startAt: number,
  ) {
    for (let i = 0; i < count; i += 1) {
      this.spawnQueue.push({
        at: startAt + i * STREAM_GAP,
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
    this.collideTroops();
    this.landArrivals();
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
      if (id !== keepId && !isBotId(id)) {
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
    this.state.bases.forEach((base) => {
      if (base.active) {
        bases.push(base);
      }
    });
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
    this.recordHumanStats();
    this.syncJoinLock();
  }

  private endByTimeout() {
    const bases: { ownerId: string; garrison: number }[] = [];
    this.state.bases.forEach((base) => {
      if (base.active) {
        bases.push(base);
      }
    });
    const troops: { ownerId: string }[] = [];
    this.state.troops.forEach((troop) => troops.push(troop));
    const contestants: string[] = [];
    this.state.players.forEach((player) => contestants.push(player.id));
    this.state.winnerId =
      resolveTimeoutWinner(
        contestants,
        bases,
        troops,
        this.spawnQueue.map((job) => job.ownerId),
      ) ?? "";
    this.state.timedOut = true;
    this.state.timeLeft = 0;
    this.state.phase = "ended";
    this.spawnQueue = [];
    this.recordHumanStats();
    this.syncJoinLock();
  }

  private recordHumanStats(forcedLoserWallet?: string) {
    if (this.statsRecorded) {
      return;
    }
    this.statsRecorded = true;
    const humans: { id: string; wallet: string }[] = [];
    this.state.players.forEach((player, id) => {
      if (!isBotId(id) && player.walletAddress) {
        humans.push({ id, wallet: player.walletAddress });
      }
    });
    if (forcedLoserWallet && !humans.some((human) => human.wallet === forcedLoserWallet)) {
      humans.push({ id: "", wallet: forcedLoserWallet });
    }
    const winnerId = this.state.winnerId;
    const timedOut = this.state.timedOut;
    const bases: { ownerId: string; garrison: number }[] = [];
    this.state.bases.forEach((base) => {
      if (base.active) {
        bases.push(base);
      }
    });
    const troops: { ownerId: string }[] = [];
    this.state.troops.forEach((troop) => troops.push(troop));
    const contestants: string[] = [];
    this.state.players.forEach((player) => contestants.push(player.id));
    const pending = this.spawnQueue.map((job) => job.ownerId);

    for (const human of humans) {
      let result: "win" | "loss" | "draw";
      if (winnerId === "" && timedOut && human.id) {
        const humanScore = ownerScore(human.id, bases, troops, pending);
        let bestBases = -1;
        let bestPower = -1;
        for (const id of contestants) {
          const score = ownerScore(id, bases, troops, pending);
          if (score.bases > bestBases || (score.bases === bestBases && score.power > bestPower)) {
            bestBases = score.bases;
            bestPower = score.power;
          }
        }
        result =
          humanScore.bases === bestBases && humanScore.power === bestPower ? "draw" : "loss";
      } else if (winnerId === "") {
        result = "draw";
      } else if (human.id && human.id === winnerId) {
        result = "win";
      } else {
        result = "loss";
      }
      void recordMatchResult(human.wallet, result);
    }
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
    const missing: string[] = [];
    this.state.troops.forEach((troop) => {
      const target = this.state.bases.get(troop.toBaseId);
      if (!target) {
        missing.push(troop.id);
        return;
      }
      const next = stepTroop(troop.x, troop.y, target.x, target.y, dt);
      troop.x = next.x;
      troop.y = next.y;
    });
    for (const id of missing) {
      this.state.troops.delete(id);
    }
  }

  private collideTroops() {
    const list: { id: string; ownerId: string; x: number; y: number }[] = [];
    this.state.troops.forEach((troop) => {
      list.push({ id: troop.id, ownerId: troop.ownerId, x: troop.x, y: troop.y });
    });
    for (const id of resolveTroopCollisions(list)) {
      this.state.troops.delete(id);
    }
  }

  private landArrivals() {
    const arrived: string[] = [];
    this.state.troops.forEach((troop) => {
      const target = this.state.bases.get(troop.toBaseId);
      if (!target) {
        arrived.push(troop.id);
        return;
      }
      const next = stepTroop(troop.x, troop.y, target.x, target.y, 0);
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
      if (!base.active) {
        return;
      }
      const acc = this.growAcc.get(base.id) ?? 0;
      const grown = applyGrowth(base.garrison, base.ownerId, acc, dt);
      base.garrison = grown.garrison;
      this.growAcc.set(base.id, grown.growAcc);
    });
  }

  private tickBot() {
    if (!this.state.versusBot) {
      return;
    }
    const provinces: { id: string; x: number; y: number; garrison: number; ownerId: string; active: boolean }[] =
      [];
    this.state.bases.forEach((base) => {
      provinces.push({
        id: base.id,
        x: base.x,
        y: base.y,
        garrison: base.garrison,
        ownerId: base.ownerId,
        active: base.active !== false,
      });
    });
    const gap = 2.4;
    for (const botId of BOT_PLAYER_IDS) {
      const due = this.nextBotAt.get(botId) ?? 0;
      if (this.simTime < due) {
        continue;
      }
      const wait = this.lastBotMoveAt + gap - this.simTime;
      if (wait > 0) {
        this.nextBotAt.set(botId, this.simTime + wait);
        continue;
      }
      const move = chooseBotMove(botId, provinces);
      const rest = botId === BOT_B_ID ? 3.5 : 2.8;
      this.nextBotAt.set(botId, this.simTime + (move ? rest : 1.1));
      if (move) {
        this.lastBotMoveAt = this.simTime;
        this.trySendTroops(botId, move.fromId, move.toId);
      }
    }
  }

  onDispose() {
    unregisterInvite(this.roomId);
  }
}
