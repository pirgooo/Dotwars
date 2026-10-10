import { useCallback, useEffect, useRef, useState } from "react";
import { createGameScene } from "../game/createGameScene";
import type { Room } from "colyseus.js";
import type { GameState, SendPortion } from "@dotwars/shared";
import type { HudBase } from "../game/hudTypes";
import { BaseSendOverlay } from "./BaseSendOverlay";

interface GameCanvasProps {
  room: Room<GameState>;
  playing: boolean;
  sendTroops: (fromBaseId: string, toBaseId: string, portion: SendPortion) => void;
}

interface DragState {
  fromId: string;
  portion: SendPortion;
  fromX: number;
  fromY: number;
  x: number;
  y: number;
}

export function GameCanvas({ room, playing, sendTroops }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const hitBaseRef = useRef<(x: number, y: number, sourceId: string) => string | null>(() => null);
  const dragRef = useRef<DragState | null>(null);
  const [hud, setHud] = useState<HudBase[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const isDragging = drag !== null;

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

  const onDragStart = useCallback(
    (baseId: string, portion: SendPortion, clientX: number, clientY: number) => {
      const from = hud.find((base) => base.id === baseId);
      const point = toLocal(clientX, clientY);
      const next: DragState = {
        fromId: baseId,
        portion,
        fromX: from?.x ?? point.x,
        fromY: from?.y ?? point.y,
        x: point.x,
        y: point.y,
      };
      dragRef.current = next;
      setDrag(next);
    },
    [hud, toLocal],
  );

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const onMove = (event: PointerEvent) => {
      const point = toLocal(event.clientX, event.clientY);
      setDrag((current) => {
        if (!current) {
          return current;
        }
        const next = { ...current, x: point.x, y: point.y };
        dragRef.current = next;
        return next;
      });
    };

    const onUp = (event: PointerEvent) => {
      const point = toLocal(event.clientX, event.clientY);
      const current = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!current) {
        return;
      }
      const targetId = hitBaseRef.current(point.x, point.y, current.fromId);
      if (targetId && playing) {
        sendTroops(current.fromId, targetId, current.portion);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isDragging, playing, room, sendTroops, toLocal]);

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-20">
        <BaseSendOverlay
          bases={hud}
          playing={playing}
          onDragStart={onDragStart}
        />
        {drag ? (
          <svg className="absolute inset-0 h-full w-full">
            <line
              x1={drag.fromX}
              y1={drag.fromY}
              x2={drag.x}
              y2={drag.y}
              stroke="#60a5fa"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={drag.x} cy={drag.y} r="6" fill="#60a5fa" />
          </svg>
        ) : null}
      </div>
    </div>
  );
}
