import type { SendPortion } from "@dotwars/shared";
import type { HudBase } from "../game/hudTypes";

interface BaseSendOverlayProps {
  bases: HudBase[];
  playing: boolean;
  onDragStart: (baseId: string, portion: SendPortion, x: number, y: number) => void;
}

export function BaseSendOverlay({ bases, playing, onDragStart }: BaseSendOverlayProps) {
  if (!playing) {
    return null;
  }

  return (
    <>
      {bases
        .filter((base) => base.mine)
        .map((base) => {
          const size = base.radius * 2;
          return (
            <div
              key={base.id}
              className="pointer-events-none absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1"
              style={{
                left: base.x,
                top: base.y,
                width: size,
                height: size,
              }}
            >
              <span className="text-[15px] font-bold leading-none text-white drop-shadow">
                {base.garrison}
              </span>
              {base.garrison > 0 ? (
                <div className="flex w-[72%] items-center justify-center gap-1">
                  <SendHandle
                    label="½"
                    disabled={base.garrison < 2}
                    onDragStart={(x, y) => onDragStart(base.id, "half", x, y)}
                  />
                  <SendHandle
                    label="все"
                    onDragStart={(x, y) => onDragStart(base.id, "all", x, y)}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
    </>
  );
}

interface SendHandleProps {
  label: string;
  disabled?: boolean;
  onDragStart: (x: number, y: number) => void;
}

function SendHandle({ label, disabled, onDragStart }: SendHandleProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="pointer-events-auto min-w-0 flex-1 touch-none rounded-full border border-white/50 bg-black/35 px-1 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40"
      onPointerDown={(event) => {
        if (disabled || event.button !== 0) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        onDragStart(event.clientX, event.clientY);
      }}
    >
      {label}
    </button>
  );
}
