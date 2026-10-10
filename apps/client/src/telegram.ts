import {
  init,
  miniApp,
  requestContentSafeAreaInsets,
  requestSafeAreaInsets,
  swipeBehavior,
  viewport,
} from "@telegram-apps/sdk";

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

interface TelegramBackButton {
  show: () => void;
  hide: () => void;
  onClick: (fn: () => void) => void;
  offClick: (fn: () => void) => void;
}

interface TelegramWebApp {
  HapticFeedback?: TelegramHaptic;
  themeParams?: TelegramThemeParams;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  BackButton?: TelegramBackButton;
  openTelegramLink?: (url: string) => void;
  expand?: () => void;
  disableVerticalSwipes?: () => void;
  requestFullscreen?: () => void;
}

interface TelegramHaptic {
  impactOccurred?: (style: string) => void;
  notificationOccurred?: (type: string) => void;
}

function webApp(): TelegramWebApp | undefined {
  return (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
}

function haptic(): TelegramHaptic | undefined {
  return webApp()?.HapticFeedback;
}

function applyTheme() {
  const theme = webApp()?.themeParams ?? {};
  const root = document.documentElement;
  const set = (name: string, value: string | undefined, fallback: string) => {
    root.style.setProperty(name, value || fallback);
  };
  set("--tg-theme-bg-color", theme.bg_color, "#ffffff");
  set("--tg-theme-text-color", theme.text_color, "#000000");
  set("--tg-theme-hint-color", theme.hint_color, "#8e8e93");
  set("--tg-theme-link-color", theme.link_color, "#2481cc");
  set("--tg-theme-button-color", theme.button_color, "#3390ec");
  set("--tg-theme-button-text-color", theme.button_text_color, "#ffffff");
  set("--tg-theme-secondary-bg-color", theme.secondary_bg_color, "#efeff4");
  set("--tg-theme-header-bg-color", theme.header_bg_color ?? theme.secondary_bg_color, "#efeff4");
  set("--tg-theme-section-bg-color", theme.section_bg_color, "#ffffff");
  set("--tg-theme-section-header-text-color", theme.section_header_text_color, "#8e8e93");
  set("--tg-theme-subtitle-text-color", theme.subtitle_text_color, "#8e8e93");
  set("--tg-theme-destructive-text-color", theme.destructive_text_color, "#ff3b30");
  const board = "#3b4cff";
  document.body.style.background = board;
  webApp()?.setHeaderColor?.(board);
  webApp()?.setBackgroundColor?.(board);
}

let backHandler: (() => void) | null = null;

export function initTelegram(): boolean {
  try {
    init();

    if (miniApp.mountSync.isAvailable()) {
      miniApp.mountSync();
    } else if (miniApp.mount.isAvailable()) {
      void miniApp.mount();
    }

    if (miniApp.ready.isAvailable()) {
      miniApp.ready();
    }

    if (viewport.mount.isAvailable()) {
      void viewport.mount().then(async () => {
        if (viewport.bindCssVars.isAvailable()) {
          viewport.bindCssVars();
        }
        await lockTelegramChrome();
        if (requestSafeAreaInsets.isAvailable()) {
          await requestSafeAreaInsets();
        }
        if (requestContentSafeAreaInsets.isAvailable()) {
          await requestContentSafeAreaInsets();
        }
      });
    } else {
      void lockTelegramChrome();
    }

    applyTheme();
    return true;
  } catch {
    applyTheme();
    return false;
  }
}

async function lockTelegramChrome() {
  if (swipeBehavior.mount.isAvailable()) {
    swipeBehavior.mount();
  }
  if (swipeBehavior.disableVertical.isAvailable()) {
    swipeBehavior.disableVertical();
  }
  if (viewport.expand.isAvailable()) {
    viewport.expand();
  }
  if (viewport.requestFullscreen.isAvailable()) {
    await viewport.requestFullscreen();
  }
  const native = webApp();
  native?.expand?.();
  native?.disableVerticalSwipes?.();
  native?.requestFullscreen?.();
}

export function pulseTap() {
  try {
    haptic()?.impactOccurred?.("light");
  } catch {
    // Desktop browser has no Telegram haptic bridge.
  }
}

export function pulseCapture(took: boolean) {
  try {
    const feedback = haptic();
    if (took) {
      feedback?.impactOccurred?.("medium");
    } else {
      feedback?.notificationOccurred?.("warning");
    }
  } catch {
    // Desktop browser has no Telegram haptic bridge.
  }
}

export function readInviteCode(): string | null {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("invite") ?? params.get("startapp") ?? params.get("tgWebAppStartParam");
  if (fromQuery) {
    return fromQuery;
  }
  const start = (
    window as Window & {
      Telegram?: { WebApp?: { initDataUnsafe?: { start_param?: string } } };
    }
  ).Telegram?.WebApp?.initDataUnsafe?.start_param;
  return start || null;
}

export function clearInviteFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("invite") && !url.searchParams.has("startapp")) {
    return;
  }
  url.searchParams.delete("invite");
  url.searchParams.delete("startapp");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function buildInviteUrl(roomId: string): string {
  const app = import.meta.env.VITE_TELEGRAM_APP_URL as string | undefined;
  if (app) {
    const base = app.replace(/\/$/, "");
    return `${base}?startapp=${encodeURIComponent(roomId)}`;
  }
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("invite", roomId);
  return url.toString();
}

export function shareInviteLink(url: string) {
  const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Dot Wars — 1v1 PvP")}`;
  const open = webApp()?.openTelegramLink;
  if (open) {
    open(share);
    return;
  }
  window.open(share, "_blank", "noopener,noreferrer");
}

export function bindBackButton(handler: (() => void) | null) {
  const button = webApp()?.BackButton;
  if (backHandler && button) {
    button.offClick(backHandler);
    backHandler = null;
  }
  if (!button) {
    return;
  }
  if (!handler) {
    button.hide();
    return;
  }
  backHandler = handler;
  button.onClick(handler);
  button.show();
}
