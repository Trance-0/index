// Owns the world (W x H torus), the live particle list, the badge list, and
// drives all per-tick physics and reaction firing.

import { Particle } from './particle.js';
import { molecularMass } from './atoms.js';

function clippedNormal(mean, std) {
  if (std <= 0) return Math.max(0, mean);
  const u1 = Math.max(1e-9, Math.random());
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, mean + std * z);
}

function pickHeaviest(arr) {
  if (!arr || !arr.length) return null;
  let best = arr[0];
  for (let i = 1; i < arr.length; i++) if (arr[i].mass > best.mass) best = arr[i];
  return best;
}

// Split a possibly-wrapping bounding box into 1-4 visible pieces.
//
// Inputs are unwrapped coordinates: a box [(x0..x1), (y0..y1)] that may
// extend past the [0..W] / [0..H] world bounds. Each axis can either fit
// inside the world (one piece) or stretch across a seam (two pieces). The
// product of the two-axis splits is up to 4 visible boxes.
function emitWrappedBoxes(x0, y0, x1, y1, W, H, life, label = '') {
  const xRanges = [];
  if (x0 < 0)      { xRanges.push([0, x1]); xRanges.push([x0 + W, W]); }
  else if (x1 > W) { xRanges.push([x0, W]); xRanges.push([0, x1 - W]); }
  else             { xRanges.push([x0, x1]); }
  const yRanges = [];
  if (y0 < 0)      { yRanges.push([0, y1]); yRanges.push([y0 + H, H]); }
  else if (y1 > H) { yRanges.push([y0, H]); yRanges.push([0, y1 - H]); }
  else             { yRanges.push([y0, y1]); }
  const out = [];
  for (const [xa, xb] of xRanges) {
    for (const [ya, yb] of yRanges) {
      const w = xb - xa, h = yb - ya;
      if (w > 0.5 && h > 0.5) out.push({ x: xa, y: ya, w, h, t: 0, life, label });
    }
  }
  return out;
}

const DEFAULT_OPTIONS = {
  maxParticles: 80,
  energyMean: 2500,
  energyStd: 600,
  spawnFadeIn: 0.8,         // seconds to fade a fresh particle to full alpha
  staleFadeStart: 20,       // seconds since last reaction before fade begins
  staleFadeEnd: 30,         // seconds since last reaction at which the particle is fully gone
  speedMin: 20,
  speedMax: 320,
  particleScale: 1,         // visual + collision radius multiplier (0.1..5)
  reactionBoxLife: 2,       // seconds the bounding box for a reaction stays visible (fade-out only)
  reactionBoxScale: 1.2,    // multiplier on the reaction bbox extents around the reactant radii
};

export class Simulator {
  constructor({ defs = {}, reactions, spawnable = [], options = {} } = {}) {
    this.defs = defs;
    this.reactions = reactions;
    this.spawnable = spawnable.filter((k) => defs[k]);
    this.particles = [];
    this.badges = [];
    this.boxes = [];               // reaction bounding-box events
    this.lifetimeSpawns = {};      // total spawns ever, keyed by kind
    this.lifetimeReactions = 0;    // total reaction events fired
    this.tracked = [];             // particles the user has clicked to follow; pinned from fading
    this.width = 0;
    this.height = 0;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // Tracking is a *list* (insertion order matters: it stabilises colormap
  // assignment in the renderer). Single-select callers can pass an array
  // with one particle, or use clearTracked() + addTracked().
  setTracked(list) {
    if (!list) { this.tracked = []; return; }
    this.tracked = Array.isArray(list) ? list.slice() : [list];
  }
  addTracked(p) {
    if (!p || this.tracked.includes(p)) return;
    this.tracked.push(p);
  }
  removeTracked(p) {
    const i = this.tracked.indexOf(p);
    if (i >= 0) this.tracked.splice(i, 1);
  }
  toggleTracked(p) {
    if (!p) return;
    const i = this.tracked.indexOf(p);
    if (i >= 0) this.tracked.splice(i, 1); else this.tracked.push(p);
  }
  isTracked(p) { return this.tracked.includes(p); }
  clearTracked() { this.tracked = []; }

  // Pick the visible particle nearest to (mx, my) within its scaled radius.
  // Returns null if no particle is hit. Uses shortest-path distance on torus.
  pickAt(mx, my) {
    const W = this.width, H = this.height;
    const scale = this.options.particleScale || 1;
    let best = null, bestD2 = Infinity;
    for (const p of this.particles) {
      const r = p.r * scale;
      let dx = mx - p.x; if (dx > W / 2) dx -= W; else if (dx < -W / 2) dx += W;
      let dy = my - p.y; if (dy > H / 2) dy -= H; else if (dy < -H / 2) dy += H;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r * r && d2 < bestD2) { bestD2 = d2; best = p; }
    }
    return best;
  }

  setOptions(o) { this.options = { ...this.options, ...o }; }
  setSize(w, h) { this.width = w; this.height = h; }

  setRules({ defs, spawnable }) {
    this.defs = defs;
    this.spawnable = spawnable.filter((k) => defs[k]);
    this.particles = this.particles.filter((p) => defs[p.kind]);
    for (const p of this.particles) {
      const def = defs[p.kind];
      p.r = def.r;
      p.mass = molecularMass(def);
      if (p.ripeAt == null) p.ripeAt = this.reactions.initialRipeAt(p.kind);
    }
  }

  // Rebind the live ReactionManager. Caller is expected to have set its rules.
  refreshReactions() {
    for (const p of this.particles) {
      if (p.ripeAt == null) p.ripeAt = this.reactions.initialRipeAt(p.kind);
    }
  }

  sampleSpeed(mass) {
    const ke = clippedNormal(this.options.energyMean, this.options.energyStd);
    return Math.sqrt(2 * ke / Math.max(1, mass));
  }

  // Spawn a particle. Any of (x, y, vx, vy) left undefined are randomized.
  spawn({ kind, x, y, vx, vy }) {
    const def = this.defs[kind];
    if (!def) return null;
    const mass = molecularMass(def);
    if (vx == null || vy == null) {
      const speed = this.sampleSpeed(mass);
      const ang = Math.random() * Math.PI * 2;
      vx = Math.cos(ang) * speed;
      vy = Math.sin(ang) * speed;
    }
    if (x == null) x = Math.random() * this.width;
    if (y == null) y = Math.random() * this.height;
    const p = new Particle({
      kind, x, y, vx, vy,
      r: def.r,
      mass,
      ripeAt: this.reactions.initialRipeAt(kind),
    });
    this.particles.push(p);
    this.lifetimeSpawns[kind] = (this.lifetimeSpawns[kind] || 0) + 1;
    return p;
  }

  step(dt) {
    const W = this.width, H = this.height;
    if (W <= 0 || H <= 0) return;
    // integrate + torus wrap + speed clamp
    const { speedMin, speedMax } = this.options;
    for (const p of this.particles) {
      p.step(dt, W, H);
      const sp = Math.hypot(p.vx, p.vy);
      if (sp < speedMin) {
        const s2 = this.sampleSpeed(p.mass) || speedMin;
        const a = Math.atan2(p.vy, p.vx) || (Math.random() * Math.PI * 2);
        p.vx = Math.cos(a) * s2; p.vy = Math.sin(a) * s2;
      } else if (sp > speedMax) {
        const k = speedMax / sp; p.vx *= k; p.vy *= k;
      }
    }
    // Tracked particles are pinned: keep their staleness clocks at 0 so they
    // never fade out, even if they sit idle for longer than the threshold.
    for (const tp of this.tracked) tp.staleAge = 0;
    this._collide();
    this._ripen();
    this._cullStale();
    // Drop any tracked refs that disappeared via paths other than reactions.
    if (this.tracked.length) {
      const set = new Set(this.particles);
      this.tracked = this.tracked.filter((tp) => set.has(tp));
    }
    for (const b of this.badges) { b.t += dt; b.y -= 18 * dt; }
    this.badges = this.badges.filter((b) => b.t < b.life);
    for (const box of this.boxes) box.t += dt;
    this.boxes = this.boxes.filter((box) => box.t < box.life);
  }

  _collide() {
    const ps = this.particles;
    if (ps.length < 2) return;
    const W = this.width, H = this.height;
    const scale = this.options.particleScale || 1;
    let maxR = 0;
    for (const p of ps) if (p.r * scale > maxR) maxR = p.r * scale;
    const cell = Math.max(16, maxR * 2);
    const cols = Math.max(1, Math.ceil(W / cell));
    const rows = Math.max(1, Math.ceil(H / cell));
    const grid = new Map();
    for (let idx = 0; idx < ps.length; idx++) {
      const p = ps[idx];
      const cx = ((Math.floor(p.x / cell) % cols) + cols) % cols;
      const cy = ((Math.floor(p.y / cell) % rows) + rows) % rows;
      const key = cy * cols + cx;
      let bucket = grid.get(key);
      if (!bucket) { bucket = []; grid.set(key, bucket); }
      bucket.push(idx);
    }

    const consumed = new Set();
    const checkPair = (i, j) => {
      if (consumed.has(i) || consumed.has(j)) return;
      const a = ps[i], b = ps[j];
      let dx = b.x - a.x;
      if (dx > W / 2) dx -= W; else if (dx < -W / 2) dx += W;
      let dy = b.y - a.y;
      if (dy > H / 2) dy -= H; else if (dy < -H / 2) dy += H;
      const d2 = dx * dx + dy * dy;
      const rr = (a.r + b.r) * scale;
      if (d2 > rr * rr) return;
      const rule = this.reactions.getBimol(a.kind, b.kind);
      if (rule) {
        const mx = ((a.x + dx / 2) % W + W) % W;
        const my = ((a.y + dy / 2) % H + H) % H;
        this._fireBimol(rule, a, b, mx, my);
        consumed.add(i); consumed.add(j);
        return;
      }
      // Equal-mass elastic exchange along the contact normal.
      const d = Math.sqrt(d2) || 1;
      const nx = dx / d, ny = dy / d;
      const va = a.vx * nx + a.vy * ny;
      const vb = b.vx * nx + b.vy * ny;
      const dv = vb - va;
      a.vx += dv * nx; a.vy += dv * ny;
      b.vx -= dv * nx; b.vy -= dv * ny;
      const overlap = (rr - d) / 2;
      a.x = ((a.x - nx * overlap) % W + W) % W;
      a.y = ((a.y - ny * overlap) % H + H) % H;
      b.x = ((b.x + nx * overlap) % W + W) % W;
      b.y = ((b.y + ny * overlap) % H + H) % H;
    };

    for (const [key, bucket] of grid) {
      const cx = key % cols;
      const cy = (key - cx) / cols;
      for (let i = 0; i < bucket.length; i++) {
        for (let j = i + 1; j < bucket.length; j++) checkPair(bucket[i], bucket[j]);
      }
      const offsets = [[1, 0], [-1, 1], [0, 1], [1, 1]];
      for (const [ox, oy] of offsets) {
        const nx = ((cx + ox) % cols + cols) % cols;
        const ny = ((cy + oy) % rows + rows) % rows;
        if (nx === cx && ny === cy) continue;
        const nKey = ny * cols + nx;
        const nb = grid.get(nKey);
        if (!nb) continue;
        for (const i of bucket) for (const j of nb) checkPair(i, j);
      }
    }
    if (consumed.size) this.particles = ps.filter((_, i) => !consumed.has(i));
  }

  _fireBimol(rule, a, b, mx, my) {
    const mvx = (a.vx + b.vx) / 2, mvy = (a.vy + b.vy) / 2;
    const aTracked = this.isTracked(a);
    const bTracked = this.isTracked(b);
    const newOnes = [];
    for (const k of rule.products) {
      if (!this.defs[k]) continue;
      const def = this.defs[k];
      const mass = molecularMass(def);
      const baseSpeed = this.sampleSpeed(mass);
      const ang = Math.random() * Math.PI * 2;
      let vx = mvx + Math.cos(ang) * baseSpeed * 0.4;
      let vy = mvy + Math.sin(ang) * baseSpeed * 0.4;
      if (k === 'co2') vy -= Math.abs(baseSpeed) * 0.3;
      const p = this.spawn({ kind: k, x: mx, y: my, vx, vy });
      if (p) { p.resetReactionTimer(); newOnes.push(p); }
    }
    // Each tracked reactant is replaced in-place by the heaviest product so
    // the user keeps following the same "lineage". Multiple tracked reactants
    // converging on the same product collapse to a single tracking entry.
    const heaviest = pickHeaviest(newOnes);
    if (aTracked) this._replaceTracked(a, heaviest);
    if (bTracked) this._replaceTracked(b, heaviest);
    this.badges.push({ x: mx, y: my, t: 0, life: 0.9, glyph: rule.pictogram || 'arrow' });
    // Wrap-aware bbox: position b in a's frame using shortest-path delta, then
    // split the bbox if it crosses any seam.
    const W = this.width, H = this.height;
    const scale = this.options.particleScale || 1;
    const boxScale = this.options.reactionBoxScale || 1;
    let dxAB = b.x - a.x;
    if (dxAB > W / 2) dxAB -= W; else if (dxAB < -W / 2) dxAB += W;
    let dyAB = b.y - a.y;
    if (dyAB > H / 2) dyAB -= H; else if (dyAB < -H / 2) dyAB += H;
    const bx = a.x + dxAB, by = a.y + dyAB;
    const ar = a.r * scale * boxScale, br = b.r * scale * boxScale;
    const x0 = Math.min(a.x - ar, bx - br);
    const y0 = Math.min(a.y - ar, by - br);
    const x1 = Math.max(a.x + ar, bx + br);
    const y1 = Math.max(a.y + ar, by + br);
    const label = `${a.kind} + ${b.kind} → ${rule.products.join(' + ')}`;
    for (const box of emitWrappedBoxes(x0, y0, x1, y1, W, H, this.options.reactionBoxLife, label)) {
      this.boxes.push(box);
    }
    this.lifetimeReactions += 1;
  }

  _replaceTracked(oldP, newP) {
    const i = this.tracked.indexOf(oldP);
    if (i < 0) return;
    if (newP && !this.tracked.includes(newP)) this.tracked[i] = newP;
    else this.tracked.splice(i, 1);
  }

  _ripen() {
    const stillThere = [];
    for (const p of this.particles) {
      if (p.ripeAt != null && p.age >= p.ripeAt) {
        const rule = this.reactions.getUnimol(p.kind);
        if (rule) {
          const wasTracked = this.isTracked(p);
          const newOnes = [];
          for (const k of rule.products) {
            if (!this.defs[k]) continue;
            const def = this.defs[k];
            const mass = molecularMass(def);
            const baseSpeed = this.sampleSpeed(mass);
            const ang = Math.random() * Math.PI * 2;
            let vx = p.vx + Math.cos(ang) * baseSpeed * 0.4;
            let vy = p.vy + Math.sin(ang) * baseSpeed * 0.4;
            if (k === 'co2') vy -= Math.abs(baseSpeed) * 0.3;
            const np = this.spawn({ kind: k, x: p.x, y: p.y, vx, vy });
            if (np) { np.resetReactionTimer(); newOnes.push(np); }
          }
          if (wasTracked) this._replaceTracked(p, pickHeaviest(newOnes));
          this.badges.push({ x: p.x, y: p.y, t: 0, life: 0.9, glyph: rule.pictogram || 'arrow' });
          const W = this.width, H = this.height;
          const scale = this.options.particleScale || 1;
          const boxScale = this.options.reactionBoxScale || 1;
          const pr = p.r * scale * boxScale;
          const label = `${p.kind} → ${rule.products.join(' + ')}`;
          for (const box of emitWrappedBoxes(p.x - pr, p.y - pr, p.x + pr, p.y + pr, W, H, this.options.reactionBoxLife, label)) {
            this.boxes.push(box);
          }
          this.lifetimeReactions += 1;
          continue;
        }
      }
      stillThere.push(p);
    }
    this.particles = stillThere;
  }

  _cullStale() {
    const cutoff = this.options.staleFadeEnd;
    if (!Number.isFinite(cutoff) || cutoff <= 0) return;
    this.particles = this.particles.filter((p) => p.staleAge < cutoff);
  }

  // Re-balance population. Spawn the most reactive kind at random positions
  // while undersized; mark the least reactive kind as "stale soon" while
  // oversized so it fades naturally rather than disappearing instantly.
  populationTick() {
    if (!this.spawnable.length) return;
    const counts = {};
    for (const p of this.particles) counts[p.kind] = (counts[p.kind] || 0) + 1;
    const target = this.options.maxParticles;
    const minC = Math.floor(target * 0.6);
    const n = this.particles.length;

    if (n < minC) {
      const need = Math.min(target - n, 6);
      for (let i = 0; i < need; i++) {
        let best = this.spawnable[0], bestS = -1;
        for (const k of this.spawnable) {
          const s = this.reactions.reactivityScore(k, counts) + Math.random() * 0.5;
          if (s > bestS) { bestS = s; best = k; }
        }
        this.spawn({ kind: best });
        counts[best] = (counts[best] || 0) + 1;
      }
    } else if (n > target) {
      let worst = null, worstS = Infinity;
      for (const p of this.particles) {
        const s = this.reactions.reactivityScore(p.kind, counts);
        if (s < worstS) { worstS = s; worst = p; }
      }
      if (worst) worst.staleAge = Math.max(worst.staleAge, this.options.staleFadeStart + 0.1);
    }
  }

  reset() {
    this.particles = [];
    this.badges = [];
    this.boxes = [];
  }
}
