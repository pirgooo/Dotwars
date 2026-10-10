import { Address, beginCell, toNano } from "@ton/core";
import { mnemonicToPrivateKey, sha256 } from "@ton/crypto";
import { internal, TonClient, WalletContractV4 } from "@ton/ton";
import { ESCROW_OP } from "@dotwars/shared";
import { getEscrowConfig } from "./config";

export async function roomMatchId(roomId: string): Promise<bigint> {
  const hash = await sha256(roomId);
  return BigInt(`0x${hash.toString("hex")}`);
}

export async function depositPayload(roomId: string): Promise<string> {
  const id = await roomMatchId(roomId);
  return beginCell().storeUint(ESCROW_OP.deposit, 32).storeUint(id, 256).endCell().toBoc().toString("base64");
}

function tonClient() {
  const cfg = getEscrowConfig();
  return new TonClient({
    endpoint: cfg.endpoint,
    apiKey: cfg.apiKey || undefined,
  });
}

export interface OnchainMatch {
  exists: boolean;
  host: string;
  guest: string;
  stake: bigint;
  rakeBps: number;
  hostPaid: boolean;
  guestPaid: boolean;
  settled: boolean;
}

function isZeroAddress(address: Address): boolean {
  return address.workChain === 0 && address.hash.equals(Buffer.alloc(32));
}

export async function readMatch(roomId: string): Promise<OnchainMatch | null> {
  const cfg = getEscrowConfig();
  if (!cfg.contract) {
    return null;
  }
  const id = await roomMatchId(roomId);
  const client = tonClient();
  const result = await client.runMethod(cfg.contract, "matchInfo", [{ type: "int", value: id }]);
  const exists = result.stack.readBoolean();
  const host = result.stack.readAddress();
  const guest = result.stack.readAddress();
  const stake = result.stack.readBigNumber();
  const rakeBps = Number(result.stack.readNumber());
  const hostPaid = result.stack.readBoolean();
  const guestPaid = result.stack.readBoolean();
  const settled = result.stack.readBoolean();
  return {
    exists,
    host: host.toRawString(),
    guest: isZeroAddress(guest) ? "" : guest.toRawString(),
    stake,
    rakeBps,
    hostPaid,
    guestPaid,
    settled,
  };
}

function openBody(matchId: bigint, host: Address, stake: bigint, rakeBps: number) {
  return beginCell()
    .storeUint(ESCROW_OP.open, 32)
    .storeUint(matchId, 256)
    .storeAddress(host)
    .storeCoins(stake)
    .storeUint(rakeBps, 16)
    .endCell();
}

function guestBody(matchId: bigint, guest: Address) {
  return beginCell().storeUint(ESCROW_OP.guest, 32).storeUint(matchId, 256).storeAddress(guest).endCell();
}

function settleBody(matchId: bigint, outcome: 0 | 1 | 2) {
  return beginCell().storeUint(ESCROW_OP.settle, 32).storeUint(matchId, 256).storeUint(outcome, 8).endCell();
}

function refundBody(matchId: bigint) {
  return beginCell().storeUint(ESCROW_OP.refund, 32).storeUint(matchId, 256).endCell();
}

let sendTail: Promise<void> = Promise.resolve();

export function enqueueOracle(body: ReturnType<typeof openBody>, gas: bigint): Promise<string> {
  const job = sendTail.then(() => sendOracle(body, gas));
  sendTail = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

async function sendOracle(body: ReturnType<typeof openBody>, gas: bigint): Promise<string> {
  const cfg = getEscrowConfig();
  if (!cfg.contract || !cfg.oracleReady) {
    throw new Error("Oracle signer is not configured");
  }
  const keys = await mnemonicToPrivateKey(cfg.mnemonic);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keys.publicKey });
  if (cfg.oracleWallet && !wallet.address.equals(cfg.oracleWallet)) {
    throw new Error("ORACLE_MNEMONIC does not match ORACLE_WALLET (use Wallet v4R2)");
  }
  const client = tonClient();
  const opened = client.open(wallet);
  const seqno = await opened.getSeqno();
  await opened.sendTransfer({
    seqno,
    secretKey: keys.secretKey,
    messages: [
      internal({
        to: cfg.contract,
        value: gas,
        bounce: true,
        body,
      }),
    ],
  });
  return `seqno:${seqno}`;
}

export async function sendOpenMatch(roomId: string, host: string, stakeNano: bigint, rakeBps: number) {
  const id = await roomMatchId(roomId);
  return enqueueOracle(openBody(id, Address.parse(host), stakeNano, rakeBps), toNano("0.06"));
}

export async function sendSetGuest(roomId: string, guest: string) {
  const id = await roomMatchId(roomId);
  return enqueueOracle(guestBody(id, Address.parse(guest)), toNano("0.05"));
}

export async function sendSettle(roomId: string, outcome: 0 | 1 | 2) {
  const id = await roomMatchId(roomId);
  return enqueueOracle(settleBody(id, outcome), toNano("0.2"));
}

export async function sendRefund(roomId: string) {
  const id = await roomMatchId(roomId);
  return enqueueOracle(refundBody(id), toNano("0.12"));
}

export async function sendRefundOne(roomId: string, who: string) {
  const id = await roomMatchId(roomId);
  const body = beginCell()
    .storeUint(ESCROW_OP.refundOne, 32)
    .storeUint(id, 256)
    .storeAddress(Address.parse(who))
    .endCell();
  return enqueueOracle(body, toNano("0.08"));
}
