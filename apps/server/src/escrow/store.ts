import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type EscrowMatchStatus = "awaiting" | "locked" | "settled" | "refunded";

export interface EscrowMatch {
  roomId: string;
  stakeGrams: number;
  stakeNano: string;
  rakeBps: number;
  hostWallet: string;
  guestWallet: string;
  hostTx: string;
  guestTx: string;
  usedTx: string[];
  status: EscrowMatchStatus;
  payoutTx: string;
  payoutNote: string;
  updatedAt: number;
}

const filePath = join(process.cwd(), "data", "escrow.json");
const matches = new Map<string, EscrowMatch>();
let loaded = false;
let writeChain: Promise<void> = Promise.resolve();

async function load() {
  if (loaded) {
    return;
  }
  loaded = true;
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as EscrowMatch[];
    for (const row of parsed) {
      matches.set(row.roomId, row);
    }
  } catch {
    matches.clear();
  }
}

function persist() {
  writeChain = writeChain.then(async () => {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify([...matches.values()], null, 2), "utf8");
  });
  return writeChain;
}

export async function upsertEscrow(row: EscrowMatch): Promise<EscrowMatch> {
  await load();
  matches.set(row.roomId, { ...row, updatedAt: Date.now() });
  await persist();
  return matches.get(row.roomId)!;
}

export async function getEscrow(roomId: string): Promise<EscrowMatch | undefined> {
  await load();
  return matches.get(roomId);
}

export async function listOpenEscrows(): Promise<EscrowMatch[]> {
  await load();
  return [...matches.values()].filter((row) => row.status === "awaiting" || row.status === "locked");
}

export function usedTxTaken(hash: string, exceptRoomId: string): boolean {
  const needle = hash.toLowerCase();
  for (const row of matches.values()) {
    if (row.roomId === exceptRoomId) {
      continue;
    }
    if (row.usedTx.some((item) => item.toLowerCase() === needle)) {
      return true;
    }
  }
  return false;
}
