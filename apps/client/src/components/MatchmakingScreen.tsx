import { useState } from "react";
import { pulseTap, shareInviteLink } from "../telegram";
import { Crystal, FoldMark } from "./origami/OrigamiArt";
import { OrigamiDock, OrigamiDockSlot } from "./origami/OrigamiDock";

interface MatchmakingScreenProps {
  onCancel: () => void;
  inviting?: boolean;
  inviteUrl?: string | null;
}

export function MatchmakingScreen({ onCancel, inviting = false, inviteUrl }: MatchmakingScreenProps) {
  const [copied, setCopied] = useState(false);

  const onShare = () => {
    if (!inviteUrl) {
      return;
    }
    pulseTap();
    shareInviteLink(inviteUrl);
  };

  const onCopy = async () => {
    if (!inviteUrl) {
      return;
    }
    pulseTap();
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

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
        <Crystal className="h-24 w-24 animate-pulse" />
        <h1 className="origami-title mt-8 text-[42px]">{inviting ? "invite" : "search"}</h1>
        <p className="origami-kicker mt-3 text-white/80">
          {inviting ? "Versus a friend" : "Finding an opponent"}
        </p>
      </div>
      <OrigamiDock stats={<span className="invisible">0 games · 0 wins · 0 losses</span>}>
        {inviting ? (
          <>
            <button type="button" onClick={onShare} disabled={!inviteUrl} className="origami-pill w-full">
              Share in Telegram
            </button>
            <button type="button" onClick={() => void onCopy()} className="origami-pill origami-ghost w-full">
              {copied ? "Copied" : "Copy link"}
            </button>
            <button type="button" onClick={onCancel} className="origami-pill origami-ghost w-full">
              Cancel
            </button>
          </>
        ) : (
          <>
            <OrigamiDockSlot>Vs bots</OrigamiDockSlot>
            <button type="button" onClick={onCancel} className="origami-pill origami-ghost w-full">
              Cancel
            </button>
            <OrigamiDockSlot>Invite to PvP</OrigamiDockSlot>
          </>
        )}
      </OrigamiDock>
    </div>
  );
}
