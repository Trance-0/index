'use client'

import { useEffect, useRef, useCallback } from 'react';

const PHI = (Math.sqrt(5) + 1) / 2;
const BASE = 5;
const APOTHEM = Math.cos(Math.PI / (BASE * 2));

function C(re, im) { return { re, im }; }
function cAdd(a, b) { return C(a.re + b.re, a.im + b.im); }
function cSub(a, b) { return C(a.re - b.re, a.im - b.im); }
function cDivS(a, s) { return C(a.re / s, a.im / s); }
function cRect(r, theta) { return C(r * Math.cos(theta), r * Math.sin(theta)); }

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

// Lazy subdivision tree. Each node caches its children after the first
// subdivide, so repeated renders at the same or nearby views don't
// re-compute anything. Seed-changing params (thetaOffset, mirrorShift,
// seedR) invalidate the tree; divisions/zoom/pan do not.
function makeNode(shape, v1, v2, v3) {
  return {
    shape, v1, v2, v3,
    children: null,
    minX: Math.min(v1.re, v2.re, v3.re),
    maxX: Math.max(v1.re, v2.re, v3.re),
    minY: Math.min(v1.im, v2.im, v3.im),
    maxY: Math.max(v1.im, v2.im, v3.im),
    maxEdge: Math.max(
      Math.hypot(v2.re - v1.re, v2.im - v1.im),
      Math.hypot(v3.re - v2.re, v3.im - v2.im),
      Math.hypot(v1.re - v3.re, v1.im - v3.im)
    ),
  };
}

function subdivideNode(node) {
  const { shape, v1, v2, v3 } = node;
  if (shape === 'thin') {
    const p1 = cAdd(v1, cDivS(cSub(v2, v1), PHI));
    node.children = [
      makeNode('thin', v3, p1, v2),
      makeNode('thicc', p1, v3, v1),
    ];
  } else {
    const p2 = cAdd(v2, cDivS(cSub(v1, v2), PHI));
    const p3 = cAdd(v2, cDivS(cSub(v3, v2), PHI));
    node.children = [
      makeNode('thicc', p3, v3, v1),
      makeNode('thicc', p2, p3, v2),
      makeNode('thin', p3, p2, v1),
    ];
  }
}

export function createPenroseTree(thetaOffset, mirrorShift, seedR = 1) {
  const roots = [];
  for (let i = 0; i < BASE * 2; i++) {
    const a2 = (2 * i - 1) * Math.PI / (BASE * 2) + thetaOffset;
    const a3 = (2 * i + 1) * Math.PI / (BASE * 2) + thetaOffset;
    let v2 = cRect(seedR, a2);
    let v3 = cRect(seedR, a3);
    if (((i + mirrorShift) % 2) === 0) {
      const tmp = v2; v2 = v3; v3 = tmp;
    }
    roots.push(makeNode('thin', C(0, 0), v2, v3));
  }
  return { roots, thetaOffset, mirrorShift, seedR };
}

export function collectVisibleTriangles(tree, {
  W, H, s,
  panX = 0, panY = 0, rotation = 0,
  maxDepth = 12,
  minPixelSize = 4,
}) {
  const cr = Math.cos(-rotation);
  const sr = Math.sin(-rotation);
  const toTile = (x, y) => {
    const ox = x - W / 2 - panX;
    const oy = y - H / 2 - panY;
    return { re: (cr * ox - sr * oy) / s, im: (sr * ox + cr * oy) / s };
  };
  const c1 = toTile(0, 0), c2 = toTile(W, 0), c3 = toTile(W, H), c4 = toTile(0, H);
  const minVX = Math.min(c1.re, c2.re, c3.re, c4.re);
  const maxVX = Math.max(c1.re, c2.re, c3.re, c4.re);
  const minVY = Math.min(c1.im, c2.im, c3.im, c4.im);
  const maxVY = Math.max(c1.im, c2.im, c3.im, c4.im);

  const minEdgeTile = minPixelSize / s;
  const output = [];
  const stack = [];
  for (const root of tree.roots) stack.push({ node: root, depth: 0 });
  while (stack.length > 0) {
    const { node, depth } = stack.pop();
    if (node.maxX < minVX || node.minX > maxVX || node.maxY < minVY || node.minY > maxVY) continue;
    if (depth >= maxDepth || node.maxEdge < minEdgeTile) {
      output.push(node);
      continue;
    }
    if (!node.children) subdivideNode(node);
    for (const child of node.children) stack.push({ node: child, depth: depth + 1 });
  }
  return output;
}

// Generate a Penrose tiling that fully covers the given viewport at any pan/zoom.
// - The seed decagon is scaled up so its apothem reaches the farthest visible point.
// - Triangle AABBs outside the visible region are culled before spawning children,
//   so work scales with visible area rather than total tiled area.
// - Subdivision halts when a triangle's largest edge falls below `minPixelSize`
//   pixels on screen (so infinite zoom stays bounded in work).
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
  const corners = [
    toTile(0, 0), toTile(W, 0), toTile(W, H), toTile(0, H),
  ];
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
      if (tMaxX < minVX || tMinX > maxVX || tMaxY < minVY || tMinY > maxVY) {
        continue;
      }
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

export function drawPenrose(ctx, W, H, opts) {
  const {
    divisions,
    thetaOffset,
    mirrorShift,
    zoom = 1,
    panX = 0,
    panY = 0,
    rotation = 0,
    showOutline = true,
    thinColor,
    thickColor,
    outlineColor,
    bgColor,
    outlineWidthPx = 1,
    enlarge = 1.1,
  } = opts;

  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.clearRect(0, 0, W, H);
  }

  const tris = generateTriangles(divisions, thetaOffset, mirrorShift);

  // Initial decagon has circumradius 1; its inscribed circle (apothem)
  // must reach the viewport's farthest corner so edges never show,
  // regardless of aspect ratio or rotation.
  const halfDiagonal = Math.hypot(W, H) / 2;
  const s = (halfDiagonal / APOTHEM) * enlarge * zoom;

  const cx = 0;
  const cy = 0;

  ctx.save();
  ctx.translate(W / 2 + panX, H / 2 + panY);
  ctx.rotate(rotation);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);

  ctx.beginPath();
  for (const t of tris) {
    if (t.shape !== 'thin') continue;
    ctx.moveTo(t.v1.re, t.v1.im);
    ctx.lineTo(t.v2.re, t.v2.im);
    ctx.lineTo(t.v3.re, t.v3.im);
    ctx.closePath();
  }
  ctx.fillStyle = thinColor;
  ctx.fill();

  ctx.beginPath();
  for (const t of tris) {
    if (t.shape !== 'thicc') continue;
    ctx.moveTo(t.v1.re, t.v1.im);
    ctx.lineTo(t.v2.re, t.v2.im);
    ctx.lineTo(t.v3.re, t.v3.im);
    ctx.closePath();
  }
  ctx.fillStyle = thickColor;
  ctx.fill();

  if (showOutline) {
    ctx.beginPath();
    for (const t of tris) {
      ctx.moveTo(t.v2.re, t.v2.im);
      ctx.lineTo(t.v1.re, t.v1.im);
      ctx.lineTo(t.v3.re, t.v3.im);
    }
    ctx.lineWidth = outlineWidthPx / s;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = outlineColor;
    ctx.stroke();
  }

  ctx.restore();

  return tris.length;
}

function getDefaultColors() {
  if (typeof window === 'undefined') {
    return { thin: 'rgba(0,0,0,0.05)', thick: 'transparent', outline: 'rgba(0,0,0,0.12)' };
  }
  const isDark = document.documentElement.classList.contains('dark')
    || window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  if (isDark) {
    return { thin: 'rgba(255,255,255,0.06)', thick: 'rgba(0,0,0,0.15)', outline: 'rgba(255,255,255,0.12)' };
  }
  return { thin: 'rgba(0,0,0,0.05)', thick: 'rgba(255,255,255,0.35)', outline: 'rgba(0,0,0,0.12)' };
}

export default function PenroseBackground({
  divisions = 6,
  opacity = 1,
  thinColor,
  thickColor,
  outlineColor,
  showOutline = true,
  fixed = true,
  zIndex = -1,
}) {
  const canvasRef = useRef(null);
  const seedRef = useRef({
    thetaOffset: Math.random() * Math.PI * 2,
    mirrorShift: Math.random() < 0.5 ? 0 : 1,
  });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    const W = window.innerWidth;
    const H = window.innerHeight;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const defaults = getDefaultColors();
    drawPenrose(ctx, W, H, {
      divisions,
      thetaOffset: seedRef.current.thetaOffset,
      mirrorShift: seedRef.current.mirrorShift,
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
      showOutline,
      thinColor: thinColor ?? defaults.thin,
      thickColor: thickColor ?? defaults.thick,
      outlineColor: outlineColor ?? defaults.outline,
      bgColor: 'transparent',
      outlineWidthPx: 1,
      enlarge: 1.1,
    });
  }, [divisions, thinColor, thickColor, outlineColor, showOutline]);

  useEffect(() => { render(); }, [render]);

  useEffect(() => {
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [render]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = () => render();
    mql?.addEventListener?.('change', onChange);
    const observer = new MutationObserver(() => render());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mql?.removeEventListener?.('change', onChange);
      observer.disconnect();
    };
  }, [render]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: fixed ? 'fixed' : 'absolute',
        inset: 0,
        zIndex,
        pointerEvents: 'none',
        opacity,
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
