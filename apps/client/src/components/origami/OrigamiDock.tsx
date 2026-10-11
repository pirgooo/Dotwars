import type { ReactNode } from "react";

/** 10/26 + version, pinned to the origami-screen, not the dock. */
export function OrigamiPageMark() {
  return (
    <div className="pointer-events-none absolute inset-x-6 bottom-[var(--app-footer)] z-10 flex items-end justify-between">
      <p className="text-[11px] tracking-[0.2em] text-white/55">10 / 26</p>
      <p className="text-[10px] tracking-[0.18em] text-white/40">v{__APP_VERSION__}</p>
    </div>
  );
}

export function OrigamiShell({ children }: { children: ReactNode }) {
  return (
    <div className="origami-screen px-6 pt-[var(--app-header)]">
      {children}
      <OrigamiPageMark />
    </div>
  );
}

/** Three menu pills, same width/gaps as the main menu. Slot 2 is Find a match. */
export function OrigamiDock({
  stats,
  error,
  children,
}: {
  stats: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative z-10 mt-auto shrink-0 pb-[calc(var(--app-footer)+1.75rem)]">
      <div className="space-y-3">
        <div className="h-5 overflow-hidden text-center text-[12px] tracking-wide text-white/75">
          {error ?? stats}
        </div>
        <div className="mx-auto grid h-48 w-full max-w-80 grid-rows-[repeat(3,3.5rem)] gap-3 [&>*]:flex [&>*]:h-14 [&>*]:min-h-0 [&>*]:items-center [&>*]:justify-center [&>*]:overflow-hidden [&>*]:py-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export function OrigamiDockSlot({ children }: { children?: ReactNode }) {
  return (
    <div className="origami-pill invisible w-full" aria-hidden="true">
      {children ?? "slot"}
    </div>
  );
}
