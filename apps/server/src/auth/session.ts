import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DAY = 7 * 24 * 60 * 60 * 1000;

function secret(): string {
  return process.env.SESSION_SECRET ?? "dotwars-dev-session-secret";
}

export interface SessionPayload {
  address: string;
  exp: number;
  stub?: boolean;
}

export function signSession(address: string, stub = false): string {
  const payload = Buffer.from(JSON.stringify({ address, exp: Date.now() + DAY, stub }), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }
  const [payload, sig] = token.split(".");
  if (!payload || !sig) {
    return null;
  }
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    if (!data.address || typeof data.exp !== "number" || data.exp < Date.now()) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function randomPayload(): string {
  return randomBytes(24).toString("hex").slice(0, 48);
}

export function randomRawAddress(): string {
  return `0:${randomBytes(32).toString("hex")}`;
}

export function isRawAddress(value: string): boolean {
  return /^0:[0-9a-f]{64}$/i.test(value);
}
