import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

const MAX_AGE_SEC = 24 * 60 * 60;

export function verifyTelegramInitData(initData: string, botToken: string): TelegramWebAppUser {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || hash.length !== 64) {
    throw new Error("Invalid Telegram init data");
  }
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const left = Buffer.from(computed, "hex");
  const right = Buffer.from(hash, "hex");
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new Error("Invalid Telegram init data");
  }
  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || Math.abs(Date.now() / 1000 - authDate) > MAX_AGE_SEC) {
    throw new Error("Telegram session expired, reopen the Mini App");
  }
  const rawUser = params.get("user");
  if (!rawUser) {
    throw new Error("Telegram user is missing");
  }
  const user = JSON.parse(rawUser) as TelegramWebAppUser;
  if (!user?.id || typeof user.id !== "number") {
    throw new Error("Telegram user is missing");
  }
  return user;
}

export function telegramPlayerAddress(userId: number): string {
  const hex = createHash("sha256").update(`dotwars:tg:${userId}`).digest("hex");
  return `0:${hex}`;
}

export function telegramDisplayName(user: TelegramWebAppUser): string {
  const joined = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  const raw = (joined || user.username || `Player ${String(user.id).slice(-4)}`).replace(/\s+/g, " ");
  const clipped = raw.slice(0, 24).trim();
  if (clipped.length >= 2) {
    return clipped;
  }
  return `Player ${String(user.id).slice(-4)}`;
}
