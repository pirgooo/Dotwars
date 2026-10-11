import { COUNTDOWN_SECONDS, formatStake } from "@dotwars/shared";
import type { HudFighter } from "../game/useMatchRoom";

interface MatchHudProps {
  status: "connecting" | "live" | "error";
  error: string | null;
  phase: "waiting" | "playing" | "ended";
  timeLeft: number;
  countdown: number;
  myBases: number;
  enemyBases: number;
  me: HudFighter;
  enemy: HudFighter;
  stakeGrams?: number;
  onBack: () => void;
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function Dot({ color }: { color: string }) {
  return (
    <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
  );
}

export function MatchHud({
  status,
  error,
  phase,
  timeLeft,
  countdown,
  myBases,
  enemyBases,
  me,
  enemy,
  stakeGrams = 0,
  onBack,
}: MatchHudProps) {
  const showClock = status === "live" && phase !== "waiting";
  const showScore = status === "live" && phase !== "ended";
  const tick = Math.max(1, Math.min(COUNTDOWN_SECONDS, Math.ceil(countdown)));
  const statusText =
    status === "connecting"
      ? "Connecting to server…"
      : status === "error"
        ? (error ?? "No server connection")
        : null;

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 px-6 pt-[var(--app-header)]">
        <button
          type="button"
          onClick={onBack}
          className="pointer-events-auto rounded-full border border-white/70 px-3 py-1 text-xs font-medium text-white"
        >
          Back
        </button>
        <div className="flex max-w-[72%] flex-wrap items-center justify-end gap-2">
          {statusText ? (
            <p className="rounded-full border border-white/40 px-3 py-1 text-xs text-white/85">{statusText}</p>
          ) : null}
          {showClock ? (
            <p className="rounded-full bg-white px-3 py-1 font-mono text-sm tabular-nums text-[var(--origami-blue)]">
              {formatClock(timeLeft)}
            </p>
          ) : null}
          {stakeGrams > 0 && showClock ? (
            <p className="rounded-full border border-white/70 px-3 py-1 text-xs text-white">{formatStake(stakeGrams)}</p>
          ) : null}
          {showScore ? (
            <p className="flex items-center gap-1.5 rounded-full border border-white/70 px-3 py-1 text-xs tabular-nums text-white">
              <Dot color={me.color} />
              <span className="max-w-20 truncate">
                {me.name} {myBases}
              </span>
              <span className="text-white/50">·</span>
              <Dot color={enemy.color} />
              <span className="max-w-20 truncate">
                {enemy.name} {enemyBases}
              </span>
            </p>
          ) : null}
        </div>
      </header>

      {status === "live" && phase === "waiting" ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <p className="origami-title text-white">{tick}</p>
        </div>
      ) : null}
    </>
  );
}
