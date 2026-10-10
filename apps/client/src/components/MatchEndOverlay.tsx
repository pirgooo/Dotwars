interface MatchEndOverlayProps {
  result: "win" | "lose" | "draw";
  timedOut: boolean;
  onRestart: () => void;
}

export function MatchEndOverlay({ result, timedOut, onRestart }: MatchEndOverlayProps) {
  const title = result === "win" ? "Победа" : result === "lose" ? "Поражение" : "Ничья";
  const detail =
    result === "draw"
      ? "Базы и войска сравнялись."
      : timedOut
        ? result === "win"
          ? "По времени: больше баз и войск."
          : "По времени: у соперника больше баз и войск."
        : result === "win"
          ? "На карте не осталось врага."
          : "Твои базы захвачены.";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 px-6">
      <div className="w-full max-w-xs rounded-3xl border border-slate-700 bg-slate-900/95 px-6 py-8 text-center shadow-2xl">
        <p className="text-[11px] uppercase tracking-[0.35em] text-sky-400">Dot Wars</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{detail}</p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-6 w-full rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
        >
          Ещё раз
        </button>
      </div>
    </div>
  );
}
