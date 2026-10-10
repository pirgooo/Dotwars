import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { getInvite } from "./rooms/invite-store";

@Controller("invite")
export class InviteController {
  @Get(":roomId")
  lookup(@Param("roomId") roomId: string) {
    const invite = getInvite(roomId);
    if (!invite) {
      throw new NotFoundException("Invite expired");
    }
    return { roomId, hostName: invite.hostName, stakeGrams: invite.stakeGrams, rakeBps: invite.rakeBps };
  }
}
