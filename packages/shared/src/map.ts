import { NEUTRAL_OWNER_ID } from "./rules";

export interface MapBase {
  id: string;
  x: number;
  y: number;
  garrison: number;
  ownerId: string;
}

type Slot = "blue" | "red" | "neutral";

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  garrison: number;
  slot: Slot;
}

const LAYOUTS: LayoutNode[][] = [
  [
    node("p-home", 0.14, 0.84, 22, "blue"),
    node("p-front", 0.3, 0.68, 10, "blue"),
    node("e-home", 0.86, 0.16, 22, "red"),
    node("e-front", 0.7, 0.32, 10, "red"),
    node("n-left", 0.14, 0.5, 6, "neutral"),
    node("n-right", 0.86, 0.5, 6, "neutral"),
    node("n-bottom", 0.5, 0.86, 6, "neutral"),
    node("n-top", 0.5, 0.14, 6, "neutral"),
    node("n-mid-sw", 0.38, 0.58, 10, "neutral"),
    node("n-mid-ne", 0.62, 0.42, 10, "neutral"),
    node("n-center", 0.5, 0.5, 18, "neutral"),
  ],
  [
    node("p-home", 0.16, 0.84, 22, "blue"),
    node("p-front", 0.34, 0.66, 12, "blue"),
    node("e-home", 0.84, 0.16, 22, "red"),
    node("e-front", 0.66, 0.34, 12, "red"),
    node("n-south", 0.5, 0.78, 8, "neutral"),
    node("n-north", 0.5, 0.22, 8, "neutral"),
    node("n-west", 0.22, 0.5, 8, "neutral"),
    node("n-east", 0.78, 0.5, 8, "neutral"),
    node("n-center", 0.5, 0.5, 20, "neutral"),
  ],
  [
    node("p-home", 0.18, 0.82, 20, "blue"),
    node("e-home", 0.82, 0.18, 20, "red"),
    node("n-s", 0.5, 0.82, 7, "neutral"),
    node("n-n", 0.5, 0.18, 7, "neutral"),
    node("n-w", 0.18, 0.5, 7, "neutral"),
    node("n-e", 0.82, 0.5, 7, "neutral"),
    node("n-sw", 0.32, 0.68, 10, "neutral"),
    node("n-ne", 0.68, 0.32, 10, "neutral"),
    node("n-se", 0.68, 0.68, 10, "neutral"),
    node("n-nw", 0.32, 0.32, 10, "neutral"),
    node("n-center", 0.5, 0.5, 16, "neutral"),
  ],
  [
    node("p-a", 0.2, 0.86, 18, "blue"),
    node("p-b", 0.2, 0.64, 14, "blue"),
    node("e-a", 0.8, 0.14, 18, "red"),
    node("e-b", 0.8, 0.36, 14, "red"),
    node("n-low", 0.5, 0.74, 8, "neutral"),
    node("n-high", 0.5, 0.26, 8, "neutral"),
    node("n-mid-w", 0.38, 0.5, 10, "neutral"),
    node("n-mid-e", 0.62, 0.5, 10, "neutral"),
    node("n-center", 0.5, 0.5, 14, "neutral"),
  ],
  [
    node("p-home", 0.14, 0.86, 24, "blue"),
    node("e-home", 0.86, 0.14, 24, "red"),
    node("n-0", 0.5, 0.18, 8, "neutral"),
    node("n-1", 0.72, 0.28, 8, "neutral"),
    node("n-2", 0.82, 0.5, 8, "neutral"),
    node("n-3", 0.72, 0.72, 8, "neutral"),
    node("n-4", 0.5, 0.82, 8, "neutral"),
    node("n-5", 0.28, 0.72, 8, "neutral"),
    node("n-6", 0.18, 0.5, 8, "neutral"),
    node("n-7", 0.28, 0.28, 8, "neutral"),
    node("n-center", 0.5, 0.5, 22, "neutral"),
  ],
  [
    node("p-home", 0.22, 0.86, 20, "blue"),
    node("p-front", 0.4, 0.74, 10, "blue"),
    node("e-home", 0.78, 0.14, 20, "red"),
    node("e-front", 0.6, 0.26, 10, "red"),
    node("n-bl", 0.16, 0.58, 7, "neutral"),
    node("n-br", 0.42, 0.58, 7, "neutral"),
    node("n-tl", 0.58, 0.42, 7, "neutral"),
    node("n-tr", 0.84, 0.42, 7, "neutral"),
    node("n-west", 0.16, 0.34, 9, "neutral"),
    node("n-east", 0.84, 0.66, 9, "neutral"),
    node("n-center", 0.5, 0.5, 16, "neutral"),
  ],
  [
    node("p-home", 0.12, 0.88, 22, "blue"),
    node("e-home", 0.88, 0.12, 22, "red"),
    node("g-0", 0.36, 0.36, 8, "neutral"),
    node("g-1", 0.5, 0.36, 8, "neutral"),
    node("g-2", 0.64, 0.36, 8, "neutral"),
    node("g-3", 0.36, 0.5, 8, "neutral"),
    node("g-4", 0.5, 0.5, 18, "neutral"),
    node("g-5", 0.64, 0.5, 8, "neutral"),
    node("g-6", 0.36, 0.64, 8, "neutral"),
    node("g-7", 0.5, 0.64, 8, "neutral"),
    node("g-8", 0.64, 0.64, 8, "neutral"),
  ],
  [
    node("p-a", 0.18, 0.78, 16, "blue"),
    node("p-b", 0.36, 0.88, 16, "blue"),
    node("e-a", 0.82, 0.22, 16, "red"),
    node("e-b", 0.64, 0.12, 16, "red"),
    node("n-sw", 0.28, 0.62, 8, "neutral"),
    node("n-ne", 0.72, 0.38, 8, "neutral"),
    node("n-se", 0.72, 0.72, 10, "neutral"),
    node("n-nw", 0.28, 0.28, 10, "neutral"),
    node("n-mid", 0.5, 0.5, 14, "neutral"),
    node("n-south", 0.5, 0.84, 6, "neutral"),
    node("n-north", 0.5, 0.16, 6, "neutral"),
  ],
  [
    node("p-home", 0.2, 0.8, 24, "blue"),
    node("e-home", 0.8, 0.2, 24, "red"),
    node("n-a", 0.2, 0.55, 6, "neutral"),
    node("n-b", 0.38, 0.7, 6, "neutral"),
    node("n-c", 0.8, 0.45, 6, "neutral"),
    node("n-d", 0.62, 0.3, 6, "neutral"),
    node("n-e", 0.38, 0.42, 12, "neutral"),
    node("n-f", 0.62, 0.58, 12, "neutral"),
    node("n-g", 0.5, 0.5, 20, "neutral"),
    node("n-h", 0.2, 0.28, 8, "neutral"),
    node("n-i", 0.8, 0.72, 8, "neutral"),
  ],
  [
    node("p-home", 0.15, 0.75, 18, "blue"),
    node("p-side", 0.32, 0.88, 12, "blue"),
    node("e-home", 0.85, 0.25, 18, "red"),
    node("e-side", 0.68, 0.12, 12, "red"),
    node("n-1", 0.15, 0.48, 7, "neutral"),
    node("n-2", 0.85, 0.52, 7, "neutral"),
    node("n-3", 0.42, 0.62, 11, "neutral"),
    node("n-4", 0.58, 0.38, 11, "neutral"),
    node("n-5", 0.42, 0.32, 9, "neutral"),
    node("n-6", 0.58, 0.68, 9, "neutral"),
    node("n-7", 0.5, 0.5, 15, "neutral"),
  ],
];

export const MAP_LAYOUT_COUNT = LAYOUTS.length;

export function pickMapIndex(previous = -1): number {
  if (LAYOUTS.length <= 1) {
    return 0;
  }
  let index = Math.floor(Math.random() * LAYOUTS.length);
  if (index === previous) {
    index = (index + 1) % LAYOUTS.length;
  }
  return index;
}

export function createStarterMap(
  bluePlayerId: string,
  redPlayerId: string,
  layoutIndex = 0,
): MapBase[] {
  const layout = LAYOUTS[((layoutIndex % LAYOUTS.length) + LAYOUTS.length) % LAYOUTS.length];
  return layout.map((item) => ({
    id: item.id,
    x: item.x,
    y: item.y,
    garrison: item.garrison,
    ownerId: item.slot === "blue" ? bluePlayerId : item.slot === "red" ? redPlayerId : NEUTRAL_OWNER_ID,
  }));
}

function node(id: string, x: number, y: number, garrison: number, slot: Slot): LayoutNode {
  return { id, x, y, garrison, slot };
}
