import type { HudBase } from "../game/hudTypes";

export const FIRST_SEND_HINT_KEY = "dotwars.hint.drag";

export function firstSendHintPending(): boolean {
  return localStorage.getItem(FIRST_SEND_HINT_KEY) !== "1";
}

export function completeFirstSendHint(): void {
  localStorage.setItem(FIRST_SEND_HINT_KEY, "1");
}

function dist2(a: HudBase, b: HudBase): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function pickHintBases(bases: HudBase[]): { from: HudBase; to: HudBase } | null {
  const sources = bases.filter((base) => base.mine && base.garrison > 0);
  if (sources.length === 0) {
    return null;
  }
  const from = sources.reduce((best, base) => {
    if (base.radius !== best.radius) {
      return base.radius > best.radius ? base : best;
    }
    return base.garrison > best.garrison ? base : best;
  });
  const others = bases.filter((base) => base.id !== from.id);
  if (others.length === 0) {
    return null;
  }
  const foes = others.filter((base) => !base.mine);
  const pool = foes.length > 0 ? foes : others;
  const to = pool.reduce((best, base) => (dist2(from, base) < dist2(from, best) ? base : best));
  return { from, to };
}

interface FirstSendHintProps {
  bases: HudBase[];
}

export function FirstSendHint({ bases }: FirstSendHintProps) {
  const pair = pickHintBases(bases);
  if (!pair) {
    return null;
  }

  const { from, to } = pair;
  const ring = Math.max(28, from.radius * 2.4);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <marker id="hint-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0 0 8 4 0 8" fill="none" stroke="#ffffff" strokeWidth="1.4" />
          </marker>
        </defs>
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeDasharray="7 9"
          strokeLinecap="round"
          markerEnd="url(#hint-arrow)"
          className="origin-center opacity-90"
          style={{ animation: "hint-dash 1.1s linear infinite" }}
        />
        <circle cx={from.x} cy={from.y} r={ring} fill="none" stroke="#ffffff" strokeWidth="1.5" className="hint-ring" />
        <circle cx={to.x} cy={to.y} r={Math.max(16, to.radius * 1.6)} fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.55" />
      </svg>
      <p className="origami-pill absolute bottom-12 left-1/2 z-20 -translate-x-1/2 px-5 py-2.5 text-[15px] whitespace-nowrap">
        Drag to a neighbor
      </p>
    </div>
  );
}
