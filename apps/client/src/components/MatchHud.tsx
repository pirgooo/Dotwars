import { COUNTDOWN_SECONDS } from "@dotwars/shared";

interface MatchHudProps {
  status: "connecting" | "live" | "error";
  error: string | null;
  phase: "waiting" | "playing" | "ended";
  versusBot: boolean;
  telegramReady: boolean;
  timeLeft: number;
  countdown: number;
  myBases: number;
  enemyBases: number;
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function MatchHud({
  status,
  error,
  phase,
  versusBot,
  telegramReady,
  timeLeft,
  countdown,
  myBases,
  enemyBases,
}: MatchHudProps) {
  const hint =
    status === "connecting"
      ? "Подключение к серверу…"
      : status === "error"
        ? (error ?? "Нет связи с сервером")
        : phase === "ended"
          ? "Бой окончен"
          : phase === "waiting"
            ? versusBot
              ? "Ожидание соперника · иначе старт против бота"
              : "Соперник на месте · старт"
            : versusBot
              ? telegramReady
                ? "Против бота · потяни ½ или «все»"
                : "Против бота"
              : "PvP · потяни ½ или «все» с своей базы";

  const showClock = status === "live" && phase !== "waiting";
  const tick = Math.max(1, Math.min(COUNTDOWN_SECONDS, Math.ceil(countdown)));

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-1 px-4 pt-5 text-center">
        <div className="flex items-baseline gap-3">
          <p className="text-[11px] uppercase tracking-[0.35em] text-sky-400">Dot Wars</p>
          {showClock ? (
            <p className="font-mono text-sm tabular-nums text-white">{formatClock(timeLeft)}</p>
          ) : null}
        </div>
        {status === "live" && phase !== "ended" ? (
          <p className="text-xs text-slate-300">
            свои {myBases} · враг {enemyBases}
          </p>
        ) : null}
        <p className="text-xs text-slate-400">{hint}</p>
      </header>

      {status === "live" && phase === "waiting" ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <p className="text-7xl font-semibold tabular-nums text-white/90">{tick}</p>
        </div>
      ) : null}
    </>
  );
}
