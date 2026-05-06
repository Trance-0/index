// Atomic constants and color palettes.

export const ATOMIC_MASS = {
  H: 1, B: 11, C: 12, N: 14, O: 16, F: 19,
  Na: 23, Mg: 24, Al: 27, Si: 28, P: 31, S: 32,
  Cl: 35.5, K: 39, Ca: 40, Mn: 55, Fe: 56, Cu: 63, Zn: 65,
  Br: 80, I: 127,
};

const _palette = (entries) => {
  const m = {};
  for (const [el, fill, stroke, r] of entries) m[el] = { fill, stroke, r };
  m._default = m.C || { fill: '#888', stroke: '#444', r: 6 };
  return m;
};

export const ATOM_PALETTES = {
  cpk: _palette([
    ['H', '#dcdcdc', '#888', 3],
    ['C', '#5e5e5e', '#3a3a3a', 6],
    ['N', '#4a6db4', '#243a6c', 6],
    ['O', '#c1574c', '#7a2f27', 6],
    ['P', '#d68a36', '#7a4b14', 6],
    ['S', '#cdaa1f', '#7d6510', 7],
    ['F', '#7ec47b', '#365a35', 5],
    ['Cl', '#7ac14a', '#3d6c25', 6],
    ['Br', '#a35a35', '#5b3220', 6],
    ['I',  '#9b4dca', '#4a1a64', 7],
  ]),
  pastel: _palette([
    ['H', '#fff7e6', '#cfb98b', 3],
    ['C', '#f6c9c9', '#a06868', 6],
    ['N', '#cfd9ef', '#6b7fa0', 6],
    ['O', '#f9c5b8', '#a07060', 6],
    ['P', '#fce0bf', '#c08c4f', 6],
    ['S', '#fff1aa', '#a59530', 7],
    ['F', '#d8efd8', '#7aa07a', 5],
    ['Cl','#dcefb6', '#7c9a3c', 6],
  ]),
  neon: _palette([
    ['H', '#ffffff', '#aaaaaa', 3],
    ['C', '#39ff14', '#0d8a05', 6],
    ['N', '#1f7afe', '#0a3a8c', 6],
    ['O', '#ff2d2d', '#7c0c0c', 6],
    ['P', '#ff8c00', '#7c4500', 6],
    ['S', '#fff200', '#807300', 7],
    ['F', '#80ffd0', '#207a55', 5],
    ['Cl','#a0ff40', '#467a10', 6],
  ]),
  monochrome: _palette([
    ['H', '#dddddd', '#888', 3],
    ['C', '#222', '#000', 6],
    ['N', '#444', '#111', 6],
    ['O', '#666', '#222', 6],
    ['P', '#777', '#222', 6],
    ['S', '#888', '#222', 7],
    ['F', '#bbb', '#444', 5],
    ['Cl','#aaa', '#333', 6],
  ]),
  jewel: _palette([
    ['H', '#f5f5f5', '#aaa', 3],
    ['C', '#34495e', '#1a2733', 6],
    ['N', '#9b59b6', '#532b6c', 6],
    ['O', '#e74c3c', '#7c1d12', 6],
    ['P', '#e67e22', '#6f3a0e', 6],
    ['S', '#f1c40f', '#7d6510', 7],
    ['F', '#16a085', '#0d4f41', 5],
    ['Cl','#27ae60', '#0f5a30', 6],
  ]),
};

export function getAtomStyle(palette, element) {
  return palette[element] || palette._default;
}

export function molecularMass(def) {
  if (!def || !def.atoms) return 1;
  return def.atoms.reduce((s, [el]) => s + (ATOMIC_MASS[el] || 12), 0);
}
