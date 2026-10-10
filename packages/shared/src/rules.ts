export const TROOP_SPEED = 0.42;
export const STREAM_SIZE = 10;
export const STREAM_GAP = 0.048;
export type SendPortion = "half" | "all";
export const GROW_RATE = 1;
export const GARRISON_CAP = 99;
export const BASE_RADIUS = 0.056;
export const BOT_PLAYER_ID = "bot";
export const NEUTRAL_OWNER_ID = "";
export const COUNTDOWN_SECONDS = 3;
export const MATCH_DURATION_SECONDS = 180;

export function isOwned(ownerId: string): boolean {
  return ownerId !== NEUTRAL_OWNER_ID;
}

export function troopsToSend(garrison: number, requested = STREAM_SIZE): number {
  return Math.min(requested, Math.max(0, Math.floor(garrison)));
}

export function troopsForPortion(garrison: number, portion: SendPortion): number {
  const available = Math.max(0, Math.floor(garrison));
  if (portion === "all") {
    return available;
  }
  return Math.floor(available / 2);
}

export function chooseBotPortion(
  sourceGarrison: number,
  targetGarrison: number,
  botBaseCount: number,
): SendPortion {
  const half = troopsForPortion(sourceGarrison, "half");
  const all = troopsForPortion(sourceGarrison, "all");
  const halfTakes = half >= targetGarrison;
  const allTakes = all >= targetGarrison;

  if (botBaseCount <= 1) {
    return half > 0 ? "half" : "all";
  }
  if (halfTakes) {
    return "half";
  }
  if (allTakes) {
    return "all";
  }
  return "half";
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
  aId: string,
  bId: string,
  bases: Iterable<{ ownerId: string; garrison: number }>,
  troops: Iterable<{ ownerId: string }>,
  pendingOwnerIds: Iterable<string> = [],
): string | null {
  const a = ownerScore(aId, bases, troops, pendingOwnerIds);
  const b = ownerScore(bId, bases, troops, pendingOwnerIds);
  if (a.bases !== b.bases) {
    return a.bases > b.bases ? aId : bId;
  }
  if (a.power !== b.power) {
    return a.power > b.power ? aId : bId;
  }
  return null;
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
