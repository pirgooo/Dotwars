import { Module } from "@nestjs/common";
import { AuthController } from "./auth/auth.controller";
import { HealthController } from "./health.controller";
import { EscrowController } from "./escrow/escrow.controller";
import { InviteController } from "./invite.controller";

@Module({
  controllers: [HealthController, AuthController, EscrowController, InviteController],
})
export class AppModule {}
