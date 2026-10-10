import type { BaseId } from "./base";
import type { PlayerId } from "./player";

export const ROOM_NAME = "match";

export type MatchMode = "bot" | "pvp";

export enum ClientMessage {
  SendTroops = "send_troops",
  RestartMatch = "restart_match",
}

export enum ServerMessage {
  MatchStarted = "match_started",
  MatchEnded = "match_ended",
}

export interface SendTroopsPayload {
  fromBaseId: BaseId;
  toBaseId: BaseId;
}

export interface MatchStartedPayload {
  seed: number;
}

export interface MatchEndedPayload {
  winnerId: PlayerId | null;
}
