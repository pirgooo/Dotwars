import { init, miniApp, viewport } from "@telegram-apps/sdk";

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
      void viewport.mount().then(() => {
        viewport.expand.ifAvailable();
      });
    }

    return true;
  } catch {
    return false;
  }
}
