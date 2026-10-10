import type { ReactNode } from "react";

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
    <div className="relative z-10 mt-auto space-y-3 pb-[max(8px,env(safe-area-inset-bottom))]">
      <div className="h-5 text-center text-[12px] tracking-wide text-white/75">{stats}</div>
      <div className="mx-auto grid w-full max-w-80 grid-rows-3 gap-3 [&>*]:flex [&>*]:h-14 [&>*]:items-center [&>*]:justify-center [&>*]:py-0">
        {children}
      </div>
      {error}
      <p className="pt-1 text-[11px] tracking-[0.2em] text-white/55">10 / 26</p>
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
