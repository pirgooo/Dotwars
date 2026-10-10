import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ROOM_NAME } from "@dotwars/shared";
import { Server } from "colyseus";
import { AppModule } from "./app.module";
import { MatchRoom } from "./rooms/match.room";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: app.getHttpServer(),
    }),
  });
  gameServer.define(ROOM_NAME, MatchRoom);

  const port = Number(process.env.PORT ?? 2567);
  await app.listen(port);
  console.log(`Dot Wars server listening on http://localhost:${port}`);
}

void bootstrap();
