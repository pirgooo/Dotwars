import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { initTelegram } from "./telegram";

const telegramReady = initTelegram();

createRoot(document.getElementById("root")!).render(<App telegramReady={telegramReady} />);
