// Index of bimolecular and unimolecular reactions.
// Owns the per-pair lookup map, per-kind ripening lookup, and the reactivity
// scoring used by the population manager.

export class ReactionManager {
  constructor(bimol = [], unimol = []) {
    this.bimol = bimol;
    this.unimol = unimol;
    this._rebuild();
  }

  setRules(bimol, unimol) {
    this.bimol = bimol;
    this.unimol = unimol;
    this._rebuild();
  }

  _rebuild() {
    this.bimolMap = new Map();
    this.unimolMap = new Map();
    for (const r of this.bimol) {
      if (!r || !r.a || !r.b) continue;
      this.bimolMap.set(`${r.a}|${r.b}`, r);
      this.bimolMap.set(`${r.b}|${r.a}`, r);
    }
    for (const r of this.unimol) {
      if (!r || !r.kind) continue;
      this.unimolMap.set(r.kind, r);
    }
  }

  getBimol(kindA, kindB) {
    return this.bimolMap.get(`${kindA}|${kindB}`);
  }

  getUnimol(kind) {
    return this.unimolMap.get(kind);
  }

  // Higher score = a kind that is most likely to react against the current
  // field. The population manager spawns the highest-scoring kind when the
  // field is undersized and culls the lowest-scoring kind when oversized.
  reactivityScore(kind, counts) {
    let s = 0;
    for (const r of this.bimol) {
      if (r.a === kind) s += counts[r.b] || 0;
      else if (r.b === kind) s += counts[r.a] || 0;
    }
    if (this.unimolMap.has(kind)) s += 2;
    return s;
  }

  // Fresh ripening delay for a unimolecular kind (or null).
  initialRipeAt(kind) {
    const u = this.unimolMap.get(kind);
    if (!u) return null;
    const span = Math.max(0, u.maxAge - u.minAge);
    return u.minAge + Math.random() * span;
  }
}
