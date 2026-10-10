export type PlayerId = string;

export const PLAYER_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#eab308",
] as const;

export type PlayerColor = (typeof PLAYER_COLORS)[number];

export interface Player {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  telegramId?: number;
}
