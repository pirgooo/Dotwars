import { ROOM_NAME } from "@dotwars/shared";

interface AppProps {
  telegramReady: boolean;
}

export function App({ telegramReady }: AppProps) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-sky-400">Telegram Mini App</p>
      <h1 className="text-4xl font-semibold tracking-tight">Dot Wars</h1>
      <p className="max-w-sm text-sm text-slate-400">
        PvP RTS. Захватывай базы, перекидывай войска, удерживай карту.
      </p>
      <div className="mt-2 rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300">
        Telegram: {telegramReady ? "SDK готов" : "браузер / SDK не инициализирован"}
      </div>
      <p className="text-xs text-slate-500">Colyseus room: {ROOM_NAME}</p>
    </main>
  );
}
