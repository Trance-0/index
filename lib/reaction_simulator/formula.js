// Lightweight Hill-style formula parser + structural-form generator.
//
// This is a small in-house parser. If you outgrow it, drop in a real
// chemistry library (e.g. openchemlib-js) and replace `parseFormula`
// and `generateStructure` while keeping the same return shape:
//   parseFormula(s) -> { [element]: count, ... }
//   generateStructure({ formula, layout, scale }) -> { atoms, bonds, r }
// where atoms = [[element, dx, dy], ...] and bonds = [[i, j, order], ...].

const TOKEN_RE = /^([A-Z][a-z]?)(\d*)/;

export function parseFormula(input) {
  if (typeof input !== 'string' || !input.trim()) return {};
  const stack = [{}];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (c === ' ' || c === '·' || c === '.') { i++; continue; }
    if (c === '(' || c === '[') { stack.push({}); i++; continue; }
    if (c === ')' || c === ']') {
      const top = stack.pop();
      i++;
      let mult = '';
      while (i < input.length && /\d/.test(input[i])) { mult += input[i]; i++; }
      const m = mult ? parseInt(mult, 10) : 1;
      const dest = stack[stack.length - 1];
      for (const [el, n] of Object.entries(top)) dest[el] = (dest[el] || 0) + n * m;
      continue;
    }
    const tok = input.slice(i).match(TOKEN_RE);
    if (!tok) { i++; continue; }
    const [, el, num] = tok;
    const n = num ? parseInt(num, 10) : 1;
    const dest = stack[stack.length - 1];
    dest[el] = (dest[el] || 0) + n;
    i += tok[0].length;
  }
  return stack[0];
}

function chainLayout(atoms, scale = 7) {
  const n = atoms.length;
  return atoms.map((el, i) => [el, (i - (n - 1) / 2) * scale, 0]);
}

function ringLayout(atoms, scale = 8) {
  const n = atoms.length;
  const R = Math.max(scale, scale * n * 0.18 + 4);
  return atoms.map((el, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [el, Math.cos(a) * R, Math.sin(a) * R];
  });
}

function gridLayout(atoms, scale = 8) {
  const n = atoms.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  return atoms.map((el, i) => {
    const cx = i % cols, cy = Math.floor(i / cols);
    return [el, (cx - (cols - 1) / 2) * scale, (cy - (rows - 1) / 2) * scale];
  });
}

// Pick the heaviest element first, then chain decoration. Useful when atoms
// represent an unordered formula expansion.
function orderHillStyle(counts) {
  const out = [];
  if (counts.C) for (let k = 0; k < counts.C; k++) out.push('C');
  if (counts.H) for (let k = 0; k < counts.H; k++) out.push('H');
  for (const el of Object.keys(counts).sort()) {
    if (el === 'C' || el === 'H') continue;
    for (let k = 0; k < counts[el]; k++) out.push(el);
  }
  return out;
}

export function generateStructure({ formula, layout = 'auto', scale = 7 } = {}) {
  const counts = parseFormula(formula);
  const atoms = orderHillStyle(counts);
  const N = atoms.length;
  if (N === 0) return { atoms: [], bonds: [], r: 6 };
  let positions;
  if (layout === 'ring') positions = ringLayout(atoms, scale + 2);
  else if (layout === 'grid') positions = gridLayout(atoms, scale + 2);
  else if (layout === 'chain') positions = chainLayout(atoms, scale);
  else positions = N >= 5 ? ringLayout(atoms, scale + 2) : chainLayout(atoms, scale);

  const bonds = [];
  for (let i = 0; i < N - 1; i++) bonds.push([i, i + 1, 1]);
  if (layout === 'ring' || (layout === 'auto' && N >= 5)) {
    bonds.push([N - 1, 0, 1]); // ring closure
  }
  const r = Math.max(8, ...positions.map(([, x, y]) => Math.hypot(x, y) + 4));
  return { atoms: positions, bonds, r };
}

// Count atoms in a structural definition (atoms = [[el, dx, dy], ...]).
export function defFormula(def) {
  if (!def || !Array.isArray(def.atoms)) return '';
  const counts = {};
  for (const [el] of def.atoms) counts[el] = (counts[el] || 0) + 1;
  const order = ['C', 'H', ...Object.keys(counts).filter((e) => e !== 'C' && e !== 'H').sort()];
  return order
    .filter((el) => counts[el])
    .map((el) => (counts[el] === 1 ? el : `${el}${counts[el]}`))
    .join('');
}

// Build a kind name from a formula string (e.g. "C6H12O6" -> "C6H12O6").
// Caller can override but this is a sensible default for parser-driven entries.
export function canonicalName(formula) {
  const counts = parseFormula(formula);
  const order = ['C', 'H', ...Object.keys(counts).filter((e) => e !== 'C' && e !== 'H').sort()];
  return order
    .filter((el) => counts[el])
    .map((el) => (counts[el] === 1 ? el : `${el}${counts[el]}`))
    .join('');
}
