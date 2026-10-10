import { Body, Controller, ForbiddenException, Get, Headers, Patch, Post, UnauthorizedException } from "@nestjs/common";
import { Address } from "@ton/core";
import type { AuthVerifyRequest } from "@dotwars/shared";
import { consumeNonce, issueNonce } from "./nonce-store";
import { getOrCreatePlayer, getPlayer, setPlayerName } from "./player-store";
import { isRawAddress, randomPayload, randomRawAddress, signSession, verifySession } from "./session";
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

  @Post("stub")
  async stub(@Body() body: { address?: string }) {
    if (!stubAllowed()) {
      throw new ForbiddenException("Stub login is only available in development");
    }
    const address = body?.address && isRawAddress(body.address) ? body.address.toLowerCase() : randomRawAddress();
    const player = await getOrCreatePlayer(address);
    return { token: signSession(address), player };
  }

  @Post("verify")
  async verify(@Body() body: AuthVerifyRequest) {
    if (!body?.address || !body.proof?.payload || !body.proof.signature || !body.publicKey || !body.proof.stateInit) {
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
    const player = await getOrCreatePlayer(address);
    return { token: signSession(address), player };
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
    return { player };
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
      throw new UnauthorizedException("Name must be 2–24 characters");
    }
    const player = await setPlayerName(session.address, name);
    if (!player) {
      throw new UnauthorizedException("Player not found");
    }
    return { player };
  }
}
