import "reflect-metadata";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ROOM_NAME } from "@dotwars/shared";
import { Server } from "colyseus";
import { AppModule } from "./app.module";
import { startEscrowScanner } from "./escrow/service";
import { MatchRoom } from "./rooms/match.room";

function loadDotEnv() {
  const files = [resolve(process.cwd(), ".env"), resolve(__dirname, "../.env")];
  for (const file of files) {
    if (!existsSync(file)) {
      continue;
    }
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const eq = trimmed.indexOf("=");
      if (eq <= 0) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    return;
  }
}

async function bootstrap() {
  loadDotEnv();
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
