import type { PlayerProfile } from "@dotwars/shared";
import { pulseTap, playAppUrl, shareInviteLink } from "../telegram";

interface MatchEndOverlayProps {
  result: "win" | "lose" | "draw";
  timedOut: boolean;
  player: PlayerProfile | null;
  stakeNote?: string;
  canRestart?: boolean;
  onRestart: () => void;
  onMenu: () => void;
}

function shareLine(result: "win" | "lose" | "draw"): string {
  if (result === "win") {
    return "Dot Wars — I took the map. Your move.";
  }
  if (result === "lose") {
    return "Dot Wars — rematch?";
  }
  return "Dot Wars — draw. One more?";
}

export function MatchEndOverlay({
  result,
  timedOut,
  player,
  stakeNote,
  canRestart = true,
  onRestart,
  onMenu,
}: MatchEndOverlayProps) {
  const title = result === "win" ? "Victory" : result === "lose" ? "Defeat" : "Draw";
  const detail =
    result === "draw"
      ? "Bases and troops are even."
      : timedOut
        ? result === "win"
          ? "Time's up: more bases and troops."
          : "Time's up: the opponent has more bases and troops."
        : result === "win"
          ? "No enemies left on the map."
          : "Your bases were captured.";

  const onShare = () => {
    pulseTap();
    shareInviteLink(playAppUrl(), shareLine(result));
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[color-mix(in_srgb,var(--origami-blue)_88%,black)] px-6">
      <div className="w-full max-w-xs border border-white/30 px-6 py-10 text-center text-white">
        <p className="origami-kicker text-white/70">Dot wars</p>
        <h2 className="origami-title mt-4 text-[52px]">{title.toLowerCase()}</h2>
        <p className="mt-3 text-sm leading-5 text-white/75">{stakeNote || detail}</p>
        {player ? (
          <p className="mt-4 text-[11px] tracking-[0.14em] text-white/70">
            {player.games} games · {player.wins} wins
            {player.draws ? ` · ${player.draws} draws` : ""}
          </p>
        ) : null}
        {canRestart ? (
          <button type="button" onClick={onRestart} className="origami-pill mt-8 w-full py-3.5">
            Play again
          </button>
        ) : null}
        <button
          type="button"
          onClick={onShare}
          className={`origami-pill origami-ghost w-full py-3.5 ${canRestart ? "mt-3" : "mt-8"}`}
        >
          Share
        </button>
        <button type="button" onClick={onMenu} className="origami-pill origami-ghost mt-3 w-full py-3.5">
          Menu
        </button>
      </div>
    </div>
  );
}
