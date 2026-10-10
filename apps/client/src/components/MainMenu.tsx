import type { MatchMode, PlayerProfile } from "@dotwars/shared";
import { WalletBar } from "../wallet/ConnectGramButton";
import { OrigamiDock } from "./origami/OrigamiDock";
import { FoldMark, OrigamiGallery } from "./origami/OrigamiArt";

interface MainMenuProps {
  busy: boolean;
  error: string | null;
  player: PlayerProfile | null;
  onPlay: (mode: MatchMode) => void;
  onInvite: () => void;
}

export function MainMenu({ busy, error, player, onPlay, onInvite }: MainMenuProps) {
  const locked = busy || !player;

  return (
    <div className="origami-screen px-6 pb-6 pt-[var(--app-header)]">
      <header className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-white">
          <FoldMark className="h-7 w-7" />
          <div className="leading-tight">
            <p className="text-[11px] font-semibold tracking-[0.08em]">dot wars</p>
            <p className="text-[10px] tracking-[0.18em] text-white/70">we love dots</p>
          </div>
        </div>
        <WalletBar />
      </header>

      <div className="relative z-10 mt-8 text-center">
        <h1 className="origami-title">dot wars</h1>
        <p className="origami-kicker mt-3 text-white/80">Territory rts</p>
      </div>

      <div className="relative z-10 flex flex-1 items-center">
        <OrigamiGallery />
      </div>

      <OrigamiDock
        stats={
          player ? (
            <>
              {player.games} games · {player.wins} wins · {player.losses} losses
              {player.draws ? ` · ${player.draws} draws` : ""}
            </>
          ) : (
            "Connect Gram wallet to play"
          )
        }
        error={error ? <p className="text-center text-[12px] text-white">{error}</p> : null}
      >
        <button
          type="button"
          disabled={locked}
          onClick={() => onPlay("bot")}
          className="origami-pill w-full bg-white text-[var(--origami-blue)]"
        >
          Vs bots
        </button>
        <button
          type="button"
          disabled
          className="origami-pill origami-ghost flex w-full flex-col gap-0.5 leading-tight"
        >
          <span>Find a match</span>
          <span className="text-[11px] font-medium tracking-[0.12em] uppercase opacity-80">Coming soon</span>
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={onInvite}
          className="origami-pill origami-ghost w-full"
        >
          Invite to PvP
        </button>
      </OrigamiDock>
      <p className="pointer-events-none absolute bottom-[var(--app-footer)] right-6 z-10 text-[10px] tracking-[0.18em] text-white/40">
        v{__APP_VERSION__}
      </p>
    </div>
  );
}
