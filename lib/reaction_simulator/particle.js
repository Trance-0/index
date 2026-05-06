// One particle in the simulator. Owns its physics state and per-particle
// timers (overall age, time since last reaction, ripening delay).

export class Particle {
  constructor({ kind, x, y, vx, vy, r, mass, ripeAt = null }) {
    this.kind = kind;
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.angle = Math.random() * Math.PI * 2;
    this.omega = (Math.random() - 0.5) * 1.2;
    this.r = r;
    this.mass = mass;
    this.age = 0;
    this.staleAge = 0;
    this.ripeAt = ripeAt;
  }

  // Advance position with toroidal wrap on a (W x H) world.
  step(dt, W, H) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.omega * dt;
    this.age += dt;
    this.staleAge += dt;
    this.vx *= 0.999;
    this.vy *= 0.999;
    if (this.x < 0) this.x += W; else if (this.x >= W) this.x -= W;
    if (this.y < 0) this.y += H; else if (this.y >= H) this.y -= H;
  }

  // Reset the staleness timer when this particle takes part in a reaction.
  resetReactionTimer() { this.staleAge = 0; }

  // Compose spawn fade-in with a staleness-driven fade-out into a final alpha.
  alpha({ spawnFadeIn = 0, staleFadeStart = Infinity, staleFadeEnd = Infinity }) {
    let a = 1;
    if (spawnFadeIn > 0 && this.age < spawnFadeIn) {
      a = Math.min(a, this.age / spawnFadeIn);
    }
    if (Number.isFinite(staleFadeEnd) && staleFadeEnd > staleFadeStart) {
      if (this.staleAge >= staleFadeEnd) a = 0;
      else if (this.staleAge > staleFadeStart) {
        a = Math.min(a, 1 - (this.staleAge - staleFadeStart) / (staleFadeEnd - staleFadeStart));
      }
    }
    return Math.max(0, a);
  }
}
