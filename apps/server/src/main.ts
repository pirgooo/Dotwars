import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ROOM_NAME } from "@dotwars/shared";
import { Server } from "colyseus";
import { AppModule } from "./app.module";
import { startEscrowScanner } from "./escrow/service";
import { MatchRoom } from "./rooms/match.room";

async function bootstrap() {
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required in production");
  }
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: app.getHttpServer(),
    }),
  });
  gameServer.define(ROOM_NAME, MatchRoom).filterBy(["mode", "queue"]);

  const port = Number(process.env.PORT ?? 2567);
  startEscrowScanner();
  await app.listen(port);
  console.log(`Dot Wars server listening on http://localhost:${port}`);
}

void bootstrap();


