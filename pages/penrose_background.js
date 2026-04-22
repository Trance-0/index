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
