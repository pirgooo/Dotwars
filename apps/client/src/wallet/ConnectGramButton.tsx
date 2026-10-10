import { pulseTap } from "../telegram";
import { useWalletAuth } from "./WalletAuth";

export function WalletBar() {
  const { player } = useWalletAuth();

  return (
    <div className="flex max-w-[58vw] items-center justify-end gap-2">
      {!player ? <DevStubButton /> : null}
      <ConnectGramButton />
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

export function ConnectGramButton() {
  const { player, loginWallet, logout } = useWalletAuth();

  const onClick = () => {
    pulseTap();
    if (player) {
      logout();
      return;
    }
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
