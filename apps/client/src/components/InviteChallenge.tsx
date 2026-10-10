import { formatStake } from "@dotwars/shared";
import { WalletBar } from "../wallet/ConnectGramButton";
import { Crystal, FoldMark } from "./origami/OrigamiArt";
import { OrigamiDock, OrigamiDockSlot } from "./origami/OrigamiDock";

interface InviteChallengeProps {
  hostName: string;
  expired: boolean;
  loading: boolean;
  locked: boolean;
  error: string | null;
  canAccept: boolean;
  stakeGrams: number;
  onAccept: () => void;
  onDecline: () => void;
}

export function InviteChallenge({
  hostName,
  expired,
  loading,
  locked,
  error,
  canAccept,
  stakeGrams,
  onAccept,
  onDecline,
}: InviteChallengeProps) {
  const kicker = loading
    ? "Looking up invite"
    : expired
      ? "Invite expired"
      : stakeGrams > 0
        ? `${hostName} · ${formatStake(stakeGrams)}`
        : `${hostName} challenged you`;

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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <Crystal className="h-24 w-24" />
        <h1 className="origami-title mt-8 text-[42px]">duel</h1>
        <p className="origami-kicker mt-3 text-white/80">{kicker}</p>
      </div>
      <OrigamiDock
        stats={
          expired
            ? "This invite is no longer open"
            : !canAccept
              ? "Connect Gram wallet to accept"
              : stakeGrams > 0
                ? "You send GRAM to the contract after join"
                : "Accept to join the match"
        }
        error={error ? <p className="text-center text-[12px] text-white">{error}</p> : null}
      >
        <button
          type="button"
          disabled={locked || expired || loading || !canAccept}
          onClick={onAccept}
          className="origami-pill w-full bg-white text-[var(--origami-blue)]"
        >
          Accept
        </button>
        <button type="button" onClick={onDecline} className="origami-pill origami-ghost w-full">
          Decline
        </button>
        <OrigamiDockSlot>Invite to PvP</OrigamiDockSlot>
      </OrigamiDock>
    </div>
  );
}
