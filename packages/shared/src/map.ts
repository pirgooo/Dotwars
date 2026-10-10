import { NEUTRAL_OWNER_ID } from "./rules";
import {
  ensureCcw,
  mergePolygons,
  packPolygon,
  pointInPolygon,
  polygonArea,
  polygonCentroid,
  polygonsShareEdge,
  voronoiCells,
  type Vec2,
} from "./voronoi";

export interface MapBase {
  id: string;
  x: number;
  y: number;
  garrison: number;
  ownerId: string;
  polygon: string;
  active: boolean;
}

export const MAP_LAYOUT_COUNT = 32;
export const MIN_REGIONS = 20;

type Blob = { x: number; y: number; rx: number; ry: number; rot: number };

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp01(value: number, pad = 0.02): number {
  return Math.min(1 - pad, Math.max(pad, value));
}

function rayEllipse(ox: number, oy: number, dx: number, dy: number, blob: Blob): number {
  const cos = Math.cos(-blob.rot);
  const sin = Math.sin(-blob.rot);
  const tx = ox - blob.x;
  const ty = oy - blob.y;
  const lx = (tx * cos - ty * sin) / blob.rx;
  const ly = (tx * sin + ty * cos) / blob.ry;
  const ldx = (dx * cos - dy * sin) / blob.rx;
  const ldy = (dx * sin + dy * cos) / blob.ry;
  const a = ldx * ldx + ldy * ldy;
  const b = 2 * (lx * ldx + ly * ldy);
  const c = lx * lx + ly * ly - 1;
  const disc = b * b - 4 * a * c;
  if (disc < 0 || a < 1e-12) {
    return -1;
  }
  const root = Math.sqrt(disc);
  const t1 = (-b - root) / (2 * a);
  const t2 = (-b + root) / (2 * a);
  return Math.max(t1, t2);
}

function outlineFromBlobs(blobs: Blob[], rnd: () => number, samples = 56): Vec2[] {
  const cx = blobs[0]?.x ?? 0.5;
  const cy = blobs[0]?.y ?? 0.52;
  const pts: Vec2[] = [];
  const phase = rnd() * Math.PI * 2;
  for (let i = 0; i < samples; i += 1) {
    const t = (i / samples) * Math.PI * 2;
    const dx = Math.cos(t);
    const dy = Math.sin(t);
    let best = 0;
    for (const blob of blobs) {
      best = Math.max(best, rayEllipse(cx, cy, dx, dy, blob));
    }
    const wobble = 1 + 0.035 * Math.sin(5 * t + phase) + (rnd() - 0.5) * 0.03;
    const r = Math.max(0.04, best * wobble);
    pts.push({ x: clamp01(cx + dx * r), y: clamp01(cy + dy * r, 0.07) });
  }
  return ensureCcw(pts);
}

function makeMainland(rnd: () => number): Vec2[] {
  const cx = 0.46 + (rnd() - 0.5) * 0.08;
  const cy = 0.54 + (rnd() - 0.5) * 0.06;
  const blobs: Blob[] = [
    {
      x: cx,
      y: cy,
      rx: 0.28 + rnd() * 0.05,
      ry: 0.22 + rnd() * 0.04,
      rot: (rnd() - 0.5) * 0.5,
    },
  ];
  const arms = 2 + Math.floor(rnd() * 3);
  for (let i = 0; i < arms; i += 1) {
    const ang = rnd() * Math.PI * 2;
    const dist = 0.2 + rnd() * 0.12;
    blobs.push({
      x: cx + Math.cos(ang) * dist,
      y: cy + Math.sin(ang) * dist,
      rx: 0.1 + rnd() * 0.08,
      ry: 0.055 + rnd() * 0.04,
      rot: ang + (rnd() - 0.5) * 0.4,
    });
  }
  return outlineFromBlobs(blobs, rnd);
}

function makeIsland(rnd: () => number, near: Vec2): Vec2[] {
  const ang = rnd() * Math.PI * 2;
  const blobs: Blob[] = [
    {
      x: clamp01(near.x + Math.cos(ang) * (0.14 + rnd() * 0.1)),
      y: clamp01(near.y + Math.sin(ang) * (0.12 + rnd() * 0.1), 0.08),
      rx: 0.045 + rnd() * 0.03,
      ry: 0.032 + rnd() * 0.02,
      rot: rnd() * Math.PI,
    },
  ];
  return outlineFromBlobs(blobs, rnd, 24);
}

function placeSites(outline: Vec2[], count: number, rnd: () => number): Vec2[] {
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (const p of outline) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const sites: Vec2[] = [];
  let minDist = 0.03;
  for (let pass = 0; pass < 4 && sites.length < count; pass += 1) {
    let attempts = 0;
    while (sites.length < count && attempts < 1000) {
      attempts += 1;
      const p = {
        x: minX + rnd() * (maxX - minX),
        y: minY + rnd() * (maxY - minY),
      };
      if (!pointInPolygon(p.x, p.y, outline)) {
        continue;
      }
      if (sites.some((site) => Math.hypot(site.x - p.x, site.y - p.y) < minDist)) {
        continue;
      }
      sites.push(p);
    }
    minDist *= 0.7;
  }
  return sites;
}

function absorbTiny(cells: Vec2[][], minArea: number): Vec2[][] {
  const list = cells.filter((poly) => poly.length >= 3 && polygonArea(poly) > 0.00035);
  let guard = 0;
  while (guard < 30) {
    guard += 1;
    const tiny = list.findIndex((poly) => polygonArea(poly) < minArea);
    if (tiny < 0) {
      break;
    }
    let neighbor = -1;
    for (let j = 0; j < list.length; j += 1) {
      if (j !== tiny && polygonsShareEdge(list[tiny], list[j])) {
        neighbor = j;
        break;
      }
    }
    if (neighbor < 0) {
      list.splice(tiny, 1);
      continue;
    }
    const merged = mergePolygons(list[tiny], list[neighbor]);
    if (!merged) {
      list.splice(tiny, 1);
      continue;
    }
    const drop = new Set([tiny, neighbor]);
    const next = list.filter((_, index) => !drop.has(index));
    next.push(merged);
    list.length = 0;
    list.push(...next);
  }
  return list;
}

function pickSpreadHomes(points: Vec2[], count: number): number[] {
  if (points.length === 0 || count <= 0) {
    return [];
  }
  if (count === 1 || points.length === 1) {
    return [0];
  }
  const [first, second] = furthestPair(points);
  const homes = [first, second];
  while (homes.length < count && homes.length < points.length) {
    let best = -1;
    let bestMin = -1;
    for (let i = 0; i < points.length; i += 1) {
      if (homes.includes(i)) {
        continue;
      }
      let nearest = Number.POSITIVE_INFINITY;
      for (const home of homes) {
        nearest = Math.min(
          nearest,
          Math.hypot(points[i].x - points[home].x, points[i].y - points[home].y),
        );
      }
      if (nearest > bestMin) {
        bestMin = nearest;
        best = i;
      }
    }
    if (best < 0) {
      break;
    }
    homes.push(best);
  }
  return homes;
}

function furthestPair(points: Vec2[]): [number, number] {
  let best = 0;
  let ia = 0;
  let ib = Math.min(1, points.length - 1);
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
      if (d > best) {
        best = d;
        ia = i;
        ib = j;
      }
    }
  }
  return [ia, ib];
}

function fitToScreen(polygons: Vec2[][]): Vec2[][] {
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (const poly of polygons) {
    for (const point of poly) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
  }
  const spanX = Math.max(1e-6, maxX - minX);
  const spanY = Math.max(1e-6, maxY - minY);
  const destX = 0.05;
  const destY = 0.07;
  const destW = 0.9;
  const destH = 0.88;
  return polygons.map((poly) =>
    poly.map((point) => ({
      x: destX + ((point.x - minX) / spanX) * destW,
      y: destY + ((point.y - minY) / spanY) * destH,
    })),
  );
}

function nearestUnused(points: Vec2[], origin: number, taken: Set<number>): number {
  let best = -1;
  let dist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i += 1) {
    if (taken.has(i)) {
      continue;
    }
    const d = Math.hypot(points[i].x - points[origin].x, points[i].y - points[origin].y);
    if (d < dist) {
      dist = d;
      best = i;
    }
  }
  return best;
}

export function pickMapIndex(previous = -1): number {
  let seed = (Math.random() * 0x7fffffff) | 0;
  if (seed === previous) {
    seed = (seed + 1) | 0;
  }
  return seed;
}

function generateCountries(rnd: () => number, mainlandSites: number): Vec2[][] {
  const mainland = makeMainland(rnd);
  const chunks: { outline: Vec2[]; sites: number }[] = [
    { outline: mainland, sites: mainlandSites },
  ];
  const islandCount = rnd() > 0.22 ? 1 + (rnd() > 0.5 ? 1 : 0) : 0;
  for (let i = 0; i < islandCount; i += 1) {
    const island = makeIsland(rnd, polygonCentroid(mainland));
    const c = polygonCentroid(island);
    if (!pointInPolygon(c.x, c.y, mainland) && polygonArea(island) > 0.002) {
      chunks.push({ outline: island, sites: 1 + (rnd() > 0.45 ? 1 : 0) });
    }
  }

  const countries: Vec2[][] = [];
  for (const chunk of chunks) {
    const local = placeSites(chunk.outline, chunk.sites, rnd);
    if (local.length === 0) {
      continue;
    }
    const raw = voronoiCells(local, chunk.outline).filter(
      (poly) => poly.length >= 3 && polygonArea(poly) > 0.0004,
    );
    countries.push(...absorbTiny(raw, chunk.sites > 3 ? 0.0007 : 0.00045));
  }
  return countries;
}

export function createStarterMap(ownerIds: string[], layoutIndex = 1): MapBase[] {
  const seed = layoutIndex === -1 ? 1 : layoutIndex || 1;
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  let countries: Vec2[][] = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const sites = 28 + attempt * 4 + Math.floor(rnd() * 5);
    const next = generateCountries(rnd, sites);
    if (next.length > countries.length) {
      countries = next;
    }
    if (countries.length >= MIN_REGIONS) {
      break;
    }
  }

  if (countries.length < 4) {
    return [];
  }

  const fitted = fitToScreen(countries);
  const centers = fitted.map((poly) => polygonCentroid(poly));
  const homes = pickSpreadHomes(centers, ownerIds.length);
  const taken = new Set(homes);
  const fronts = homes.map((home) => {
    const front = nearestUnused(centers, home, taken);
    if (front >= 0) {
      taken.add(front);
    }
    return front;
  });

  return fitted.map((poly, index) => {
    const center = centers[index];
    let ownerId = NEUTRAL_OWNER_ID;
    const homeAt = homes.indexOf(index);
    const frontAt = fronts.indexOf(index);
    if (homeAt >= 0) {
      ownerId = ownerIds[homeAt] ?? NEUTRAL_OWNER_ID;
    } else if (frontAt >= 0) {
      ownerId = ownerIds[frontAt] ?? NEUTRAL_OWNER_ID;
    }
    return {
      id: `land-${index}`,
      x: center.x,
      y: center.y,
      garrison: 10,
      ownerId,
      polygon: packPolygon(poly),
      active: true,
    };
  });
}
