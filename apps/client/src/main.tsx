import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { initTelegram } from "./telegram";

const telegramReady = initTelegram();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App telegramReady={telegramReady} />
  </StrictMode>,
);
