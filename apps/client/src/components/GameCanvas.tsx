import { useCallback, useEffect, useRef, useState } from "react";
import { createGameScene } from "../game/createGameScene";
import type { Room } from "colyseus.js";
import type { GameState } from "@dotwars/shared";
import type { HudBase } from "../game/hudTypes";
import { completeFirstSendHint, FirstSendHint, firstSendHintPending } from "./FirstSendHint";

interface GameCanvasProps {
  room: Room<GameState>;
  playing: boolean;
  sendTroops: (fromBaseId: string, toBaseId: string) => void;
}

interface DragState {
  pointerId: number;
  fromId: string;
  fromX: number;
  fromY: number;
  x: number;
  y: number;
}

export function GameCanvas({ room, playing, sendTroops }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const hitBaseRef = useRef<(x: number, y: number, sourceId: string) => string | null>(() => null);
  const hitOwnedRef = useRef<(x: number, y: number, ownerId: string) => string | null>(() => null);
  const dragRef = useRef<DragState | null>(null);
  const hudRef = useRef<HudBase[]>([]);
  const playingRef = useRef(playing);
  const sendRef = useRef(sendTroops);
  const [hud, setHud] = useState<HudBase[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [showHint, setShowHint] = useState(firstSendHintPending);
  const showHintRef = useRef(showHint);
  hudRef.current = hud;
  playingRef.current = playing;
  sendRef.current = sendTroops;
  showHintRef.current = showHint;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = createGameScene(host, {
      sessionId: room.sessionId,
      getState: () => room.state,
      onHud: setHud,
    });
    hitBaseRef.current = scene.hitBase;
    hitOwnedRef.current = scene.hitOwnedBase;
    return () => {
      scene.destroy();
    };
  }, [room]);

  const toLocal = useCallback((clientX: number, clientY: number) => {
    const host = hostRef.current;
    if (!host) {
      return { x: clientX, y: clientY };
    }
    const rect = host.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      const current = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!current || !playingRef.current) {
        return;
      }
      const point = toLocal(clientX, clientY);
      const toId = hitBaseRef.current(point.x, point.y, current.fromId);
      if (toId) {
        sendRef.current(current.fromId, toId);
        if (showHintRef.current) {
          completeFirstSendHint();
          setShowHint(false);
        }
      }
    },
    [toLocal],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!playingRef.current || (event.pointerType === "mouse" && event.button !== 0)) {
        return;
      }
      if (dragRef.current && dragRef.current.pointerId !== event.pointerId) {
        dragRef.current = null;
        setDrag(null);
      }
      const point = toLocal(event.clientX, event.clientY);
      const fromId = hitOwnedRef.current(point.x, point.y, room.sessionId);
      if (!fromId) {
        return;
      }
      const from = hudRef.current.find((base) => base.id === fromId);
      const next: DragState = {
        pointerId: event.pointerId,
        fromId,
        fromX: from?.x ?? point.x,
        fromY: from?.y ?? point.y,
        x: point.x,
        y: point.y,
      };
      dragRef.current = next;
      setDrag(next);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture needs a trusted pointer; window-level up still finishes the drag.
      }
      event.preventDefault();
    },
    [room.sessionId, toLocal],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const current = dragRef.current;
      if (!current || current.pointerId !== event.pointerId) {
        return;
      }
      const point = toLocal(event.clientX, event.clientY);
      const next = { ...current, x: point.x, y: point.y };
      dragRef.current = next;
      setDrag(next);
    },
    [toLocal],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const current = dragRef.current;
      if (!current || current.pointerId !== event.pointerId) {
        return;
      }
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      finishDrag(event.clientX, event.clientY);
    },
    [finishDrag],
  );

  useEffect(() => {
    const onUp = (event: PointerEvent) => {
      if (dragRef.current?.pointerId === event.pointerId) {
        finishDrag(event.clientX, event.clientY);
      }
    };
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [finishDrag]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 overflow-hidden touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="pointer-events-none absolute inset-0 z-20">
        {showHint && playing && !drag ? <FirstSendHint bases={hud} /> : null}
        {drag ? (
          <svg className="absolute inset-0 h-full w-full">
            <line
              x1={drag.fromX}
              y1={drag.fromY}
              x2={drag.x}
              y2={drag.y}
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx={drag.x} cy={drag.y} r="6" fill="#ffffff" />
          </svg>
        ) : null}
      </div>
    </div>
  );
}
