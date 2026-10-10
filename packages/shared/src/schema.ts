import { MapSchema, Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") id = "";
  @type("string") name = "";
  @type("string") color = "";
  @type("number") telegramId = 0;
}

export class BaseState extends Schema {
  @type("string") id = "";
  @type("float32") x = 0;
  @type("float32") y = 0;
  @type("uint16") garrison = 0;
  @type("string") ownerId = "";
}

export class GameState extends Schema {
  @type("string") phase: "waiting" | "playing" | "ended" = "waiting";
  @type("int32") seed = 0;
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: BaseState }) bases = new MapSchema<BaseState>();
}
