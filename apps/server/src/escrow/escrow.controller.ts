import { Controller, Get, NotFoundException, Param, ServiceUnavailableException } from "@nestjs/common";
import { getEscrowConfig } from "./config";
import { depositIntent } from "./service";
import { getEscrow } from "./store";

@Controller("escrow")
export class EscrowController {
  @Get("config")
  config() {
    const cfg = getEscrowConfig();
    return {
      configured: cfg.configured,
      simulate: cfg.simulate,
      wallet: cfg.contractFriendly,
      rakeBps: cfg.rakeBps,
      nanoPerGram: cfg.nanoPerGram.toString(),
    };
  }

  @Get("deposit/:roomId")
  async deposit(@Param("roomId") roomId: string) {
    const cfg = getEscrowConfig();
    if (!cfg.configured) {
      throw new ServiceUnavailableException("Escrow is not configured");
    }
    const row = await getEscrow(roomId);
    if (!row) {
      throw new NotFoundException("Invite expired");
    }
    return depositIntent(row);
  }
}
