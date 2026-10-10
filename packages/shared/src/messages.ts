import type { BaseId } from "./base";
import type { PlayerId } from "./player";
import type { SendPortion } from "./rules";

export const ROOM_NAME = "match";

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
  portion: SendPortion;
}

export interface MatchStartedPayload {
  seed: number;
}

export interface MatchEndedPayload {
  winnerId: PlayerId | null;
}
