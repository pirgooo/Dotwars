import { MapSchema, Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") id = "";
  @type("string") name = "";
  @type("string") color = "";
  @type("string") walletAddress = "";
  @type("number") telegramId = 0;
}

export class BaseState extends Schema {
  @type("string") id = "";
  @type("float32") x = 0;
  @type("float32") y = 0;
  @type("uint16") garrison = 0;
  @type("string") ownerId = "";
  @type("string") polygon = "";
  @type("boolean") active = true;
}

export class TroopState extends Schema {
  @type("string") id = "";
  @type("string") ownerId = "";
  @type("string") fromBaseId = "";
  @type("string") toBaseId = "";
  @type("float32") x = 0;
  @type("float32") y = 0;
}

export class GameState extends Schema {
  @type("string") phase: "waiting" | "playing" | "ended" = "waiting";
  @type("string") winnerId = "";
  @type("boolean") versusBot = true;
  @type("boolean") seekingOpponent = false;
  @type("boolean") timedOut = false;
  @type("float32") countdown = 0;
  @type("float32") timeLeft = 0;
  @type("int32") seed = -1;
  @type("uint16") stakeGrams = 0;
  @type("uint16") rakeBps = 0;
  @type("string") escrow: "none" | "awaiting" | "locked" | "settled" | "refunded" = "none";
  @type("boolean") hostPaid = false;
  @type("boolean") guestPaid = false;
  @type("string") payout = "";
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: BaseState }) bases = new MapSchema<BaseState>();
  @type({ map: TroopState }) troops = new MapSchema<TroopState>();
}
