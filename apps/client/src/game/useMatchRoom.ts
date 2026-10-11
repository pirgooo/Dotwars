import { Client, type Room } from "colyseus.js";
import { ClientMessage, isBotId, ROOM_NAME, type GameState, type MatchMode } from "@dotwars/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { getColyseusUrl } from "./colyseusUrl";
import { buildInviteUrl } from "../telegram";

export type MatchStatus = "idle" | "connecting" | "live" | "error";

export interface HudFighter {
  name: string;
  color: string;
}

function shortName(name: string, fallback: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.length > 12 ? `${trimmed.slice(0, 11)}…` : trimmed;
}

function readFighters(state: GameState, sessionId: string): { me: HudFighter; enemy: HudFighter } {
  let me: HudFighter = { name: "You", color: "#ffffff" };
  const others: (HudFighter & { bot: boolean })[] = [];
  state.players?.forEach((player, id) => {
    const fighter = {
      name: shortName(player.name, isBotId(id) ? "Bot" : "Player"),
      color: player.color || "#ffffff",
      bot: isBotId(id),
    };
    if (id === sessionId) {
      me = fighter;
    } else {
      others.push(fighter);
    }
  });
  if (others.length === 0) {
    return { me, enemy: { name: "Enemy", color: "#ef4444" } };
  }
  if (others.length === 1) {
    return { me, enemy: others[0]! };
  }
  const humans = others.filter((fighter) => !fighter.bot);
  if (humans.length === 1) {
    return { me, enemy: humans[0]! };
  }
  if (humans.length === 0) {
    return { me, enemy: { name: "Bots", color: others[0]?.color || "#ef4444" } };
  }
  return { me, enemy: humans[0]! };
}

function countBases(state: GameState, sessionId: string): { mine: number; enemy: number } {
  let mine = 0;
  let enemy = 0;
  state.bases?.forEach((base) => {
    if (base.active === false) {
      return;
    }
    if (base.ownerId === sessionId) {
      mine += 1;
    } else if (base.ownerId) {
      enemy += 1;
    }
  });
  return { mine, enemy };
}

export function useMatchRoom() {
  const clientRef = useRef<Client | null>(null);
  const roomRef = useRef<Room<GameState> | null>(null);
  const pollRef = useRef(0);
  const joinGenRef = useRef(0);

  const [status, setStatus] = useState<MatchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [queuedMode, setQueuedMode] = useState<MatchMode | null>(null);
  const [inviteRoomId, setInviteRoomId] = useState<string | null>(null);
  const [hostingInvite, setHostingInvite] = useState(false);
  const [room, setRoom] = useState<Room<GameState> | null>(null);
  const [phase, setPhase] = useState<GameState["phase"]>("waiting");
  const [winnerId, setWinnerId] = useState("");
  const [versusBot, setVersusBot] = useState(true);
  const [seekingOpponent, setSeekingOpponent] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [myBases, setMyBases] = useState(0);
  const [enemyBases, setEnemyBases] = useState(0);
  const [me, setMe] = useState<HudFighter>({ name: "You", color: "#ffffff" });
  const [enemy, setEnemy] = useState<HudFighter>({ name: "Enemy", color: "#ef4444" });
  const [stakeGrams, setStakeGrams] = useState(0);
  const [rakeBps, setRakeBps] = useState(0);
  const [escrow, setEscrow] = useState<GameState["escrow"]>("none");
  const [hostPaid, setHostPaid] = useState(false);
  const [guestPaid, setGuestPaid] = useState(false);
  const [payout, setPayout] = useState("");

  if (!clientRef.current) {
    clientRef.current = new Client(getColyseusUrl());
  }

  const clearRoom = useCallback(() => {
    window.clearInterval(pollRef.current);
    pollRef.current = 0;
    roomRef.current = null;
    setRoom(null);
    setPhase("waiting");
    setWinnerId("");
    setTimeLeft(0);
    setCountdown(0);
    setMyBases(0);
    setEnemyBases(0);
    setMe({ name: "You", color: "#ffffff" });
    setEnemy({ name: "Enemy", color: "#ef4444" });
    setSeekingOpponent(false);
    setInviteRoomId(null);
    setHostingInvite(false);
    setStakeGrams(0);
    setRakeBps(0);
    setEscrow("none");
    setHostPaid(false);
    setGuestPaid(false);
    setPayout("");
  }, []);

  const apply = useCallback((state: GameState, sessionId: string) => {
    const nextPhase = state.phase;
    if (nextPhase !== "waiting" && nextPhase !== "playing" && nextPhase !== "ended") {
      return;
    }
    const { mine, enemy: enemyCount } = countBases(state, sessionId);
    const fighters = readFighters(state, sessionId);
    setStatus("live");
    setPhase(nextPhase);
    setWinnerId(state.winnerId ?? "");
    setVersusBot(Boolean(state.versusBot));
    setSeekingOpponent(Boolean(state.seekingOpponent));
    setTimedOut(Boolean(state.timedOut));
    setTimeLeft(state.timeLeft ?? 0);
    setCountdown(state.countdown ?? 0);
    setMyBases(mine);
    setEnemyBases(enemyCount);
    setMe(fighters.me);
    setEnemy(fighters.enemy);
    setStakeGrams(state.stakeGrams ?? 0);
    setRakeBps(state.rakeBps ?? 0);
    setEscrow(state.escrow ?? "none");
    setHostPaid(Boolean(state.hostPaid));
    setGuestPaid(Boolean(state.guestPaid));
    setPayout(state.payout ?? "");
  }, []);

  const bindRoom = useCallback(
    (joined: Room<GameState>, gen: number, invite: boolean) => {
      roomRef.current = joined;
      setRoom(joined);
      if (invite) {
        setInviteRoomId(joined.roomId);
      }
      apply(joined.state, joined.sessionId);
      pollRef.current = window.setInterval(() => apply(joined.state, joined.sessionId), 100);
      joined.onStateChange((state) => apply(state, joined.sessionId));
      joined.onLeave(() => {
        if (joinGenRef.current !== gen) {
          return;
        }
        clearRoom();
        setQueuedMode(null);
        setStatus("error");
        setError("Server connection closed");
      });
    },
    [apply, clearRoom],
  );

  const beginJoin = useCallback(
    async (token: string, connect: () => Promise<Room<GameState>>, mode: MatchMode, invite: boolean) => {
      const gen = joinGenRef.current + 1;
      joinGenRef.current = gen;
      setQueuedMode(mode);
      setStatus("connecting");
      setError(null);
      setInviteRoomId(null);
      setHostingInvite(invite);
      if (roomRef.current) {
        await roomRef.current.leave(true);
        if (joinGenRef.current !== gen) {
          return;
        }
        clearRoom();
      }
      try {
        const joined = await connect();
        if (joinGenRef.current !== gen) {
          await joined.leave(true);
          return;
        }
        bindRoom(joined, gen, invite);
      } catch (reason: unknown) {
        if (joinGenRef.current !== gen) {
          return;
        }
        clearRoom();
        setQueuedMode(null);
        setStatus("error");
        setError(reason instanceof Error ? reason.message : "Could not connect to the server");
      }
    },
    [bindRoom, clearRoom],
  );

  const play = useCallback(
    (mode: MatchMode, token: string) =>
      beginJoin(
        token,
        () => clientRef.current!.joinOrCreate<GameState>(ROOM_NAME, { mode, queue: "open", token }),
        mode,
        false,
      ),
    [beginJoin],
  );

  const inviteFriend = useCallback(
    (token: string, stakeGrams = 0) =>
      beginJoin(
        token,
        () =>
          clientRef.current!.create<GameState>(ROOM_NAME, {
            mode: "pvp",
            queue: "private",
            token,
            stakeGrams,
          }),
        "pvp",
        true,
      ),
    [beginJoin],
  );

  const joinInvite = useCallback(
    (roomId: string, token: string) =>
      beginJoin(token, () => clientRef.current!.joinById<GameState>(roomId, { token }), "pvp", false),
    [beginJoin],
  );

  const leaveToMenu = useCallback(() => {
    joinGenRef.current += 1;
    const current = roomRef.current;
    clearRoom();
    setQueuedMode(null);
    setStatus("idle");
    setError(null);
    void current?.leave(true);
  }, [clearRoom]);

  useEffect(() => {
    return () => {
      joinGenRef.current += 1;
      window.clearInterval(pollRef.current);
      void roomRef.current?.leave(true);
    };
  }, []);

  const sendTroops = useCallback((fromBaseId: string, toBaseId: string) => {
    if (roomRef.current?.state.phase !== "playing" || !toBaseId) {
      return;
    }
    roomRef.current.send(ClientMessage.SendTroops, { fromBaseId, toBaseId });
  }, []);

  const restartMatch = useCallback(() => {
    roomRef.current?.send(ClientMessage.RestartMatch);
  }, []);

  const notifyEscrowSent = useCallback(() => {
    roomRef.current?.send(ClientMessage.EscrowSent);
  }, []);

  return {
    status,
    error,
    queuedMode,
    room,
    phase,
    winnerId,
    versusBot,
    seekingOpponent,
    timedOut,
    timeLeft,
    countdown,
    myBases,
    enemyBases,
    me,
    enemy,
    inviteRoomId,
    hostingInvite,
    inviteUrl: inviteRoomId ? buildInviteUrl(inviteRoomId) : null,
    play,
    inviteFriend,
    joinInvite,
    leaveToMenu,
    sendTroops,
    restartMatch,
    notifyEscrowSent,
    stakeGrams,
    rakeBps,
    escrow,
    hostPaid,
    guestPaid,
    payout,
  };
}
