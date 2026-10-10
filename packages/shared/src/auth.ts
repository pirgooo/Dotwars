export interface PlayerProfile {
  address: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  games: number;
  stub?: boolean;
}

export interface TonProofPayload {
  timestamp: number;
  domain: {
    lengthBytes: number;
    value: string;
  };
  payload: string;
  signature: string;
  stateInit: string;
}

export interface AuthVerifyRequest {
  address: string;
  network: string;
  publicKey: string;
  proof: TonProofPayload;
}

export interface AuthSessionResponse {
  token: string;
  player: PlayerProfile;
}

export interface InviteInfo {
  roomId: string;
  hostName: string;
  stakeGrams: number;
  rakeBps: number;
}

export interface EscrowConfig {
  configured: boolean;
  simulate: boolean;
  wallet: string;
  rakeBps: number;
  nanoPerGram: string;
}

export interface EscrowDepositIntent {
  roomId: string;
  to: string;
  amount: string;
  payload: string;
  comment: string;
  stakeGrams: number;
  rakeBps: number;
}

export type EscrowStatus = "none" | "awaiting" | "locked" | "settled" | "refunded";

export const STAKE_PRESETS = [0, 1, 2, 5, 10, 25] as const;
export const DEFAULT_RAKE_BPS = 1000;

export function clampStakeGrams(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.min(1000, Math.round(n)));
}

export function formatStake(grams: number): string {
  if (grams <= 0) {
    return "Free";
  }
  return `${grams} GRAM`;
}

export function clampRakeBps(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return DEFAULT_RAKE_BPS;
  }
  return Math.max(0, Math.min(2000, Math.round(n)));
}

export function potGrams(stakeGrams: number): number {
  return Math.max(0, stakeGrams) * 2;
}

export function rakeGrams(stakeGrams: number, rakeBps: number): number {
  return Math.floor((potGrams(stakeGrams) * clampRakeBps(rakeBps)) / 10_000);
}

export function winnerPayoutGrams(stakeGrams: number, rakeBps: number): number {
  return potGrams(stakeGrams) - rakeGrams(stakeGrams, rakeBps);
}

export function formatRake(rakeBps: number): string {
  const bps = clampRakeBps(rakeBps);
  const whole = Math.floor(bps / 100);
  const frac = bps % 100;
  if (frac === 0) {
    return `${whole}%`;
  }
  return `${(bps / 100).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
}

export function escrowComment(roomId: string): string {
  return `dw:${roomId}`;
}

/** Tact message opcodes for the non-custodial escrow contract. */
export const ESCROW_OP = {
  open: 0x4f50454e,
  deposit: 0x4445504f,
  guest: 0x47534554,
  settle: 0x53544c45,
  refund: 0x52464e44,
  refundOne: 0x52464e31,
} as const;

export function shortWalletName(address: string): string {
  const hex = address.includes(":") ? address.split(":")[1] ?? address : address;
  if (hex.length < 8) {
    return address;
  }
  return `${hex.slice(0, 4)}…${hex.slice(-4)}`;
}
