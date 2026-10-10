import { useEffect, useState } from "react";
import type { InviteInfo, MatchMode } from "@dotwars/shared";
import { GameCanvas } from "./components/GameCanvas";
import { InviteChallenge } from "./components/InviteChallenge";
import { MainMenu } from "./components/MainMenu";
import { MatchEndOverlay } from "./components/MatchEndOverlay";
import { MatchHud } from "./components/MatchHud";
import { MatchmakingScreen } from "./components/MatchmakingScreen";
import { getApiUrl } from "./game/apiUrl";
import { useMatchRoom } from "./game/useMatchRoom";
import { bindBackButton, clearInviteFromUrl, pulseTap, readInviteCode } from "./telegram";
import { useWalletAuth } from "./wallet/WalletAuth";

interface ChallengeView {
  roomId: string;
  hostName: string;
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
    hostingInvite,
    inviteUrl,
    play,
    inviteFriend,
    joinInvite,
    leaveToMenu,
    sendTroops,
    restartMatch,
  } = useMatchRoom();
  const auth = useWalletAuth();
  const [challenge, setChallenge] = useState<ChallengeView | null>(null);
  const [inviteLookup, setInviteLookup] = useState(() => Boolean(readInviteCode()));

  useEffect(() => {
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
            setChallenge({ roomId: code, hostName: "", expired: true });
            return;
          }
          const data = (await response.json()) as InviteInfo;
          setChallenge({
            roomId: data.roomId,
            hostName: data.hostName,
            expired: false,
          });
        })
        .catch(() => {
          if (!cancelled) {
            setChallenge({ roomId: code, hostName: "", expired: true });
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
  }, []);

  const declineChallenge = () => {
    pulseTap();
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
          setChallenge({ roomId, hostName: "", expired: true });
          return;
        }
      } catch {
        setChallenge({ roomId, hostName: challenge.hostName, expired: true });
        return;
      }
      setChallenge(null);
      clearInviteFromUrl();
      void joinInvite(roomId, token);
    })();
  };

  const inMenu = !room && status !== "connecting" && !challenge && !inviteLookup;
  const pvpMatched =
    queuedMode === "pvp" &&
    Boolean(room) &&
    status === "live" &&
    !seekingOpponent &&
    (phase === "playing" || phase === "ended" || countdown > 0);
  const searching = queuedMode === "pvp" && status !== "error" && !pvpMatched;
  const inMatch = Boolean(room && !searching);

  useEffect(() => {
    if (challenge || inviteLookup) {
      bindBackButton(declineChallenge);
      return () => bindBackButton(null);
    }
    bindBackButton(inMenu ? null : leaveToMenu);
    return () => bindBackButton(null);
  }, [challenge, inviteLookup, inMenu, leaveToMenu]);

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
    void inviteFriend(auth.token);
  };

  const onBack = () => {
    pulseTap();
    leaveToMenu();
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
        canAccept={Boolean(auth.token && challenge && !challenge.expired)}
        onAccept={acceptChallenge}
        onDecline={declineChallenge}
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
    return <MatchmakingScreen onCancel={onBack} inviting={hostingInvite} inviteUrl={inviteUrl} />;
  }

  if (status === "connecting" && !room) {
    return (
      <div className="origami-screen items-center justify-center">
        <p className="origami-kicker relative z-10">Connecting</p>
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
          onBack={onBack}
        />

        {room && phase === "ended" ? (
          <MatchEndOverlay result={result} timedOut={timedOut} onRestart={restartMatch} onMenu={onBack} />
        ) : null}
      </div>
    </div>
  );
}
