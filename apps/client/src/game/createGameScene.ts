import type { GameState } from "@dotwars/shared";
import { BASE_RADIUS, NEUTRAL_OWNER_ID } from "@dotwars/shared";
import { Application, Container, Graphics, Text } from "pixi.js";
import type { HudBase } from "./hudTypes";

type VisualOwner = "player" | "enemy" | "neutral";

interface BaseNode {
  id: string;
  container: Container;
  body: Graphics;
  label: Text;
}

interface MatchBridge {
  sessionId: string;
  getState(): GameState;
  onHud: (bases: HudBase[]) => void;
}

const PLAYER_FILL = 0x2563eb;
const ENEMY_FILL = 0xdc2626;
const NEUTRAL_FILL = 0x64748b;
const PLAYER_TROOP = 0x60a5fa;
const ENEMY_TROOP = 0xf87171;

const PALETTE: Record<VisualOwner, { fill: number; stroke: number }> = {
  player: { fill: PLAYER_FILL, stroke: 0x93c5fd },
  enemy: { fill: ENEMY_FILL, stroke: 0xfca5a5 },
  neutral: { fill: NEUTRAL_FILL, stroke: 0xcbd5e1 },
};

export function createGameScene(host: HTMLElement, match: MatchBridge) {
  const app = new Application();
  const bases = new Map<string, BaseNode>();
  const troops = new Map<string, Graphics>();
  let destroyed = false;
  let lastHudKey = "";

  const world = new Container();
  const troopLayer = new Container();

  const ready = app
    .init({
      background: 0x070b14,
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
      app.stage.addChild(world, troopLayer);
      app.ticker.add(syncFromServer);
      app.renderer.on("resize", onResize);
    })
    .catch((error: unknown) => {
      console.error("PixiJS failed to start", error);
    });

  function screenSize() {
    return { width: app.renderer.width, height: app.renderer.height };
  }

  function toScreen(x: number, y: number) {
    const { width, height } = screenSize();
    return { x: x * width, y: y * height };
  }

  function visualOwner(ownerId: string): VisualOwner {
    if (!ownerId || ownerId === NEUTRAL_OWNER_ID) {
      return "neutral";
    }
    return ownerId === match.sessionId ? "player" : "enemy";
  }

  function onResize() {
    const { width, height } = screenSize();
    if (width < 2 || height < 2) {
      return;
    }
  }

  function ensureBase(id: string): BaseNode {
    const existing = bases.get(id);
    if (existing) {
      return existing;
    }

    const radius = BASE_RADIUS * screenSize().height;
    const container = new Container();
    const body = new Graphics();
    const label = new Text({
      text: "0",
      style: {
        fill: 0xffffff,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: Math.max(13, Math.round(radius * 0.52)),
        fontWeight: "700",
      },
    });
    label.anchor.set(0.5);
    label.eventMode = "none";
    container.eventMode = "none";
    container.addChild(body, label);
    world.addChild(container);

    const node = { id, container, body, label };
    bases.set(id, node);
    return node;
  }

  function publishHud(items: HudBase[]) {
    const key = items
      .map(
        (base) =>
          `${base.id}:${Math.round(base.x)}:${Math.round(base.y)}:${Math.round(base.radius)}:${base.garrison}:${base.mine ? 1 : 0}`,
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
    const { height } = screenSize();
    const radius = BASE_RADIUS * height;
    const seenBases = new Set<string>();
    const seenTroops = new Set<string>();
    const hud: HudBase[] = [];

    state.bases.forEach((base) => {
      seenBases.add(base.id);
      const node = ensureBase(base.id);
      const screen = toScreen(base.x, base.y);
      const owner = visualOwner(base.ownerId);
      const palette = PALETTE[owner];
      node.container.position.set(screen.x, screen.y);
      node.body.clear();
      node.body.circle(0, 0, radius);
      node.body.fill({ color: palette.fill });
      node.body.stroke({ width: 4, color: palette.stroke, alpha: 0.95 });
      node.label.visible = owner !== "player";
      node.label.style.fontSize = Math.max(14, Math.round(radius * 0.42));
      node.label.position.set(0, 0);
      node.label.text = String(base.garrison);
      hud.push({
        id: base.id,
        x: screen.x,
        y: screen.y,
        radius,
        garrison: base.garrison,
        mine: owner === "player",
      });
    });

    for (const [id, node] of bases) {
      if (!seenBases.has(id)) {
        node.container.destroy({ children: true });
        bases.delete(id);
      }
    }

    state.troops.forEach((troop) => {
      seenTroops.add(troop.id);
      let sprite = troops.get(troop.id);
      if (!sprite) {
        sprite = new Graphics();
        troopLayer.addChild(sprite);
        troops.set(troop.id, sprite);
      }
      const screen = toScreen(troop.x, troop.y);
      const color = troop.ownerId === match.sessionId ? PLAYER_TROOP : ENEMY_TROOP;
      sprite.clear();
      sprite.circle(0, 0, 5);
      sprite.fill({ color });
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
    const { height } = screenSize();
    const radius = BASE_RADIUS * height + 12;
    for (const [id, node] of bases) {
      if (id === sourceId) {
        continue;
      }
      if (Math.hypot(x - node.container.x, y - node.container.y) <= radius) {
        return id;
      }
    }
    return null;
  }

  return {
    ready,
    hitBase,
    destroy() {
      destroyed = true;
      void ready.finally(() => {
        if (app.renderer) {
          app.renderer.off("resize", onResize);
        }
        app.destroy(true, { children: true });
      });
    },
  };
}
