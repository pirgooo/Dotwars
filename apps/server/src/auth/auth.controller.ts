import { BadRequestException, Body, Controller, ForbiddenException, Get, Headers, Patch, Post, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { Address } from "@ton/core";
import type { AuthVerifyRequest } from "@dotwars/shared";
import { consumeNonce, issueNonce } from "./nonce-store";
import { getPlayer, setPlayerName, setPlayerStub, upsertTelegramPlayer } from "./player-store";
import { isRawAddress, randomPayload, randomRawAddress, signSession, verifySession } from "./session";
import { telegramDisplayName, telegramPlayerAddress, verifyTelegramInitData, type TelegramWebAppUser } from "./telegram-init-data";
import { verifyTonProof } from "./ton-proof";

function stubAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_STUB_AUTH === "1";
}

function bearer(header?: string): string | undefined {
  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }
  return header.slice(7);
}

function canonicalAddress(address: string): string {
  return Address.parse(address).toRawString();
}

@Controller("auth")
export class AuthController {
  @Get("payload")
  payload() {
    const payload = randomPayload();
    issueNonce(payload);
    return { payload };
  }

  @Post("telegram")
  async telegram(@Body() body: { initData?: string }) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!botToken) {
      throw new ServiceUnavailableException("Telegram login is not configured");
    }
    if (!body?.initData) {
      throw new UnauthorizedException("Missing Telegram init data");
    }
    let user: TelegramWebAppUser;
    try {
      user = verifyTelegramInitData(body.initData, botToken);
    } catch (reason) {
      throw new UnauthorizedException(reason instanceof Error ? reason.message : "Invalid Telegram init data");
    }
    const address = telegramPlayerAddress(user.id);
    const player = await upsertTelegramPlayer(address, telegramDisplayName(user));
    return { token: signSession(address, true), player: { ...player, stub: true } };
  }

  @Post("stub")
  async stub(@Body() body: { address?: string }) {
    if (!stubAllowed()) {
      throw new ForbiddenException("Stub login is only available in development");
    }
    const address = body?.address && isRawAddress(body.address) ? body.address.toLowerCase() : randomRawAddress();
    const player = await setPlayerStub(address, true);
    return { token: signSession(address, true), player: { ...player, stub: true } };
  }

  @Post("verify")
  async verify(@Body() body: AuthVerifyRequest) {
    if (!body?.address || !body.proof?.payload || !body.proof.signature || !body.proof.stateInit) {
      throw new UnauthorizedException("Invalid proof");
    }
    if (!consumeNonce(body.proof.payload)) {
      throw new UnauthorizedException("Proof expired, connect the wallet again");
    }
    const ok = await verifyTonProof(body);
    if (!ok) {
      throw new UnauthorizedException("Could not verify the wallet");
    }
    const address = canonicalAddress(body.address);
    const player = await setPlayerStub(address, false);
    return { token: signSession(address, false), player: { ...player, stub: false } };
  }

  @Get("me")
  async me(@Headers("authorization") authorization?: string) {
    const session = verifySession(bearer(authorization));
    if (!session) {
      throw new UnauthorizedException("Authorization required");
    }
    const player = await getPlayer(session.address);
    if (!player) {
      throw new UnauthorizedException("Player not found");
    }
    return { player: { ...player, stub: Boolean(session.stub || player.stub) } };
  }

  @Patch("me")
  async rename(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: { name?: string },
  ) {
    const session = verifySession(bearer(authorization));
    if (!session) {
      throw new UnauthorizedException("Authorization required");
    }
    const name = (body.name ?? "").trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 24) {
      throw new BadRequestException("Name must be 2–24 characters");
    }
    const player = await setPlayerName(session.address, name);
    if (!player) {
      throw new UnauthorizedException("Player not found");
    }
    return { player };
  }
}
