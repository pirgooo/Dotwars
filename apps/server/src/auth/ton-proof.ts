import { sha256 } from "@ton/crypto";
import { Address, Cell, contractAddress, loadStateInit } from "@ton/core";
import nacl from "tweetnacl";

const PROOF_PREFIX = "ton-proof-item-v2/";
const CONNECT_PREFIX = "ton-connect";
const MAX_AGE_SECONDS = 15 * 60;

function allowedDomains(): Set<string> {
  const extra = (process.env.TON_PROOF_DOMAINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return new Set([
    "localhost:5173",
    "127.0.0.1:5173",
    "localhost",
    "dotwars.candysshare.online",
    ...extra,
  ]);
}

function publicKeyCandidates(data: Cell): Buffer[] {
  const keys: Buffer[] = [];
  for (const skip of [32, 64, 96, 0]) {
    try {
      const slice = data.beginParse();
      if (skip > 0) {
        slice.loadUint(skip);
      }
      if (slice.remainingBits < 256) {
        continue;
      }
      keys.push(Buffer.from(slice.loadBuffer(32)));
    } catch {
      // Wallet layouts differ; try the next skip.
    }
  }
  return keys;
}

export async function verifyTonProof(input: {
  address: string;
  network: string;
  publicKey: string;
  proof: {
    timestamp: number;
    domain: { lengthBytes: number; value: string };
    payload: string;
    signature: string;
    stateInit: string;
  };
}): Promise<boolean> {
  try {
    const timestamp = Number(input.proof.timestamp);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > MAX_AGE_SECONDS) {
      return false;
    }

    const domain = input.proof.domain.value;
    const domainBytes = Buffer.from(domain, "utf8");
    if (input.proof.domain.lengthBytes !== domainBytes.length) {
      return false;
    }
    if (!allowedDomains().has(domain)) {
      return false;
    }

    if (input.network !== "-239" && input.network !== "-3") {
      return false;
    }

    const stateInit = loadStateInit(Cell.fromBase64(input.proof.stateInit).beginParse());
    const wanted = Address.parse(input.address);
    const derived = contractAddress(wanted.workChain, stateInit);
    if (!derived.equals(wanted)) {
      return false;
    }

    const wantedKey = Buffer.from(input.publicKey, "hex");
    const extracted = stateInit.data ? publicKeyCandidates(stateInit.data) : [];
    const keys = extracted.some((key) => key.equals(wantedKey)) ? [wantedKey] : extracted.length > 0 ? extracted : wantedKey.length === 32 ? [wantedKey] : [];
    if (keys.length === 0) {
      return false;
    }

    const wc = Buffer.alloc(4);
    wc.writeInt32BE(wanted.workChain, 0);
    const ts = Buffer.alloc(8);
    ts.writeBigUInt64LE(BigInt(timestamp), 0);
    const dl = Buffer.alloc(4);
    dl.writeUInt32LE(input.proof.domain.lengthBytes, 0);

    const msg = Buffer.concat([
      Buffer.from(PROOF_PREFIX),
      wc,
      Buffer.from(wanted.hash),
      dl,
      domainBytes,
      ts,
      Buffer.from(input.proof.payload, "utf8"),
    ]);
    const msgHash = Buffer.from(await sha256(msg));
    const fullMsg = Buffer.concat([Buffer.from([0xff, 0xff]), Buffer.from(CONNECT_PREFIX), msgHash]);
    const digest = new Uint8Array(await sha256(fullMsg));
    const signature = new Uint8Array(Buffer.from(input.proof.signature, "base64"));

    return keys.some((key) => nacl.sign.detached.verify(digest, signature, new Uint8Array(key)));
  } catch {
    return false;
  }
}
