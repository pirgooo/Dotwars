import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { initTelegram } from "./telegram";
import { WalletAuthProvider } from "./wallet/WalletAuth";

const telegramReady = initTelegram();
const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;

createRoot(document.getElementById("root")!).render(
  <TonConnectUIProvider
    manifestUrl={manifestUrl}
    actionsConfiguration={{ twaReturnUrl: "https://t.me/dotwars_bot/Dotwars" }}
  >
    <WalletAuthProvider>
      <App telegramReady={telegramReady} />
    </WalletAuthProvider>
  </TonConnectUIProvider>,
);
