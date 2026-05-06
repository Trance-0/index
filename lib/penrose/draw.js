// Canvas painter for the Penrose tiling background, plus theme-driven
// default colors used by the React component.

import { APOTHEM } from './geometry';
import { generateTriangles } from './triangles';

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

  ctx.save();
  ctx.translate(W / 2 + panX, H / 2 + panY);
  ctx.rotate(rotation);
  ctx.scale(s, s);

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

export function getDefaultColors() {
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
