import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { initTelegram } from "./telegram";
import { WalletAuthProvider } from "./wallet/WalletAuth";

const telegramReady = initTelegram();

createRoot(document.getElementById("root")!).render(
  <WalletAuthProvider>
    <App telegramReady={telegramReady} />
  </WalletAuthProvider>,
);
