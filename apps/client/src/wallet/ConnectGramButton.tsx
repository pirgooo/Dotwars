import { pulseTap } from "../telegram";
import { useWalletAuth } from "./WalletAuth";

export function ConnectGramButton() {
  const { player, login, logout } = useWalletAuth();

  const onClick = () => {
    pulseTap();
    if (player) {
      logout();
      return;
    }
    void login();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="max-w-[46vw] truncate rounded-full border border-white/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white"
    >
      {player ? player.name : "Connect wallet"}
    </button>
  );
}
