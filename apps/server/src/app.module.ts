import { Module } from "@nestjs/common";
import { AuthController } from "./auth/auth.controller";
import { HealthController } from "./health.controller";
import { InviteController } from "./invite.controller";

@Module({
  controllers: [HealthController, AuthController, InviteController],
})
export class AppModule {}
