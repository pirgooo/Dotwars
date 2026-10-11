import { useEffect, useState } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import type { EscrowConfig, InviteInfo, MatchMode } from "@dotwars/shared";
import { formatStake, winnerPayoutGrams } from "@dotwars/shared";
import { EscrowScreen } from "./components/EscrowScreen";
import { GameCanvas } from "./components/GameCanvas";
import { InviteChallenge } from "./components/InviteChallenge";
import { InviteStakeScreen } from "./components/InviteStakeScreen";
import { MainMenu } from "./components/MainMenu";
import { MatchEndOverlay } from "./components/MatchEndOverlay";
import { MatchHud } from "./components/MatchHud";
import { MatchmakingScreen } from "./components/MatchmakingScreen";
import { OrigamiPageMark } from "./components/origami/OrigamiDock";
import { getApiUrl, readJson } from "./game/apiUrl";
import { useMatchRoom } from "./game/useMatchRoom";
import { bindBackButton, clearInviteFromUrl, pulseTap, readInviteCode } from "./telegram";
import { fetchDepositIntent, sendEscrowDeposit } from "./wallet/sendEscrow";
import { useWalletAuth } from "./wallet/WalletAuth";

interface ChallengeView {
  roomId: string;
  hostName: string;
  stakeGrams: number;
  expired: boolean;
}

interface AppProps {
  telegramReady: boolean;
}

export function App(_props: AppProps) {
  const {
    status,
    error,
    queuedMode,
    room,
    phase,
    winnerId,
    seekingOpponent,
    timedOut,
    timeLeft,
    countdown,
    myBases,
    enemyBases,
    me,
    enemy,
    hostingInvite,
    inviteUrl,
    play,
    inviteFriend,
    joinInvite,
    leaveToMenu,
    sendTroops,
    restartMatch,
    notifyEscrowSent,
    stakeGrams,
    rakeBps,
    escrow,
    hostPaid,
    guestPaid,
    payout,
  } = useMatchRoom();
  const auth = useWalletAuth();
  const [tonConnectUI] = useTonConnectUI();
  const [challenge, setChallenge] = useState<ChallengeView | null>(null);
  const [inviteIgnored, setInviteIgnored] = useState(false);
  const [inviteLookup, setInviteLookup] = useState(() => Boolean(readInviteCode()));
  const [pickingStake, setPickingStake] = useState(false);
  const [pendingStake, setPendingStake] = useState(0);
  const [escrowConfig, setEscrowConfig] = useState<EscrowConfig | null>(null);
  const [sendingStake, setSendingStake] = useState(false);
  const [escrowError, setEscrowError] = useState<string | null>(null);

  useEffect(() => {
    if (inviteIgnored) {
      setInviteLookup(false);
      return;
    }
    const code = readInviteCode();
    if (!code) {
      setInviteLookup(false);
      return;
    }
    let cancelled = false;
    const lookup = (first: boolean) => {
      if (first) {
        setInviteLookup(true);
      }
      void fetch(`${getApiUrl()}/invite/${encodeURIComponent(code)}`)
        .then(async (response) => {
          if (cancelled) {
            return;
          }
          if (!response.ok) {
            setChallenge({ roomId: code, hostName: "", stakeGrams: 0, expired: true });
            return;
          }
          const data = await readJson<InviteInfo>(response);
          setChallenge({
            roomId: data.roomId,
            hostName: data.hostName,
            stakeGrams: data.stakeGrams ?? 0,
            expired: false,
          });
        })
        .catch(() => {
          if (!cancelled) {
            setChallenge({ roomId: code, hostName: "", stakeGrams: 0, expired: true });
          }
        })
        .finally(() => {
          if (!cancelled && first) {
            setInviteLookup(false);
          }
        });
    };
    lookup(true);
    const timer = window.setInterval(() => lookup(false), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [inviteIgnored]);

  useEffect(() => {
    void fetch(`${getApiUrl()}/escrow/config`)
      .then((response) => readJson<EscrowConfig>(response))
      .then(setEscrowConfig)
      .catch(() => setEscrowConfig(null));
  }, []);

  const declineChallenge = () => {
    pulseTap();
    setInviteIgnored(true);
    setInviteLookup(false);
    setChallenge(null);
    clearInviteFromUrl();
  };

  const acceptChallenge = () => {
    if (!auth.token || !challenge || challenge.expired) {
      return;
    }
    pulseTap();
    const roomId = challenge.roomId;
    const token = auth.token;
    void (async () => {
      try {
        const response = await fetch(`${getApiUrl()}/invite/${encodeURIComponent(roomId)}`);
        if (!response.ok) {
          setChallenge({ roomId, hostName: "", stakeGrams: challenge.stakeGrams, expired: true });
          return;
        }
      } catch {
        setChallenge({ roomId, hostName: challenge.hostName, stakeGrams: challenge.stakeGrams, expired: true });
        return;
      }
      setInviteIgnored(true);
      setInviteLookup(false);
      setChallenge(null);
      clearInviteFromUrl();
      void joinInvite(roomId, token);
    })();
  };

  const inMenu = !room && status !== "connecting" && !challenge && !inviteLookup && !pickingStake;
  const funding =
    Boolean(room) &&
    stakeGrams > 0 &&
    escrow === "awaiting" &&
    !seekingOpponent &&
    phase === "waiting";
  const pvpMatched =
    queuedMode === "pvp" &&
    Boolean(room) &&
    status === "live" &&
    !seekingOpponent &&
    !funding &&
    (phase === "playing" || phase === "ended" || countdown > 0);
  const searching = queuedMode === "pvp" && status !== "error" && !pvpMatched && !funding;
  const inMatch = Boolean(room && !searching);

  useEffect(() => {
    if (challenge || inviteLookup) {
      bindBackButton(declineChallenge);
      return () => bindBackButton(null);
    }
    if (pickingStake) {
      bindBackButton(() => setPickingStake(false));
      return () => bindBackButton(null);
    }
    bindBackButton(inMenu ? null : leaveToMenu);
    return () => bindBackButton(null);
  }, [challenge, inviteLookup, pickingStake, inMenu, leaveToMenu]);

  const onPlay = (mode: MatchMode) => {
    if (!auth.token) {
      return;
    }
    pulseTap();
    void play(mode, auth.token);
  };

  const onInvite = () => {
    if (!auth.token) {
      return;
    }
    pulseTap();
    setPickingStake(true);
  };

  const confirmInviteStake = (stakeGrams: number) => {
    if (!auth.token) {
      return;
    }
    setPendingStake(stakeGrams);
    setPickingStake(false);
    void inviteFriend(auth.token, stakeGrams);
  };

  const onBack = () => {
    pulseTap();
    leaveToMenu();
  };

  const iPaid = hostingInvite ? hostPaid : guestPaid;
  const theyPaid = hostingInvite ? guestPaid : hostPaid;

  const onSendStake = () => {
    if (!room || sendingStake || iPaid) {
      return;
    }
    setEscrowError(null);
    setSendingStake(true);
    void (async () => {
      try {
        if (escrowConfig?.simulate) {
          notifyEscrowSent();
          return;
        }
        const intent = await fetchDepositIntent(room.roomId);
        await sendEscrowDeposit((tx) => tonConnectUI.sendTransaction(tx), intent);
        notifyEscrowSent();
      } catch (reason) {
        setEscrowError(reason instanceof Error ? reason.message : "Could not send GRAM");
      } finally {
        setSendingStake(false);
      }
    })();
  };

  const result =
    winnerId === ""
      ? "draw"
      : room && winnerId === room.sessionId
        ? "win"
        : "lose";

  if (inviteLookup || challenge) {
    return (
      <InviteChallenge
        hostName={challenge?.hostName ?? ""}
        expired={Boolean(challenge?.expired)}
        loading={inviteLookup}
        locked={!auth.ready}
        error={error ?? auth.error}
        canAccept={Boolean(
          auth.token &&
            challenge &&
            !challenge.expired &&
            (challenge.stakeGrams <= 0 || !auth.player?.stub),
        )}
        stakeGrams={challenge?.stakeGrams ?? 0}
        onAccept={acceptChallenge}
        onDecline={declineChallenge}
      />
    );
  }

  if (pickingStake) {
    return (
      <InviteStakeScreen
        walletOk={!auth.player?.stub}
        escrow={escrowConfig}
        onConfirm={confirmInviteStake}
        onCancel={() => setPickingStake(false)}
      />
    );
  }

  if (inMenu) {
    return (
      <MainMenu
        busy={!auth.ready}
        error={error ?? auth.error}
        player={auth.player}
        onPlay={onPlay}
        onInvite={onInvite}
      />
    );
  }

  if (searching) {
    return (
      <MatchmakingScreen
        onCancel={onBack}
        inviting={hostingInvite}
        inviteUrl={inviteUrl}
        stakeGrams={stakeGrams || pendingStake}
        iPaid={iPaid}
        sendingStake={sendingStake}
        onSendStake={stakeGrams > 0 || pendingStake > 0 ? onSendStake : undefined}
      />
    );
  }

  if (funding) {
    return (
      <EscrowScreen
        stakeGrams={stakeGrams || pendingStake}
        rakeBps={rakeBps || escrowConfig?.rakeBps || 0}
        iPaid={iPaid}
        theyPaid={theyPaid}
        sending={sendingStake}
        error={escrowError ?? error}
        onSend={onSendStake}
        onCancel={onBack}
      />
    );
  }

  if (status === "connecting" && !room) {
    return (
      <div className="origami-screen items-center justify-center">
        <p className="origami-kicker relative z-10">Connecting</p>
        <OrigamiPageMark />
      </div>
    );
  }

  return (
    <div className="origami-screen">
      <div className="relative min-h-0 flex-1">
        {inMatch && room ? (
          <GameCanvas room={room} playing={phase === "playing"} sendTroops={sendTroops} />
        ) : null}

        <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
          <div className="absolute inset-x-[10px] top-[var(--app-top)] h-[18px] border border-b-0 border-white/28" />
          <div className="absolute inset-x-[10px] bottom-[var(--app-bottom)] h-[18px] border border-t-0 border-white/28" />
        </div>

        <MatchHud
          status={status === "idle" ? "connecting" : status}
          error={error}
          phase={phase}
          timeLeft={timeLeft}
          countdown={countdown}
          myBases={myBases}
          enemyBases={enemyBases}
          me={me}
          enemy={enemy}
          stakeGrams={stakeGrams}
          onBack={onBack}
        />

        {room && phase === "ended" ? (
          <MatchEndOverlay
            result={result}
            timedOut={timedOut}
            canRestart={stakeGrams <= 0}
            stakeNote={
              stakeGrams > 0
                ? result === "win"
                  ? payout === "queued"
                    ? `Payout queued · ${formatStake(winnerPayoutGrams(stakeGrams, rakeBps))}`
                    : `Payout ${formatStake(winnerPayoutGrams(stakeGrams, rakeBps))}`
                  : result === "draw"
                    ? "Stakes refunded"
                    : "Stake goes to the winner"
                : undefined
            }
            onRestart={restartMatch}
            onMenu={onBack}
          />
        ) : null}
      </div>
      <OrigamiPageMark />
    </div>
  );
}
