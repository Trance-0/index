// Constants and complex-number helpers shared by all Penrose code.

export const PHI = (Math.sqrt(5) + 1) / 2;
export const BASE = 5;                            // 5-fold symmetry → decagonal seed
export const APOTHEM = Math.cos(Math.PI / (BASE * 2));

export const C = (re, im) => ({ re, im });
export const cAdd = (a, b) => C(a.re + b.re, a.im + b.im);
export const cSub = (a, b) => C(a.re - b.re, a.im - b.im);
export const cDivS = (a, s) => C(a.re / s, a.im / s);
export const cRect = (r, theta) => C(r * Math.cos(theta), r * Math.sin(theta));
