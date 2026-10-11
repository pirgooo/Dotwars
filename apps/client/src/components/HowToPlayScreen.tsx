import { pulseTap } from "../telegram";
import { Crystal, FoldMark } from "./origami/OrigamiArt";
import { OrigamiDock, OrigamiDockSlot, OrigamiShell } from "./origami/OrigamiDock";

export const HOW_TO_PLAY_KEY = "dotwars.howto";

export function howToPlayPending(): boolean {
  return localStorage.getItem(HOW_TO_PLAY_KEY) !== "1";
}

export function completeHowToPlay(): void {
  localStorage.setItem(HOW_TO_PLAY_KEY, "1");
}

interface HowToPlayScreenProps {
  fromMenu?: boolean;
  onContinue: () => void;
  onBack: () => void;
}

export function HowToPlayScreen({ fromMenu = false, onContinue, onBack }: HowToPlayScreenProps) {
  return (
    <OrigamiShell>
      <header className="relative z-10 flex items-start">
        <div className="flex items-center gap-2 text-white">
          <FoldMark className="h-7 w-7" />
          <div className="leading-tight">
            <p className="text-[11px] font-semibold tracking-[0.08em]">dot wars</p>
            <p className="text-[10px] tracking-[0.18em] text-white/70">we love dots</p>
          </div>
        </div>
      </header>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden text-center">
        <Crystal className="h-24 w-24" />
        <h1 className="origami-title mt-8 text-[42px]">play</h1>
        <ul className="mt-8 max-w-80 space-y-3 text-[15px] leading-snug tracking-wide text-white/85">
          <li>Tap your own base</li>
          <li>Drag onto another — the whole garrison goes</li>
          <li>Hold more bases to win</li>
        </ul>
      </div>
      <OrigamiDock stats={fromMenu ? "How to play" : "Shown once"}>
        <button
          type="button"
          onClick={() => {
            pulseTap();
            onContinue();
          }}
          className="origami-pill w-full bg-white text-[var(--origami-blue)]"
        >
          Got it
        </button>
        <OrigamiDockSlot />
        <button
          type="button"
          onClick={() => {
            pulseTap();
            onBack();
          }}
          className="origami-pill origami-ghost w-full"
        >
          Back
        </button>
      </OrigamiDock>
    </OrigamiShell>
  );
}
