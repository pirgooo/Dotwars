import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { shortWalletName, type PlayerProfile } from "@dotwars/shared";

const filePath = join(process.cwd(), "data", "players.json");

export type StoredPlayer = PlayerProfile;

let cache: Map<string, StoredPlayer> | null = null;
let writeChain: Promise<void> = Promise.resolve();

async function load(): Promise<Map<string, StoredPlayer>> {
  if (cache) {
    return cache;
  }
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredPlayer[];
    cache = new Map(parsed.map((player) => [player.address, player]));
  } catch {
    cache = new Map();
  }
  return cache;
}

function persist(map: Map<string, StoredPlayer>) {
  writeChain = writeChain.then(async () => {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify([...map.values()], null, 2), "utf8");
  });
  return writeChain;
}

export async function getOrCreatePlayer(address: string): Promise<StoredPlayer> {
  const map = await load();
  const existing = map.get(address);
  if (existing) {
    return existing;
  }
  const player: StoredPlayer = {
    address,
    name: shortWalletName(address),
    wins: 0,
    losses: 0,
    draws: 0,
    games: 0,
  };
  map.set(address, player);
  await persist(map);
  return player;
}

export async function getPlayer(address: string): Promise<StoredPlayer | null> {
  const map = await load();
  return map.get(address) ?? null;
}

export async function setPlayerName(address: string, name: string): Promise<StoredPlayer | null> {
  const map = await load();
  const player = map.get(address);
  if (!player) {
    return null;
  }
  player.name = name;
  await persist(map);
  return player;
}

export async function setPlayerStub(address: string, stub: boolean): Promise<StoredPlayer> {
  const player = await getOrCreatePlayer(address);
  player.stub = stub;
  const map = await load();
  map.set(address, player);
  await persist(map);
  return player;
}

export async function recordMatchResult(address: string, result: "win" | "loss" | "draw"): Promise<void> {
  const player = await getOrCreatePlayer(address);
  player.games += 1;
  if (result === "win") {
    player.wins += 1;
  } else if (result === "loss") {
    player.losses += 1;
  } else {
    player.draws += 1;
  }
  const map = await load();
  map.set(address, player);
  await persist(map);
}
