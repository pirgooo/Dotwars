export const TROOP_SPEED = 0.336;
export const STREAM_GAP = 0.048;
export const GROW_RATE = 1;
export const GARRISON_CAP = 99;
export const BASE_RADIUS = 0.056;
export const TROOP_COLLIDE_RADIUS = 0.018;
export const BOT_A_ID = "bot-a";
export const BOT_B_ID = "bot-b";
export const BOT_PLAYER_IDS = [BOT_A_ID, BOT_B_ID] as const;
export const BOT_PLAYER_ID = BOT_A_ID;

export function isBotId(id: string): boolean {
  return id === BOT_A_ID || id === BOT_B_ID;
}
export const NEUTRAL_OWNER_ID = "";
export const COUNTDOWN_SECONDS = 3;
export const MATCH_DURATION_SECONDS = 180;

export function isOwned(ownerId: string): boolean {
  return ownerId !== NEUTRAL_OWNER_ID;
}

export function troopsToSend(garrison: number): number {
  return Math.max(0, Math.floor(garrison));
}

export function applyLaunch(garrison: number, count: number): number {
  return Math.max(0, garrison - count);
}

export function applyArrival(
  garrison: number,
  ownerId: string,
  attackerId: string,
): { garrison: number; ownerId: string } {
  if (ownerId === attackerId) {
    return { garrison: Math.min(GARRISON_CAP, garrison + 1), ownerId };
  }

  if (garrison > 0) {
    const next = garrison - 1;
    return {
      garrison: next,
      ownerId: next === 0 ? attackerId : ownerId,
    };
  }

  return { garrison: 1, ownerId: attackerId };
}

export function applyGrowth(
  garrison: number,
  ownerId: string,
  growAcc: number,
  dt: number,
): { garrison: number; growAcc: number } {
  if (!isOwned(ownerId) || garrison >= GARRISON_CAP) {
    return { garrison, growAcc };
  }

  let acc = growAcc + dt * GROW_RATE;
  let next = garrison;
  while (acc >= 1 && next < GARRISON_CAP) {
    acc -= 1;
    next += 1;
  }
  return { garrison: next, growAcc: acc };
}

export interface BotProvince {
  id: string;
  x: number;
  y: number;
  garrison: number;
  ownerId: string;
  active?: boolean;
}

export function chooseBotMove(
  botId: string,
  bases: readonly BotProvince[],
): { fromId: string; toId: string } | null {
  const mine: BotProvince[] = [];
  const others: BotProvince[] = [];
  for (const base of bases) {
    if (base.active === false) {
      continue;
    }
    if (base.ownerId === botId) {
      mine.push(base);
    } else {
      others.push(base);
    }
  }
  if (mine.length === 0 || others.length === 0) {
    return null;
  }

  let sources = mine.filter((base) => base.garrison >= 2);
  if (mine.length >= 3) {
    const cx = others.reduce((sum, base) => sum + base.x, 0) / others.length;
    const cy = others.reduce((sum, base) => sum + base.y, 0) / others.length;
    let rear = mine[0];
    let rearDist = -1;
    for (const base of mine) {
      const dist = Math.hypot(base.x - cx, base.y - cy);
      if (dist > rearDist) {
        rear = base;
        rearDist = dist;
      }
    }
    const fronts = sources.filter((base) => base.id !== rear.id);
    if (fronts.length > 0) {
      sources = fronts;
    }
  }
  if (sources.length === 0) {
    return null;
  }

  let best: { fromId: string; toId: string; score: number } | null = null;
  for (const source of sources) {
    for (const target of others) {
      if (source.garrison < target.garrison) {
        continue;
      }
      const dist = Math.hypot(source.x - target.x, source.y - target.y);
      const enemyPenalty = isOwned(target.ownerId) ? 0.1 : 0;
      const score = dist * 1.15 + target.garrison * 0.016 + enemyPenalty;
      if (!best || score < best.score) {
        best = { fromId: source.id, toId: target.id, score };
      }
    }
  }
  return best;
}

export function collectAliveOwners(
  bases: Iterable<{ ownerId: string }>,
  troops: Iterable<{ ownerId: string }>,
  pendingOwnerIds: Iterable<string> = [],
): Set<string> {
  const alive = new Set<string>();
  for (const base of bases) {
    if (isOwned(base.ownerId)) {
      alive.add(base.ownerId);
    }
  }
  for (const troop of troops) {
    if (troop.ownerId) {
      alive.add(troop.ownerId);
    }
  }
  for (const ownerId of pendingOwnerIds) {
    if (ownerId) {
      alive.add(ownerId);
    }
  }
  return alive;
}

export function resolveWinner(contestants: string[], alive: Set<string>): string | null {
  if (contestants.length < 2) {
    return null;
  }
  const standing = contestants.filter((id) => alive.has(id));
  return standing.length === 1 ? standing[0] : null;
}

export function ownerScore(
  ownerId: string,
  bases: Iterable<{ ownerId: string; garrison: number }>,
  troops: Iterable<{ ownerId: string }>,
  pendingOwnerIds: Iterable<string> = [],
): { bases: number; power: number } {
  let baseCount = 0;
  let power = 0;
  for (const base of bases) {
    if (base.ownerId === ownerId) {
      baseCount += 1;
      power += base.garrison;
    }
  }
  for (const troop of troops) {
    if (troop.ownerId === ownerId) {
      power += 1;
    }
  }
  for (const pending of pendingOwnerIds) {
    if (pending === ownerId) {
      power += 1;
    }
  }
  return { bases: baseCount, power };
}

export function resolveTimeoutWinner(
  contestants: string[],
  bases: Iterable<{ ownerId: string; garrison: number }>,
  troops: Iterable<{ ownerId: string }>,
  pendingOwnerIds: Iterable<string> = [],
): string | null {
  let bestId: string | null = null;
  let bestBases = -1;
  let bestPower = -1;
  let tied = false;
  for (const id of contestants) {
    const score = ownerScore(id, bases, troops, pendingOwnerIds);
    if (score.bases > bestBases || (score.bases === bestBases && score.power > bestPower)) {
      bestId = id;
      bestBases = score.bases;
      bestPower = score.power;
      tied = false;
      continue;
    }
    if (score.bases === bestBases && score.power === bestPower) {
      tied = true;
    }
  }
  return tied ? null : bestId;
}

export function resolveTroopCollisions(
  troops: readonly { id: string; ownerId: string; x: number; y: number }[],
): string[] {
  const pairs: { a: number; b: number; d: number }[] = [];
  for (let i = 0; i < troops.length; i += 1) {
    for (let j = i + 1; j < troops.length; j += 1) {
      if (troops[i].ownerId === troops[j].ownerId) {
        continue;
      }
      const d = Math.hypot(troops[i].x - troops[j].x, troops[i].y - troops[j].y);
      if (d <= TROOP_COLLIDE_RADIUS) {
        pairs.push({ a: i, b: j, d });
      }
    }
  }
  pairs.sort((left, right) => left.d - right.d);
  const dead = new Set<string>();
  for (const pair of pairs) {
    const a = troops[pair.a].id;
    const b = troops[pair.b].id;
    if (dead.has(a) || dead.has(b)) {
      continue;
    }
    dead.add(a);
    dead.add(b);
  }
  return [...dead];
}

export function stepTroop(
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  dt: number,
): { x: number; y: number; arrived: boolean } {
  const dx = targetX - x;
  const dy = targetY - y;
  const distance = Math.hypot(dx, dy);
  const step = TROOP_SPEED * dt;
  const arriveAt = Math.max(step, BASE_RADIUS * 0.35);

  if (distance <= arriveAt) {
    return { x: targetX, y: targetY, arrived: true };
  }

  return {
    x: x + (dx / distance) * step,
    y: y + (dy / distance) * step,
    arrived: false,
  };
}
