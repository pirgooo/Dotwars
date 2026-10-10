import { rakeGrams } from "@dotwars/shared";
import { getEscrowConfig, sameAddress, stakeToNano } from "./config";
import { getEscrow, listOpenEscrows, upsertEscrow, type EscrowMatch } from "./store";
import {
  depositPayload,
  readMatch,
  sendOpenMatch,
  sendRefund,
  sendRefundOne,
  sendSetGuest,
  sendSettle,
} from "./ton";

type EscrowListener = (row: EscrowMatch) => void;

const listeners = new Map<string, Set<EscrowListener>>();
let scanning = false;

function emit(row: EscrowMatch) {
  listeners.get(row.roomId)?.forEach((fn) => fn(row));
}

export function watchEscrow(roomId: string, fn: EscrowListener): () => void {
  const set = listeners.get(roomId) ?? new Set<EscrowListener>();
  set.add(fn);
  listeners.set(roomId, set);
  return () => {
    set.delete(fn);
    if (set.size === 0) {
      listeners.delete(roomId);
    }
  };
}

function maybeLock(row: EscrowMatch) {
  if (row.status === "awaiting" && row.hostTx && row.guestTx && row.guestWallet) {
    row.status = "locked";
  }
}

async function remember(row: EscrowMatch) {
  const saved = await upsertEscrow(row);
  emit(saved);
  return saved;
}

export async function openEscrowMatch(input: {
  roomId: string;
  stakeGrams: number;
  rakeBps: number;
  hostWallet: string;
}): Promise<EscrowMatch> {
  const cfg = getEscrowConfig();
  const existing = await getEscrow(input.roomId);
  const row: EscrowMatch =
    existing && existing.status !== "refunded" && existing.status !== "settled"
      ? {
          ...existing,
          hostWallet: input.hostWallet || existing.hostWallet,
          stakeGrams: input.stakeGrams,
          rakeBps: input.rakeBps,
        }
      : {
          roomId: input.roomId,
          stakeGrams: input.stakeGrams,
          stakeNano: stakeToNano(input.stakeGrams, cfg.nanoPerGram).toString(),
          rakeBps: input.rakeBps,
          hostWallet: input.hostWallet,
          guestWallet: "",
          hostTx: "",
          guestTx: "",
          usedTx: [],
          status: "awaiting",
          payoutTx: "",
          payoutNote: "",
          updatedAt: Date.now(),
        };
  const saved = await remember(row);
  if (!cfg.simulate && cfg.oracleReady) {
    void sendOpenMatch(input.roomId, input.hostWallet, BigInt(saved.stakeNano), input.rakeBps).catch((reason) => {
      console.error("Escrow open failed", reason);
    });
  }
  return saved;
}

export async function setEscrowGuest(roomId: string, guestWallet: string): Promise<EscrowMatch | undefined> {
  const row = await getEscrow(roomId);
  if (!row || row.status === "settled" || row.status === "refunded") {
    return row;
  }
  if (row.guestWallet && !sameAddress(row.guestWallet, guestWallet)) {
    row.guestTx = "";
  }
  row.guestWallet = guestWallet;
  const saved = await remember(row);
  const cfg = getEscrowConfig();
  if (!cfg.simulate && cfg.oracleReady) {
    void sendSetGuest(roomId, guestWallet).catch((reason) => {
      console.error("Escrow set guest failed", reason);
    });
  }
  return saved;
}

export async function markSimulatedPayment(roomId: string, wallet: string): Promise<EscrowMatch | undefined> {
  const cfg = getEscrowConfig();
  if (!cfg.simulate) {
    return getEscrow(roomId);
  }
  const row = await getEscrow(roomId);
  if (!row || row.status !== "awaiting") {
    return row;
  }
  if (sameAddress(wallet, row.hostWallet) && !row.hostTx) {
    row.hostTx = `sim-host-${Date.now()}`;
    row.usedTx.push(row.hostTx);
  } else if (row.guestWallet && sameAddress(wallet, row.guestWallet) && !row.guestTx) {
    row.guestTx = `sim-guest-${Date.now()}`;
    row.usedTx.push(row.guestTx);
  }
  maybeLock(row);
  return remember(row);
}

export async function scanEscrowDeposits(): Promise<void> {
  if (scanning) {
    return;
  }
  scanning = true;
  try {
    const cfg = getEscrowConfig();
    if (cfg.simulate) {
      return;
    }
    const awaiting = (await listOpenEscrows()).filter((row) => row.status === "awaiting" || row.status === "locked");
    for (const row of awaiting) {
      const onchain = await readMatch(row.roomId);
      if (!onchain?.exists) {
        continue;
      }
      row.hostTx = onchain.hostPaid ? row.hostTx || "onchain" : "";
      row.guestTx = onchain.guestPaid ? row.guestTx || "onchain" : "";
      if (onchain.guest) {
        row.guestWallet = onchain.guest;
      }
      if (onchain.settled) {
        row.status = row.hostTx && row.guestTx ? "settled" : "refunded";
        row.payoutNote = "onchain";
      } else {
        maybeLock(row);
      }
      await remember(row);
    }
  } catch (reason) {
    console.error("Escrow scan failed", reason);
  } finally {
    scanning = false;
  }
}

async function callRefund(roomId: string) {
  const cfg = getEscrowConfig();
  const row = await getEscrow(roomId);
  if (!row || row.status === "settled" || row.status === "refunded") {
    return;
  }
  if (cfg.simulate) {
    row.hostTx = "";
    row.guestTx = "";
    row.status = "refunded";
    row.payoutNote = "simulated";
    await remember(row);
    return;
  }
  try {
    row.payoutTx = await sendRefund(roomId);
    row.payoutNote = "onchain";
    row.status = "refunded";
    row.hostTx = "";
    row.guestTx = "";
    await remember(row);
  } catch (reason) {
    row.payoutNote = reason instanceof Error ? reason.message : "Refund failed";
    console.error("Escrow refund failed", reason);
    await remember(row);
  }
}

export async function refundWallet(roomId: string, wallet: string): Promise<void> {
  const cfg = getEscrowConfig();
  const row = await getEscrow(roomId);
  if (!row || row.status === "settled" || row.status === "refunded" || row.status === "locked") {
    return;
  }
  if (cfg.simulate) {
    if (sameAddress(wallet, row.hostWallet)) {
      row.hostTx = "";
    }
    if (row.guestWallet && sameAddress(wallet, row.guestWallet)) {
      row.guestTx = "";
    }
    await remember(row);
    return;
  }
  try {
    await sendRefundOne(roomId, wallet);
    if (sameAddress(wallet, row.hostWallet)) {
      row.hostTx = "";
    }
    if (row.guestWallet && sameAddress(wallet, row.guestWallet)) {
      row.guestTx = "";
      row.guestWallet = "";
    }
    row.payoutNote = "onchain";
    await remember(row);
  } catch (reason) {
    console.error("Escrow refund-one failed", reason);
  }
}

export async function refundAll(roomId: string): Promise<void> {
  await callRefund(roomId);
}

export async function settleWinner(roomId: string, winnerWallet: string): Promise<void> {
  const row = await getEscrow(roomId);
  if (!row || row.status === "settled" || row.status === "refunded") {
    return;
  }
  const cfg = getEscrowConfig();
  const outcome: 1 | 2 = sameAddress(winnerWallet, row.hostWallet) ? 1 : 2;
  if (cfg.simulate) {
    row.status = "settled";
    row.payoutNote = "simulated";
    await remember(row);
    return;
  }
  try {
    row.payoutTx = await sendSettle(roomId, outcome);
    row.status = "settled";
    row.payoutNote = "onchain";
    await remember(row);
  } catch (reason) {
    row.payoutNote = reason instanceof Error ? reason.message : "Settle failed";
    console.error("Escrow settle failed", reason);
    await remember(row);
  }
}

export async function settleDraw(roomId: string): Promise<void> {
  const row = await getEscrow(roomId);
  if (!row || row.status === "settled" || row.status === "refunded") {
    return;
  }
  const cfg = getEscrowConfig();
  if (cfg.simulate) {
    row.status = "settled";
    row.payoutNote = "simulated";
    await remember(row);
    return;
  }
  try {
    row.payoutTx = await sendSettle(roomId, 0);
    row.status = "settled";
    row.payoutNote = "onchain";
    await remember(row);
  } catch (reason) {
    row.payoutNote = reason instanceof Error ? reason.message : "Settle failed";
    console.error("Escrow settle failed", reason);
    await remember(row);
  }
}

export async function reseatEscrowHost(roomId: string, wallet: string): Promise<EscrowMatch | undefined> {
  const row = await getEscrow(roomId);
  if (!row || row.status === "settled" || row.status === "refunded") {
    return row;
  }
  const paid = sameAddress(wallet, row.hostWallet)
    ? row.hostTx
    : row.guestWallet && sameAddress(wallet, row.guestWallet)
      ? row.guestTx
      : "";
  row.hostWallet = wallet;
  row.hostTx = paid;
  row.guestWallet = "";
  row.guestTx = "";
  row.status = "awaiting";
  return remember(row);
}

export async function depositIntent(row: EscrowMatch) {
  const cfg = getEscrowConfig();
  return {
    roomId: row.roomId,
    to: cfg.contractFriendly,
    amount: row.stakeNano,
    payload: await depositPayload(row.roomId),
    comment: "",
    stakeGrams: row.stakeGrams,
    rakeBps: row.rakeBps,
    rakeGrams: rakeGrams(row.stakeGrams, row.rakeBps),
  };
}

export function startEscrowScanner() {
  void scanEscrowDeposits();
  setInterval(() => {
    void scanEscrowDeposits();
  }, 4000);
}
