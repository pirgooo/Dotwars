import { pulseTap } from "../telegram";
import { useWalletAuth } from "./WalletAuth";

export function WalletBar({ onEditName }: { onEditName?: () => void }) {
  const { player, logout } = useWalletAuth();

  return (
    <div className="flex max-w-[58vw] items-center justify-end gap-2">
      {!player ? <DevStubButton /> : null}
      <ConnectGramButton onEditName={onEditName} />
      {player ? (
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
      ) : null}
    </div>
  );
}

function DevStubButton() {
  const { loginStub } = useWalletAuth();

  return (
    <button
      type="button"
      onClick={() => {
        pulseTap();
        void loginStub();
      }}
      className="shrink-0 rounded-full border border-white/40 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/80"
    >
      DEV
    </button>
  );
}

export function ConnectGramButton({ onEditName }: { onEditName?: () => void }) {
  const { player, loginWallet } = useWalletAuth();

  const onClick = () => {
    if (player) {
      if (!onEditName) {
        return;
      }
      pulseTap();
      onEditName();
      return;
    }
    pulseTap();
    void loginWallet();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="max-w-[42vw] truncate rounded-full border border-white/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white"
    >
      {player ? player.name : "Connect wallet"}
    </button>
  );
}
