import { GameCanvas } from "./components/GameCanvas";
import { MatchEndOverlay } from "./components/MatchEndOverlay";
import { MatchHud } from "./components/MatchHud";
import { useMatchRoom } from "./game/useMatchRoom";

interface AppProps {
  telegramReady: boolean;
}

export function App({ telegramReady }: AppProps) {
  const {
    status,
    error,
    room,
    phase,
    winnerId,
    versusBot,
    timedOut,
    timeLeft,
    countdown,
    myBases,
    enemyBases,
    sendTroops,
    restartMatch,
  } = useMatchRoom();

  const result =
    winnerId === ""
      ? "draw"
      : room && winnerId === room.sessionId
        ? "win"
        : "lose";

  return (
    <div className="relative h-full overflow-hidden">
      {room ? <GameCanvas room={room} playing={phase === "playing"} sendTroops={sendTroops} /> : null}

      <MatchHud
        status={status}
        error={error}
        phase={phase}
        versusBot={versusBot}
        telegramReady={telegramReady}
        timeLeft={timeLeft}
        countdown={countdown}
        myBases={myBases}
        enemyBases={enemyBases}
      />

      {room && phase === "ended" ? (
        <MatchEndOverlay result={result} timedOut={timedOut} onRestart={restartMatch} />
      ) : null}
    </div>
  );
}
