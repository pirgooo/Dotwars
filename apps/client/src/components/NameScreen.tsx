import { useState } from "react";
import { pulseTap } from "../telegram";
import { useWalletAuth } from "../wallet/WalletAuth";
import { Crystal, FoldMark } from "./origami/OrigamiArt";
import { OrigamiDock, OrigamiDockSlot, OrigamiShell } from "./origami/OrigamiDock";

interface NameScreenProps {
  onDone: () => void;
}

export function NameScreen({ onDone }: NameScreenProps) {
  const { player, rename, error } = useWalletAuth();
  const [name, setName] = useState(player?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const trimmed = name.trim().replace(/\s+/g, " ");
  const invalid = trimmed.length < 2 || trimmed.length > 24;

  const save = () => {
    if (invalid || busy) {
      setLocalError("Name must be 2–24 characters");
      return;
    }
    pulseTap();
    setBusy(true);
    setLocalError(null);
    void rename(trimmed)
      .then(onDone)
      .catch((reason: unknown) => {
        setLocalError(reason instanceof Error ? reason.message : "Could not save name");
      })
      .finally(() => setBusy(false));
  };

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
        <h1 className="origami-title mt-8 text-[42px]">name</h1>
        <p className="origami-kicker mt-3 text-white/80">Shown in duels</p>
        <label className="mt-8 w-full max-w-80">
          <input
            aria-label="Display name"
            value={name}
            maxLength={24}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                save();
              }
            }}
            className="w-full border-b border-white/50 bg-transparent py-2 text-center text-[22px] font-semibold tracking-wide text-white outline-none placeholder:text-white/35"
            placeholder="Your name"
          />
        </label>
      </div>
      <OrigamiDock
        stats={`${trimmed.length}/24`}
        error={
          localError || error ? (
            <p className="text-center text-[12px] text-white">{localError || error}</p>
          ) : null
        }
      >
        <button
          type="button"
          disabled={busy || invalid}
          onClick={save}
          className="origami-pill w-full bg-white text-[var(--origami-blue)]"
        >
          Save
        </button>
        <OrigamiDockSlot />
        <button type="button" onClick={onDone} className="origami-pill origami-ghost w-full">
          Cancel
        </button>
      </OrigamiDock>
    </OrigamiShell>
  );
}
