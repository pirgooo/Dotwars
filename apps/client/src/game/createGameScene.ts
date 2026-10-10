import type { GameState } from "@dotwars/shared";
import {
  NEUTRAL_OWNER_ID,
  pointInPolygon,
  roundPolygonCorners,
  unpackPolygon,
  type Vec2,
} from "@dotwars/shared";
import { Application, Container, Graphics, Text } from "pixi.js";
import { pulseCapture } from "../telegram";
import type { HudBase } from "./hudTypes";

type VisualOwner = "player" | "enemy" | "neutral";
type FactionKind = "player" | "rivalA" | "rivalB" | "neutral";

interface Paint {
  kind: FactionKind;
  fill: number | null;
  fillAlpha: number;
  stroke: number;
  crease: number;
  creaseAlpha: number;
  markerFill: number | null;
  markerStroke: number;
  troopFill: number;
  troopStroke: number;
  label: number;
}

interface BaseNode {
  id: string;
  land: Graphics;
  marker: Container;
  glyph: Graphics;
  label: Text;
  poly: Vec2[];
  active: boolean;
  ownerId: string;
  garrison: number;
  drawnOwner?: string;
  flashUntil: number;
  pop: number;
}

interface MatchBridge {
  sessionId: string;
  getState(): GameState;
  onHud: (bases: HudBase[]) => void;
}

const KLEIN = 0x3b4cff;
const KLEIN_DEEP = 0x2f3ee0;
const ENEMY_DEEP = 0x1a2394;
const ENEMY_INK = 0x14162e;
const WHITE = 0xffffff;
const PLAYER_FILL = 0xe8ebff;

const PLAYER_PAINT: Paint = {
  kind: "player",
  fill: PLAYER_FILL,
  fillAlpha: 1,
  stroke: KLEIN,
  crease: KLEIN,
  creaseAlpha: 0.4,
  markerFill: KLEIN,
  markerStroke: WHITE,
  troopFill: WHITE,
  troopStroke: KLEIN_DEEP,
  label: WHITE,
};

const RIVAL_A_PAINT: Paint = {
  kind: "rivalA",
  fill: ENEMY_DEEP,
  fillAlpha: 1,
  stroke: WHITE,
  crease: WHITE,
  creaseAlpha: 0.28,
  markerFill: WHITE,
  markerStroke: KLEIN,
  troopFill: WHITE,
  troopStroke: WHITE,
  label: KLEIN,
};

const RIVAL_B_PAINT: Paint = {
  kind: "rivalB",
  fill: ENEMY_INK,
  fillAlpha: 1,
  stroke: WHITE,
  crease: WHITE,
  creaseAlpha: 0.22,
  markerFill: WHITE,
  markerStroke: WHITE,
  troopFill: WHITE,
  troopStroke: WHITE,
  label: KLEIN,
};

const NEUTRAL_PAINT: Paint = {
  kind: "neutral",
  fill: null,
  fillAlpha: 0,
  stroke: WHITE,
  crease: WHITE,
  creaseAlpha: 0.12,
  markerFill: null,
  markerStroke: WHITE,
  troopFill: WHITE,
  troopStroke: WHITE,
  label: WHITE,
};

const FACTION: Record<string, Paint> = {
  "#3b82f6": RIVAL_A_PAINT,
  "#ef4444": RIVAL_A_PAINT,
  "#22c55e": RIVAL_B_PAINT,
};

export function createGameScene(host: HTMLElement, match: MatchBridge) {
  const app = new Application();
  const bases = new Map<string, BaseNode>();
  const troops = new Map<string, Graphics>();
  let destroyed = false;
  let lastHudKey = "";

  const landLayer = new Container();
  const playerLandLayer = new Container();
  const markerLayer = new Container();
  const troopLayer = new Container();

  const ready = app
    .init({
      background: KLEIN,
      antialias: true,
      autoDensity: true,
      preference: "webgl",
      preserveDrawingBuffer: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      resizeTo: host,
    })
    .then(() => {
      if (destroyed) {
        app.destroy(true, { children: true });
        return;
      }

      app.canvas.style.touchAction = "none";
      app.canvas.style.display = "block";
      host.appendChild(app.canvas);

      app.stage.eventMode = "none";
      app.stage.addChild(landLayer, playerLandLayer, markerLayer, troopLayer);
      app.ticker.add(syncFromServer);
    })
    .catch((error: unknown) => {
      console.error("PixiJS failed to start", error);
    });

  function screenSize() {
    return { width: app.screen.width, height: app.screen.height };
  }

  function toScreen(x: number, y: number) {
    const { width, height } = screenSize();
    return { x: x * width, y: y * height };
  }

  function toWorld(x: number, y: number) {
    const { width, height } = screenSize();
    return { x: width === 0 ? 0 : x / width, y: height === 0 ? 0 : y / height };
  }

  function visualOwner(ownerId: string): VisualOwner {
    if (!ownerId || ownerId === NEUTRAL_OWNER_ID) {
      return "neutral";
    }
    return ownerId === match.sessionId ? "player" : "enemy";
  }

  function paintFor(ownerId: string): Paint {
    if (!ownerId || ownerId === NEUTRAL_OWNER_ID) {
      return NEUTRAL_PAINT;
    }
    if (ownerId === match.sessionId) {
      return PLAYER_PAINT;
    }
    const color = match.getState()?.players?.get?.(ownerId)?.color ?? "";
    return FACTION[color] ?? RIVAL_A_PAINT;
  }

  function drawRegular(g: Graphics, sides: number, radius: number, rotation = -Math.PI / 2) {
    const pts: number[] = [];
    for (let i = 0; i < sides; i += 1) {
      const a = rotation + (i * Math.PI * 2) / sides;
      pts.push(Math.cos(a) * radius, Math.sin(a) * radius);
    }
    g.poly(pts);
  }

  function drawCreases(g: Graphics, flat: number[], color: number, alpha: number) {
    const n = flat.length / 2;
    if (n < 3 || alpha <= 0) {
      return;
    }
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < flat.length; i += 2) {
      cx += flat[i];
      cy += flat[i + 1];
    }
    cx /= n;
    cy /= n;
    for (let i = 0; i < flat.length; i += 2) {
      g.moveTo(cx, cy);
      g.lineTo(flat[i], flat[i + 1]);
    }
    g.stroke({ width: 1.05, color, alpha, join: "round", cap: "round" });
  }

  function drawGlyph(g: Graphics, radius: number, paint: Paint, owned: boolean) {
    g.clear();
    const r = radius;
    if (!owned) {
      g.circle(0, 0, r * 0.72);
      g.fill({ color: KLEIN });
      g.stroke({ width: 1.5, color: WHITE });
      return;
    }

    drawRegular(g, 6, r * 0.78);
    const fill = paint.markerFill ?? WHITE;
    g.fill({ color: fill });
  }

  function drawTroop(g: Graphics, paint: Paint, size: number) {
    g.clear();
    g.circle(0, 0, size);
    g.fill({ color: paint.troopFill });
    g.stroke({ width: 1.1, color: paint.troopStroke });
  }

  function ensureBase(id: string): BaseNode {
    const existing = bases.get(id);
    if (existing) {
      return existing;
    }

    const land = new Graphics();
    const marker = new Container();
    const glyph = new Graphics();
    const label = new Text({
      text: "0",
      style: {
        fill: WHITE,
        fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif",
        fontSize: 13,
        fontWeight: "600",
      },
    });
    label.anchor.set(0.5);
    label.eventMode = "none";
    marker.eventMode = "none";
    land.eventMode = "none";
    marker.addChild(glyph, label);
    landLayer.addChild(land);
    markerLayer.addChild(marker);

    const node: BaseNode = {
      id,
      land,
      marker,
      glyph,
      label,
      poly: [],
      active: true,
      ownerId: "",
      garrison: 0,
      flashUntil: 0,
      pop: 1,
    };
    bases.set(id, node);
    return node;
  }

  function publishHud(items: HudBase[]) {
    const key = items
      .map(
        (base) =>
          `${base.id}:${Math.round(base.x)}:${Math.round(base.y)}:${Math.round(base.radius)}:${Math.round(base.towerWidth)}:${base.garrison}:${base.mine ? 1 : 0}`,
      )
      .join("|");
    if (key === lastHudKey) {
      return;
    }
    lastHudKey = key;
    match.onHud(items);
  }

  function syncFromServer() {
    const state = match.getState();
    const { width, height } = screenSize();
    if (width < 2 || height < 2 || typeof state?.bases?.forEach !== "function") {
      return;
    }

    const seenBases = new Set<string>();
    const seenTroops = new Set<string>();
    const hud: HudBase[] = [];

    const now = performance.now();
    const playing = state.phase === "playing";
    const threatened = new Map<string, string>();
    if (playing) {
      state.troops?.forEach((troop) => {
        if (troop.toBaseId && troop.ownerId && troop.ownerId !== match.sessionId) {
          if (!threatened.has(troop.toBaseId)) {
            threatened.set(troop.toBaseId, troop.ownerId);
          }
        }
      });
    }

    state.bases.forEach((base) => {
      seenBases.add(base.id);
      const node = ensureBase(base.id);
      node.poly = unpackPolygon(base.polygon);
      node.active = base.active !== false;
      node.ownerId = base.ownerId;
      node.garrison = base.garrison;
      const owner = visualOwner(base.ownerId);
      const palette = paintFor(base.ownerId);
      const owned = node.active && owner !== "neutral";
      const fog = !node.active;
      const prevOwner = node.drawnOwner;
      if (playing && prevOwner !== undefined && prevOwner !== base.ownerId) {
        node.flashUntil = now + 420;
        node.pop = 1.28;
        if (owner === "player") {
          pulseCapture(true);
        } else if (prevOwner === match.sessionId) {
          pulseCapture(false);
        }
      }
      node.drawnOwner = base.ownerId;
      if (!playing) {
        node.flashUntil = 0;
        node.pop = 1;
      }
      const flashT = Math.max(0, (node.flashUntil - now) / 420);
      node.pop = 1 + (node.pop - 1) * 0.84;

      const flat: number[] = [];
      let minX = Number.POSITIVE_INFINITY;
      let maxX = 0;
      let minY = Number.POSITIVE_INFINITY;
      let maxY = 0;
      for (const point of node.poly) {
        const sx = point.x * width;
        const sy = point.y * height;
        flat.push(sx, sy);
        minX = Math.min(minX, sx);
        maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
      }

      const rounded = roundPolygonCorners(node.poly);
      const roundedFlat: number[] = [];
      for (const point of rounded) {
        roundedFlat.push(point.x * width, point.y * height);
      }
      const creaseFlat: number[] = [];
      for (const point of node.poly) {
        creaseFlat.push(point.x * width, point.y * height);
      }

      const landParent = owner === "player" ? playerLandLayer : landLayer;
      if (node.land.parent !== landParent) {
        landParent.addChild(node.land);
      }

      node.land.clear();
      const attackerId = threatened.get(base.id);
      const incoming = !fog && Boolean(attackerId);
      const warnWave = incoming ? 0.5 + 0.5 * Math.sin(now / 160) : 0;

      if (roundedFlat.length >= 6) {
        node.land.poly(roundedFlat);
        if (fog) {
          node.land.stroke({ width: 1, color: WHITE, alpha: 0.12, join: "round" });
        } else {
          if (palette.fill !== null) {
            node.land.fill({ color: palette.fill, alpha: palette.fillAlpha });
          }
          if (incoming) {
            node.land.poly(roundedFlat);
            node.land.fill({ color: WHITE, alpha: 0.08 + 0.12 * warnWave });
          }
          if (flashT > 0) {
            node.land.poly(roundedFlat);
            node.land.fill({ color: WHITE, alpha: 0.45 * flashT });
          }
          if (!owned) {
            drawCreases(node.land, creaseFlat, palette.crease, palette.creaseAlpha);
          }
          node.land.poly(roundedFlat);
          const playerEdge = palette.kind === "player";
          node.land.stroke({
            width: playerEdge ? 2 : incoming ? 2 + warnWave * 1.2 : 1.45 + flashT * 1.2,
            color: incoming && !playerEdge ? WHITE : palette.stroke,
            alpha: playerEdge ? 1 : incoming ? 0.7 + 0.25 * warnWave : palette.kind === "neutral" ? 0.55 : 0.92,
            join: "round",
            alignment: 1,
          });
        }
      }

      const screen = toScreen(base.x, base.y);
      const markerR = Math.max(12, Math.min(maxX - minX, maxY - minY) * 0.14);
      node.marker.position.set(screen.x, screen.y);
      node.marker.scale.set(node.pop);
      node.marker.visible = !fog;
      if (!fog) {
        drawGlyph(node.glyph, markerR, palette, owned);
        node.label.visible = true;
        node.label.style.fill =
          owned && (palette.kind === "rivalA" || palette.kind === "rivalB") ? KLEIN : WHITE;
        node.label.style.fontSize = Math.max(11, Math.round(markerR * 0.48));
        node.label.position.set(0, 0);
        node.label.text = String(base.garrison);
      } else {
        node.glyph.clear();
        node.label.visible = false;
      }

      if (!fog) {
        hud.push({
          id: base.id,
          x: screen.x,
          y: screen.y,
          radius: markerR,
          towerWidth: markerR * 1.35,
          garrison: base.garrison,
          mine: owner === "player",
        });
      }
    });

    for (const [id, node] of bases) {
      if (!seenBases.has(id)) {
        node.land.destroy();
        node.marker.destroy({ children: true });
        bases.delete(id);
      }
    }

    state.troops?.forEach((troop) => {
      seenTroops.add(troop.id);
      let sprite = troops.get(troop.id);
      if (!sprite) {
        sprite = new Graphics();
        troopLayer.addChild(sprite);
        troops.set(troop.id, sprite);
      }
      const screen = toScreen(troop.x, troop.y);
      const paint = paintFor(troop.ownerId);
      drawTroop(sprite, paint, 5.5);
      sprite.position.set(screen.x, screen.y);
    });

    for (const [id, sprite] of troops) {
      if (!seenTroops.has(id)) {
        sprite.destroy();
        troops.delete(id);
      }
    }

    publishHud(hud);
  }

  function hitBase(x: number, y: number, sourceId: string) {
    const world = toWorld(x, y);
    for (const [id, node] of bases) {
      if (id === sourceId || !node.active) {
        continue;
      }
      if (node.poly.length >= 3 && pointInPolygon(world.x, world.y, node.poly)) {
        return id;
      }
    }
    return null;
  }

  function hitOwnedBase(x: number, y: number, ownerId: string) {
    const world = toWorld(x, y);
    const live = match.getState()?.bases;
    for (const [id, node] of bases) {
      const base = live?.get?.(id);
      const active = base ? base.active !== false : node.active;
      const ownedBy = base?.ownerId ?? node.ownerId;
      const garrison = base?.garrison ?? node.garrison;
      if (!active || ownedBy !== ownerId || garrison <= 0) {
        continue;
      }
      if (node.poly.length >= 3 && pointInPolygon(world.x, world.y, node.poly)) {
        return id;
      }
    }
    return null;
  }

  return {
    ready,
    hitBase,
    hitOwnedBase,
    destroy() {
      destroyed = true;
      void ready.finally(() => {
        app.destroy(true, { children: true });
      });
    },
  };
}
