import { Client, Room } from "colyseus";
import {
  ClientMessage,
  GameState,
  PLAYER_COLORS,
  PlayerState,
  type SendTroopsPayload,
} from "@dotwars/shared";

export class MatchRoom extends Room<GameState> {
  maxClients = 2;
  state = new GameState();

  onCreate() {
    this.onMessage(ClientMessage.SendTroops, (_client, _payload: SendTroopsPayload) => {
      // Movement and combat land in a later iteration.
    });
  }

  onJoin(client: Client, options?: { name?: string; telegramId?: number }) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = options?.name ?? `Player ${this.clients.length}`;
    player.color = PLAYER_COLORS[this.state.players.size % PLAYER_COLORS.length];
    player.telegramId = options?.telegramId ?? 0;
    this.state.players.set(client.sessionId, player);

    if (this.state.players.size >= this.maxClients) {
      this.state.phase = "playing";
    }
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
  }
}
