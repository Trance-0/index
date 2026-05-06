// Eager triangle generators.
// `generateTriangles` is fixed-depth and used by the static background.
// `generateAdaptiveTriangles` subdivides only what's visible in the viewport
// and stops when triangles fall below `minPixelSize` on screen.

import { PHI, BASE, APOTHEM, C, cAdd, cSub, cDivS, cRect } from './geometry';

export function generateTriangles(divisions, thetaOffset, mirrorShift) {
  const triangles = [];
  for (let i = 0; i < BASE * 2; i++) {
    const a2 = (2 * i - 1) * Math.PI / (BASE * 2) + thetaOffset;
    const a3 = (2 * i + 1) * Math.PI / (BASE * 2) + thetaOffset;
    let v2 = cRect(1, a2);
    let v3 = cRect(1, a3);
    if (((i + mirrorShift) % 2) === 0) {
      const tmp = v2; v2 = v3; v3 = tmp;
    }
    triangles.push({ shape: 'thin', v1: C(0, 0), v2, v3 });
  }

  let tris = triangles;
  for (let i = 0; i < divisions; i++) {
    const next = [];
    for (const t of tris) {
      const { shape, v1, v2, v3 } = t;
      if (shape === 'thin') {
        const p1 = cAdd(v1, cDivS(cSub(v2, v1), PHI));
        next.push({ shape: 'thin', v1: v3, v2: p1, v3: v2 });
        next.push({ shape: 'thicc', v1: p1, v2: v3, v3: v1 });
      } else {
        const p2 = cAdd(v2, cDivS(cSub(v1, v2), PHI));
        const p3 = cAdd(v2, cDivS(cSub(v3, v2), PHI));
        next.push({ shape: 'thicc', v1: p3, v2: v3, v3: v1 });
        next.push({ shape: 'thicc', v1: p2, v2: p3, v3: v2 });
        next.push({ shape: 'thin', v1: p3, v2: p2, v3: v1 });
      }
    }
    tris = next;
  }
  return tris;
}

export function generateAdaptiveTriangles({
  W, H,
  s,
  panX = 0, panY = 0, rotation = 0,
  thetaOffset, mirrorShift,
  minDivisions = 0,
  maxDivisions = 20,
  minPixelSize = 3,
}) {
  const cr = Math.cos(-rotation);
  const sr = Math.sin(-rotation);
  const toTile = (x, y) => {
    const ox = x - W / 2 - panX;
    const oy = y - H / 2 - panY;
    return { re: (cr * ox - sr * oy) / s, im: (sr * ox + cr * oy) / s };
  };
  const corners = [toTile(0, 0), toTile(W, 0), toTile(W, H), toTile(0, H)];
  let minVX = Infinity, maxVX = -Infinity, minVY = Infinity, maxVY = -Infinity;
  let maxDist = 0;
  for (const c of corners) {
    if (c.re < minVX) minVX = c.re;
    if (c.re > maxVX) maxVX = c.re;
    if (c.im < minVY) minVY = c.im;
    if (c.im > maxVY) maxVY = c.im;
    const d = Math.hypot(c.re, c.im);
    if (d > maxDist) maxDist = d;
  }

  const seedR = Math.max(1, maxDist / APOTHEM * 1.02);

  let tris = [];
  for (let i = 0; i < BASE * 2; i++) {
    const a2 = (2 * i - 1) * Math.PI / (BASE * 2) + thetaOffset;
    const a3 = (2 * i + 1) * Math.PI / (BASE * 2) + thetaOffset;
    let v2 = cRect(seedR, a2);
    let v3 = cRect(seedR, a3);
    if (((i + mirrorShift) % 2) === 0) {
      const tmp = v2; v2 = v3; v3 = tmp;
    }
    tris.push({ shape: 'thin', v1: C(0, 0), v2, v3 });
  }

  const minEdgeTile = minPixelSize / s;

  for (let d = 0; d < maxDivisions; d++) {
    const next = [];
    let anySubdivided = false;
    for (const t of tris) {
      const tMinX = Math.min(t.v1.re, t.v2.re, t.v3.re);
      const tMaxX = Math.max(t.v1.re, t.v2.re, t.v3.re);
      const tMinY = Math.min(t.v1.im, t.v2.im, t.v3.im);
      const tMaxY = Math.max(t.v1.im, t.v2.im, t.v3.im);
      if (tMaxX < minVX || tMinX > maxVX || tMaxY < minVY || tMinY > maxVY) continue;
      if (d >= minDivisions) {
        const e1 = Math.hypot(t.v2.re - t.v1.re, t.v2.im - t.v1.im);
        const e2 = Math.hypot(t.v3.re - t.v2.re, t.v3.im - t.v2.im);
        const e3 = Math.hypot(t.v1.re - t.v3.re, t.v1.im - t.v3.im);
        const maxEdge = Math.max(e1, e2, e3);
        if (maxEdge < minEdgeTile) {
          next.push(t);
          continue;
        }
      }
      anySubdivided = true;
      const { shape, v1, v2, v3 } = t;
      if (shape === 'thin') {
        const p1 = cAdd(v1, cDivS(cSub(v2, v1), PHI));
        next.push({ shape: 'thin', v1: v3, v2: p1, v3: v2 });
        next.push({ shape: 'thicc', v1: p1, v2: v3, v3: v1 });
      } else {
        const p2 = cAdd(v2, cDivS(cSub(v1, v2), PHI));
        const p3 = cAdd(v2, cDivS(cSub(v3, v2), PHI));
        next.push({ shape: 'thicc', v1: p3, v2: v3, v3: v1 });
        next.push({ shape: 'thicc', v1: p2, v2: p3, v3: v2 });
        next.push({ shape: 'thin', v1: p3, v2: p2, v3: v1 });
      }
    }
    tris = next;
    if (!anySubdivided) break;
  }
  return tris;
}
