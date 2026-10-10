export type Vec2 = { x: number; y: number };

const CLIP_EPS = 1e-9;

function dot(ax: number, ay: number, bx: number, by: number): number {
  return ax * bx + ay * by;
}

function signedArea(poly: Vec2[]): number {
  let area = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area * 0.5;
}

export function ensureCcw(poly: Vec2[]): Vec2[] {
  if (signedArea(poly) < 0) {
    return [...poly].reverse();
  }
  return poly;
}

function insideHalf(point: Vec2, site: Vec2, other: Vec2): boolean {
  const mx = (site.x + other.x) / 2;
  const my = (site.y + other.y) / 2;
  return dot(point.x - mx, point.y - my, other.x - site.x, other.y - site.y) <= CLIP_EPS;
}

function intersect(a: Vec2, b: Vec2, site: Vec2, other: Vec2): Vec2 {
  const mx = (site.x + other.x) / 2;
  const my = (site.y + other.y) / 2;
  const nx = other.x - site.x;
  const ny = other.y - site.y;
  const da = dot(a.x - mx, a.y - my, nx, ny);
  const db = dot(b.x - mx, b.y - my, nx, ny);
  const t = da / (da - db);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function clipBySite(poly: Vec2[], site: Vec2, other: Vec2): Vec2[] {
  if (poly.length < 3) {
    return [];
  }
  const out: Vec2[] = [];
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const aIn = insideHalf(a, site, other);
    const bIn = insideHalf(b, site, other);
    if (aIn && bIn) {
      out.push(b);
    } else if (aIn && !bIn) {
      out.push(intersect(a, b, site, other));
    } else if (!aIn && bIn) {
      out.push(intersect(a, b, site, other));
      out.push(b);
    }
  }
  return out;
}

function isLeft(a: Vec2, b: Vec2, p: Vec2): boolean {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) >= -CLIP_EPS;
}

function edgeIntersect(a: Vec2, b: Vec2, c: Vec2, d: Vec2): Vec2 {
  const dx1 = b.x - a.x;
  const dy1 = b.y - a.y;
  const dx2 = d.x - c.x;
  const dy2 = d.y - c.y;
  const den = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(den) < 1e-12) {
    return { x: b.x, y: b.y };
  }
  const t = ((c.x - a.x) * dy2 - (c.y - a.y) * dx2) / den;
  return { x: a.x + t * dx1, y: a.y + t * dy1 };
}

export function clipToPolygon(subject: Vec2[], clip: Vec2[]): Vec2[] {
  const hull = ensureCcw(clip);
  let output = subject;
  for (let i = 0; i < hull.length; i += 1) {
    const c0 = hull[i];
    const c1 = hull[(i + 1) % hull.length];
    const input = output;
    output = [];
    if (input.length === 0) {
      break;
    }
    for (let j = 0; j < input.length; j += 1) {
      const p = input[j];
      const q = input[(j + 1) % input.length];
      const pIn = isLeft(c0, c1, p);
      const qIn = isLeft(c0, c1, q);
      if (pIn && qIn) {
        output.push(q);
      } else if (pIn && !qIn) {
        output.push(edgeIntersect(p, q, c0, c1));
      } else if (!pIn && qIn) {
        output.push(edgeIntersect(p, q, c0, c1));
        output.push(q);
      }
    }
  }
  return output;
}

export function voronoiCells(sites: Vec2[], outline: Vec2[]): Vec2[][] {
  const land = ensureCcw(outline);
  return sites.map((site, index) => {
    let poly = land.map((point) => ({ ...point }));
    for (let other = 0; other < sites.length; other += 1) {
      if (other === index) {
        continue;
      }
      poly = clipBySite(poly, site, sites[other]);
      if (poly.length < 3) {
        break;
      }
    }
    return clipToPolygon(poly, land);
  });
}

export function polygonCentroid(poly: Vec2[]): Vec2 {
  if (poly.length === 0) {
    return { x: 0.5, y: 0.5 };
  }
  const area = signedArea(poly);
  if (Math.abs(area) < 1e-8) {
    const sx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
    const sy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;
    return { x: sx, y: sy };
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const cross = a.x * b.y - b.x * a.y;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  return { x: cx / (6 * area), y: cy / (6 * area) };
}

export function polygonArea(poly: Vec2[]): number {
  return Math.abs(signedArea(poly));
}

export function pointInPolygon(x: number, y: number, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (hit) {
      inside = !inside;
    }
  }
  return inside;
}

function quant(value: number): number {
  return Math.round(value * 10000);
}

function pointKey(point: Vec2): string {
  return `${quant(point.x)},${quant(point.y)}`;
}

function undirectedKey(a: Vec2, b: Vec2): string {
  const ka = pointKey(a);
  const kb = pointKey(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}

export function polygonsShareEdge(a: Vec2[], b: Vec2[]): boolean {
  const edges = new Set<string>();
  for (let i = 0; i < a.length; i += 1) {
    edges.add(undirectedKey(a[i], a[(i + 1) % a.length]));
  }
  for (let i = 0; i < b.length; i += 1) {
    if (edges.has(undirectedKey(b[i], b[(i + 1) % b.length]))) {
      return true;
    }
  }
  return false;
}

export function mergePolygons(a: Vec2[], b: Vec2[]): Vec2[] | null {
  const directed = new Map<string, { from: Vec2; to: Vec2 }>();
  const addRing = (poly: Vec2[]) => {
    for (let i = 0; i < poly.length; i += 1) {
      const from = poly[i];
      const to = poly[(i + 1) % poly.length];
      const reverse = `${pointKey(to)}>${pointKey(from)}`;
      if (directed.has(reverse)) {
        directed.delete(reverse);
        continue;
      }
      directed.set(`${pointKey(from)}>${pointKey(to)}`, { from, to });
    }
  };
  addRing(a);
  addRing(b);
  if (directed.size < 3) {
    return null;
  }
  const next = new Map<string, Vec2>();
  for (const edge of directed.values()) {
    next.set(pointKey(edge.from), edge.to);
  }
  const first = directed.values().next().value;
  if (!first) {
    return null;
  }
  const start = first.from;
  const ring: Vec2[] = [];
  let current = start;
  for (let i = 0; i < 120; i += 1) {
    ring.push(current);
    const following = next.get(pointKey(current));
    if (!following) {
      return null;
    }
    current = following;
    if (pointKey(current) === pointKey(start) && ring.length > 2) {
      break;
    }
  }
  return ring.length >= 3 ? ensureCcw(ring) : null;
}

export function roundPolygonCorners(poly: Vec2[], radius = 0.016): Vec2[] {
  if (poly.length < 3) {
    return poly;
  }
  const out: Vec2[] = [];
  const count = poly.length;
  for (let i = 0; i < count; i += 1) {
    const a = poly[(i + count - 1) % count];
    const b = poly[i];
    const c = poly[(i + 1) % count];
    const ab = Math.hypot(b.x - a.x, b.y - a.y);
    const bc = Math.hypot(c.x - b.x, c.y - b.y);
    const r = Math.min(radius, ab * 0.28, bc * 0.28);
    if (r < 1e-5 || ab < 1e-8 || bc < 1e-8) {
      out.push(b);
      continue;
    }
    const p1 = {
      x: b.x + ((a.x - b.x) * r) / ab,
      y: b.y + ((a.y - b.y) * r) / ab,
    };
    const p2 = {
      x: b.x + ((c.x - b.x) * r) / bc,
      y: b.y + ((c.y - b.y) * r) / bc,
    };
    const steps = 4;
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const mt = 1 - t;
      out.push({
        x: mt * mt * p1.x + 2 * mt * t * b.x + t * t * p2.x,
        y: mt * mt * p1.y + 2 * mt * t * b.y + t * t * p2.y,
      });
    }
  }
  return out;
}

export function packPolygon(poly: Vec2[]): string {
  return poly.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`).join(" ");
}

export function unpackPolygon(raw: string): Vec2[] {
  if (!raw) {
    return [];
  }
  const points: Vec2[] = [];
  for (const token of raw.split(" ")) {
    const comma = token.indexOf(",");
    if (comma <= 0) {
      continue;
    }
    const x = Number(token.slice(0, comma));
    const y = Number(token.slice(comma + 1));
    if (Number.isFinite(x) && Number.isFinite(y)) {
      points.push({ x, y });
    }
  }
  return points;
}
