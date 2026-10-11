import { useEffect, useState } from "react";
import type { MatchMode, PlayerProfile } from "@dotwars/shared";
import { bindBackButton } from "../telegram";
import { WalletBar } from "../wallet/ConnectGramButton";
import { NameScreen } from "./NameScreen";
import { OrigamiDock, OrigamiShell } from "./origami/OrigamiDock";
import { FoldMark, OrigamiGallery } from "./origami/OrigamiArt";

interface MainMenuProps {
  busy: boolean;
  error: string | null;
  player: PlayerProfile | null;
  onPlay: (mode: MatchMode) => void;
  onInvite: () => void;
  onHowTo: () => void;
}

export function MainMenu({ busy, error, player, onPlay, onInvite, onHowTo }: MainMenuProps) {
  const [naming, setNaming] = useState(false);
  const locked = busy || !player;

  useEffect(() => {
    if (!naming) {
      return;
    }
    bindBackButton(() => setNaming(false));
    return () => bindBackButton(null);
  }, [naming]);

  if (naming) {
    return <NameScreen onDone={() => setNaming(false)} />;
  }

  return (
    <OrigamiShell>
      <header className="relative z-10 flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onHowTo}
          className="flex items-center gap-2 text-left text-white"
          aria-label="How to play"
        >
          <FoldMark className="h-7 w-7" />
          <div className="leading-tight">
            <p className="text-[11px] font-semibold tracking-[0.08em]">dot wars</p>
            <p className="text-[10px] tracking-[0.18em] text-white/70">we love dots</p>
          </div>
        </button>
        <WalletBar onEditName={player ? () => setNaming(true) : undefined} />
      </header>

      <div className="relative z-10 mt-8 text-center">
        <h1 className="origami-title">dot wars</h1>
        <p className="origami-kicker mt-3 text-white/80">Territory rts</p>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 items-center">
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
            "Log in to play"
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
    </OrigamiShell>
  );
}
