import { pulseTap } from "../telegram";
import { useWalletAuth } from "./WalletAuth";

export function WalletBar({ onEditName }: { onEditName?: () => void }) {
  const { player, login, logout } = useWalletAuth();

  return (
    <div className="flex max-w-[58vw] items-center justify-end gap-2">
      {player ? (
        <>
          <ConnectGramButton onEditName={onEditName} />
          <button
            type="button"
            aria-label="Sign out"
            onClick={() => {
              pulseTap();
              logout();
            }}
            className="shrink-0 rounded-full border border-white/40 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/80"
          >
            Out
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            pulseTap();
            void login();
          }}
          className="shrink-0 rounded-full border border-white/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white"
        >
          Log in
        </button>
      )}
    </div>
  );
}

export function ConnectGramButton({ onEditName }: { onEditName?: () => void }) {
  const { player } = useWalletAuth();

  if (!player) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!onEditName) {
          return;
        }
        pulseTap();
        onEditName();
      }}
      className="max-w-[42vw] truncate rounded-full border border-white/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white"
    >
      {player.name}
    </button>
  );
}
