import { formatRake, formatStake, winnerPayoutGrams } from "@dotwars/shared";
import { pulseTap } from "../telegram";
import { Crystal, FoldMark } from "./origami/OrigamiArt";
import { OrigamiDock, OrigamiDockSlot } from "./origami/OrigamiDock";

interface EscrowScreenProps {
  stakeGrams: number;
  rakeBps: number;
  iPaid: boolean;
  theyPaid: boolean;
  sending: boolean;
  error: string | null;
  onSend: () => void;
  onCancel: () => void;
}

export function EscrowScreen({
  stakeGrams,
  rakeBps,
  iPaid,
  theyPaid,
  sending,
  error,
  onSend,
  onCancel,
}: EscrowScreenProps) {
  const payout = winnerPayoutGrams(stakeGrams, rakeBps);
  const kicker = iPaid
    ? theyPaid
      ? "Both stakes locked"
      : "Waiting for opponent"
    : "Send GRAM to the contract";

  return (
    <div className="origami-screen px-6 pb-6 pt-[var(--app-header)]">
      <header className="relative z-10 flex items-start">
        <div className="flex items-center gap-2 text-white">
          <FoldMark className="h-7 w-7" />
          <div className="leading-tight">
            <p className="text-[11px] font-semibold tracking-[0.08em]">dot wars</p>
            <p className="text-[10px] tracking-[0.18em] text-white/70">we love dots</p>
          </div>
        </div>
      </header>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <Crystal className="h-24 w-24" />
        <h1 className="origami-title mt-8 text-[42px]">escrow</h1>
        <p className="origami-kicker mt-3 text-white/80">{kicker}</p>
        <p className="mt-4 text-[12px] tracking-wide text-white/70">
          You {iPaid ? "paid" : "unpaid"} · Opponent {theyPaid ? "paid" : "unpaid"}
        </p>
      </div>
      <OrigamiDock
        stats={`Winner takes ${formatStake(payout)} · ${formatRake(rakeBps)} rake`}
        error={error ? <p className="text-center text-[12px] text-white">{error}</p> : null}
      >
        <button
          type="button"
          disabled={iPaid || sending}
          onClick={() => {
            pulseTap();
            onSend();
          }}
          className="origami-pill w-full bg-white text-[var(--origami-blue)]"
        >
          {iPaid ? "Stake sent" : sending ? "Open wallet" : `Send ${formatStake(stakeGrams)}`}
        </button>
        <OrigamiDockSlot />
        <button type="button" onClick={onCancel} className="origami-pill origami-ghost w-full">
          Cancel
        </button>
      </OrigamiDock>
    </div>
  );
}
