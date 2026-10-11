import { useState } from "react";
import { STAKE_PRESETS, formatRake, formatStake, winnerPayoutGrams, type EscrowConfig } from "@dotwars/shared";
import { pulseTap } from "../telegram";
import { Crystal, FoldMark } from "./origami/OrigamiArt";
import { OrigamiDock, OrigamiDockSlot, OrigamiShell } from "./origami/OrigamiDock";

interface InviteStakeScreenProps {
  walletOk: boolean;
  escrow: EscrowConfig | null;
  onConfirm: (stakeGrams: number) => void;
  onCancel: () => void;
}

export function InviteStakeScreen({ walletOk, escrow, onConfirm, onCancel }: InviteStakeScreenProps) {
  const [index, setIndex] = useState(0);
  const stakeGrams = STAKE_PRESETS[index] ?? 0;
  const paidBlocked = stakeGrams > 0 && (!escrow?.configured || !walletOk);

  const shift = (delta: number) => {
    pulseTap();
    setIndex((current) => Math.max(0, Math.min(STAKE_PRESETS.length - 1, current + delta)));
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
        <h1 className="origami-title mt-8 text-[42px]">stake</h1>
        <p className="origami-kicker mt-3 text-white/80">
          {stakeGrams > 0
            ? escrow?.configured
              ? `Winner takes ${formatStake(winnerPayoutGrams(stakeGrams, escrow.rakeBps))} · ${formatRake(escrow.rakeBps)} rake`
              : "Escrow is not configured"
            : "No GRAM this match"}
        </p>
        <div className="mt-8 flex items-center gap-6">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => shift(-1)}
            className="origami-pill origami-ghost h-14 w-14 shrink-0 text-2xl"
          >
            −
          </button>
          <p className="min-w-28 text-[28px] font-semibold tracking-wide text-white">{formatStake(stakeGrams)}</p>
          <button
            type="button"
            disabled={index === STAKE_PRESETS.length - 1}
            onClick={() => shift(1)}
            className="origami-pill origami-ghost h-14 w-14 shrink-0 text-2xl"
          >
            +
          </button>
        </div>
      </div>
      <OrigamiDock
        stats={
          stakeGrams > 0 && !walletOk
            ? "Connect Gram wallet to stake"
            : "On-chain escrow · not a house wallet"
        }
      >
        <button
          type="button"
          disabled={paidBlocked}
          onClick={() => {
            pulseTap();
            onConfirm(stakeGrams);
          }}
          className="origami-pill w-full bg-white text-[var(--origami-blue)]"
        >
          Continue
        </button>
        <OrigamiDockSlot />
        <button type="button" onClick={onCancel} className="origami-pill origami-ghost w-full">
          Cancel
        </button>
      </OrigamiDock>
    </OrigamiShell>
  );
}
