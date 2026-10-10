import { Client, type Room } from "colyseus.js";
import { ClientMessage, ROOM_NAME, type GameState, type SendPortion } from "@dotwars/shared";
import { useCallback, useEffect, useState } from "react";
import { getColyseusUrl } from "./colyseusUrl";

export type MatchStatus = "connecting" | "live" | "error";

function countBases(state: GameState, sessionId: string): { mine: number; enemy: number } {
  let mine = 0;
  let enemy = 0;
  state.bases?.forEach((base) => {
    if (base.ownerId === sessionId) {
      mine += 1;
    } else if (base.ownerId) {
      enemy += 1;
    }
  });
  return { mine, enemy };
}

export function useMatchRoom() {
  const [status, setStatus] = useState<MatchStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room<GameState> | null>(null);
  const [phase, setPhase] = useState<GameState["phase"]>("waiting");
  const [winnerId, setWinnerId] = useState("");
  const [versusBot, setVersusBot] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [myBases, setMyBases] = useState(0);
  const [enemyBases, setEnemyBases] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let poll = 0;
    let joinedRoom: Room<GameState> | null = null;
    const client = new Client(getColyseusUrl());

    const apply = (state: GameState, sessionId: string) => {
      const phase = state.phase;
      if (phase !== "waiting" && phase !== "playing" && phase !== "ended") {
        return;
      }
      const { mine, enemy } = countBases(state, sessionId);
      setStatus("live");
      setPhase(phase);
      setWinnerId(state.winnerId ?? "");
      setVersusBot(Boolean(state.versusBot));
      setTimedOut(Boolean(state.timedOut));
      setTimeLeft(state.timeLeft ?? 0);
      setCountdown(state.countdown ?? 0);
      setMyBases(mine);
      setEnemyBases(enemy);
    };

    void client
      .joinOrCreate<GameState>(ROOM_NAME)
      .then((joined) => {
        joinedRoom = joined;
        if (cancelled) {
          return;
        }
        setRoom(joined);
        apply(joined.state, joined.sessionId);
        poll = window.setInterval(() => apply(joined.state, joined.sessionId), 100);
        joined.onStateChange((state) => apply(state, joined.sessionId));
        joined.onLeave(() => {
          if (!cancelled) {
            setStatus("error");
            setError("Соединение с сервером закрыто");
          }
        });
      })
      .catch((reason: unknown) => {
        if (cancelled) {
          return;
        }
        setStatus("error");
        setError(reason instanceof Error ? reason.message : "Не удалось подключиться к серверу");
      });

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      void joinedRoom?.leave();
    };
  }, []);

  const sendTroops = useCallback(
    (fromBaseId: string, toBaseId: string, portion: SendPortion) => {
      if (room?.state.phase !== "playing") {
        return;
      }
      room.send(ClientMessage.SendTroops, { fromBaseId, toBaseId, portion });
    },
    [room],
  );

  const restartMatch = useCallback(() => {
    room?.send(ClientMessage.RestartMatch);
  }, [room]);

  return {
    status,
    error,
    room,
    phase,
    winnerId,
    versusBot,
    timedOut,
    timeLeft,
    countdown,
    myBases,
    enemyBases,
    sendTroops,
    restartMatch,
  };
}
