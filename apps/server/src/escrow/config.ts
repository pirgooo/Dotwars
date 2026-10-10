import { Address } from "@ton/core";
import { clampRakeBps, DEFAULT_RAKE_BPS } from "@dotwars/shared";

export interface EscrowRuntimeConfig {
  configured: boolean;
  simulate: boolean;
  oracleReady: boolean;
  contract: Address | null;
  contractFriendly: string;
  oracleWallet: Address | null;
  mnemonic: string[];
  rakeBps: number;
  nanoPerGram: bigint;
  endpoint: string;
  apiKey: string;
}

function parseAddress(value: string | undefined): Address | null {
  if (!value?.trim()) {
    return null;
  }
  try {
    return Address.parse(value.trim());
  } catch {
    return null;
  }
}

export function getEscrowConfig(): EscrowRuntimeConfig {
  const contract = parseAddress(process.env.ESCROW_CONTRACT);
  const oracleWallet = parseAddress(process.env.ORACLE_WALLET);
  const simulate =
    process.env.NODE_ENV !== "production" &&
    process.env.ESCROW_SIMULATE !== "0" &&
    (!contract || process.env.ESCROW_SIMULATE === "1");
  const mnemonic = (process.env.ORACLE_MNEMONIC ?? process.env.ESCROW_MNEMONIC ?? "").trim().split(/\s+/).filter(Boolean);
  const nano = BigInt(process.env.GRAM_NANOTON || "1000000000");
  return {
    configured: Boolean(contract) || simulate,
    simulate,
    oracleReady: Boolean(contract) && mnemonic.length >= 12,
    contract,
    contractFriendly: contract ? contract.toString({ bounceable: true, urlSafe: true }) : "",
    oracleWallet,
    mnemonic,
    rakeBps: clampRakeBps(process.env.RAKE_BPS || DEFAULT_RAKE_BPS),
    nanoPerGram: nano > 0n ? nano : 1_000_000_000n,
    endpoint: process.env.TON_ENDPOINT || "https://toncenter.com/api/v2/jsonRPC",
    apiKey: process.env.TON_API_KEY || "",
  };
}

export function stakeToNano(stakeGrams: number, nanoPerGram = getEscrowConfig().nanoPerGram): bigint {
  return BigInt(Math.max(0, stakeGrams)) * nanoPerGram;
}

export function sameAddress(left: string, right: string): boolean {
  try {
    return Address.parse(left).toRawString().toLowerCase() === Address.parse(right).toRawString().toLowerCase();
  } catch {
    return left.trim().toLowerCase() === right.trim().toLowerCase();
  }
}
