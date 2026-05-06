// Theme-aware canvas renderer for the reaction simulator.

import { ATOM_PALETTES, getAtomStyle } from './atoms.js';
import { drawPictogram } from './pictograms.js';
import { hsvAdjustPalette } from './hsv.js';
import { colormapColor, DEFAULT_COLORMAP } from './colormap.js';

// Pick black or white text for a given background color so the label stays
// readable across light and dark colormap entries.
function pickLabelTextColor(bg) {
  let r = 255, g = 255, b = 255;
  if (typeof bg === 'string') {
    if (bg.startsWith('#')) {
      const hex = bg.slice(1);
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      }
    } else {
      const m = bg.match(/^rgba?\(([^)]+)\)$/i);
      if (m) {
        const parts = m[1].split(',').map((p) => parseFloat(p));
        if (parts.length >= 3) { r = parts[0]; g = parts[1]; b = parts[2]; }
      }
    }
  }
  // sRGB luma; >0.6 is bright enough that black text reads better.
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.6 ? '#111' : '#fff';
}

export class Renderer {
  constructor(canvas, theme) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = theme;
    this.dpr = Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    this.W = 0; this.H = 0;
    this.hsv = { h: 0, s: 0, v: 0 };  // additive shifts; 0/0/0 = identity
    this._paletteCache = { paletteKey: null, hsv: null, palette: null };
    this.showReactionBox = false;
    this.colormap = DEFAULT_COLORMAP;
    this.trackingBoxScale = 1.2;
  }

  setTheme(theme) { this.theme = theme; this._paletteCache.palette = null; }
  setHsv(hsv) { this.hsv = { ...this.hsv, ...hsv }; this._paletteCache.palette = null; }
  setShowReactionBox(v) { this.showReactionBox = !!v; }
  setColormap(key) { this.colormap = key || DEFAULT_COLORMAP; }
  setTrackingBoxScale(s) { this.trackingBoxScale = Number.isFinite(s) ? s : 1.2; }

  _palette() {
    const paletteKey = this.theme.palette || 'cpk';
    const base = ATOM_PALETTES[paletteKey] || ATOM_PALETTES.cpk;
    const { h, s, v } = this.hsv;
    const cache = this._paletteCache;
    if (cache.palette
        && cache.paletteKey === paletteKey
        && cache.hsv && cache.hsv.h === h && cache.hsv.s === s && cache.hsv.v === v) {
      return cache.palette;
    }
    const adjusted = hsvAdjustPalette(base, h, s, v);
    this._paletteCache = { paletteKey, hsv: { h, s, v }, palette: adjusted };
    return adjusted;
  }

  resize(W, H) {
    this.canvas.width = W * this.dpr;
    this.canvas.height = H * this.dpr;
    this.canvas.style.width = W + 'px';
    this.canvas.style.height = H + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.W = W; this.H = H;
  }

  drawBackground() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    const bg = this.theme.background;
    let grad;
    if (bg.type === 'radial') {
      grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    } else if (bg.type === 'linear' && typeof bg.angle === 'number') {
      const a = (bg.angle * Math.PI) / 180;
      const cx = W / 2, cy = H / 2;
      const dx = Math.cos(a) * W * 0.5, dy = Math.sin(a) * H * 0.5;
      grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    } else {
      grad = ctx.createLinearGradient(0, 0, 0, H);
    }
    for (const s of bg.stops) grad.addColorStop(s.offset, s.color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  draw(simulator, fadeOpts) {
    this.drawBackground();
    const palette = this._palette();
    const scale = (simulator.options && simulator.options.particleScale) || 1;
    const trackedSet = new Set(simulator.tracked || []);
    if (this.showReactionBox) this._drawReactionBoxes(simulator);
    for (const p of simulator.particles) {
      const def = simulator.defs[p.kind];
      if (!def) continue;
      // Tracked particles are pinned at full alpha so they never fade out.
      const a = trackedSet.has(p) ? 1 : p.alpha(fadeOpts);
      if (a <= 0.001) continue;
      this._drawWrapped(p, def, palette, a, scale);
    }
    // The pictogram badges and the formula-labelled reaction boxes are two
    // visualizations of the same event — show one or the other, never both.
    if (!this.showReactionBox) this._drawBadges(simulator);
    if (simulator.tracked && simulator.tracked.length) this._drawTrackedIndicators(simulator);
  }

  // Reaction boxes are spawned at full alpha and only fade *out* over `life`.
  // When a label is present (always, in normal use) we render it CV-style:
  // a small filled tab pinned to the upper-left corner of the box with the
  // detailed formula reaction text inside.
  _drawReactionBoxes(simulator) {
    const ctx = this.ctx;
    for (const box of simulator.boxes) {
      const life = box.life || 1;
      const t = Math.min(1, box.t / life);
      const a = 1 - t;
      ctx.save();
      ctx.globalAlpha = a * 0.9;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 3;
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.shadowBlur = 0;
      if (box.label) {
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        const tw = ctx.measureText(box.label).width;
        const padX = 5, lh = 15;
        const lw = tw + padX * 2;
        const lx = box.x;
        const ly = box.y - lh;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillRect(lx, ly, lw, lh);
        ctx.fillStyle = '#111';
        ctx.textBaseline = 'top';
        ctx.fillText(box.label, lx + padX, ly + 2);
      }
      ctx.restore();
    }
  }

  // CV-style bounding boxes around every user-tracked particle. With a
  // single tracked particle we draw white; with several we cycle through
  // the active colormap so each lineage is visually distinct.
  _drawTrackedIndicators(simulator) {
    const list = simulator.tracked || [];
    if (!list.length) return;
    const ctx = this.ctx;
    const pScale = (simulator.options && simulator.options.particleScale) || 1;
    const tScale = this.trackingBoxScale || 1;
    const W = this.W, H = this.H;
    const useColormap = list.length > 1;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (!p) continue;
      const r = p.r * pScale * tScale;
      const color = useColormap ? colormapColor(this.colormap, i) : '#ffffff';
      const drawAt = (cx, cy) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = 4;
        ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
        ctx.shadowBlur = 0;
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        const text = p.kind;
        const tw = ctx.measureText(text).width;
        const padX = 5, lh = 15;
        const lw = tw + padX * 2;
        const lx = cx - r;
        const ly = cy - r - lh;
        ctx.fillStyle = color;
        ctx.fillRect(lx, ly, lw, lh);
        ctx.fillStyle = pickLabelTextColor(color);
        ctx.textBaseline = 'top';
        ctx.fillText(text, lx + padX, ly + 2);
        ctx.restore();
      };
      const offs = [[0, 0]];
      if (p.x - r < 0) offs.push([W, 0]);
      if (p.x + r > W) offs.push([-W, 0]);
      if (p.y - r < 0) offs.push([0, H]);
      if (p.y + r > H) offs.push([0, -H]);
      if (p.x - r < 0 && p.y - r < 0) offs.push([W, H]);
      if (p.x + r > W && p.y - r < 0) offs.push([-W, H]);
      if (p.x - r < 0 && p.y + r > H) offs.push([W, -H]);
      if (p.x + r > W && p.y + r > H) offs.push([-W, -H]);
      for (const [ox, oy] of offs) drawAt(p.x + ox, p.y + oy);
    }
  }

  // Drawn wrap copies near each axis so a particle straddling the seam is
  // never visually clipped.
  _drawWrapped(p, def, palette, alpha, scale = 1) {
    const W = this.W, H = this.H, r = p.r * scale;
    const offs = [[0, 0]];
    if (p.x < r) offs.push([W, 0]);
    if (p.x > W - r) offs.push([-W, 0]);
    if (p.y < r) offs.push([0, H]);
    if (p.y > H - r) offs.push([0, -H]);
    if (p.x < r && p.y < r) offs.push([W, H]);
    if (p.x > W - r && p.y < r) offs.push([-W, H]);
    if (p.x < r && p.y > H - r) offs.push([W, -H]);
    if (p.x > W - r && p.y > H - r) offs.push([-W, -H]);
    for (const [ox, oy] of offs) this._drawAt(p, def, palette, alpha, p.x + ox, p.y + oy, scale);
  }

  _drawAt(p, def, palette, alpha, x, y, scale = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(p.angle);
    ctx.scale(scale, scale);
    ctx.strokeStyle = this.theme.bond;
    ctx.lineWidth = 1.4 / scale;
    for (const [i, j, order] of def.bonds || []) {
      const A = def.atoms[i], B = def.atoms[j];
      if (!A || !B) continue;
      if (order === 2) {
        const dx = B[1] - A[1], dy = B[2] - A[2];
        const d = Math.hypot(dx, dy) || 1;
        const nx = -dy / d * 1.6, ny = dx / d * 1.6;
        ctx.beginPath();
        ctx.moveTo(A[1] + nx, A[2] + ny); ctx.lineTo(B[1] + nx, B[2] + ny);
        ctx.moveTo(A[1] - nx, A[2] - ny); ctx.lineTo(B[1] - nx, B[2] - ny);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(A[1], A[2]); ctx.lineTo(B[1], B[2]);
        ctx.stroke();
      }
    }
    for (const [el, dx, dy] of def.atoms) {
      const pal = getAtomStyle(palette, el);
      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 0.8 / scale;
      ctx.beginPath();
      ctx.arc(dx, dy, pal.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawBadges(simulator) {
    const ctx = this.ctx;
    const badge = this.theme.badge;
    for (const b of simulator.badges) {
      const fadeIn = Math.min(1, b.t / 0.15);
      const fadeOut = 1 - Math.min(1, Math.max(0, (b.t - (b.life - 0.3)) / 0.3));
      const a = Math.min(fadeIn, fadeOut);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.shadowColor = badge.shadow;
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = badge.fill;
      const w = 32, h = 22, x = b.x - w / 2, y = b.y - h / 2, r = 11;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      drawPictogram(ctx, b.glyph, b.x, b.y, 1, this.theme.pictogramColor);
      ctx.restore();
    }
  }
}
