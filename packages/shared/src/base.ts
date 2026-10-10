import type { PlayerId } from "./player";

export type BaseId = string;

export interface Base {
  id: BaseId;
  x: number;
  y: number;
  garrison: number;
  ownerId: PlayerId | null;
}

export interface TroopOrder {
  fromBaseId: BaseId;
  toBaseId: BaseId;
}
