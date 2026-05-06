// Default reaction presets.
// Two presets are shipped: TCA (citric-acid cycle) and a tiny demo.
// Each preset has: defs, bimol, unimol, spawnable.

export const TCA_DEFS = {
  h2o: {
    atoms: [['O', 0, 0], ['H', -6, 4], ['H', 6, 4]],
    bonds: [[0, 1, 1], [0, 2, 1]], r: 8,
  },
  co2: {
    atoms: [['O', -8, 0], ['C', 0, 0], ['O', 8, 0]],
    bonds: [[0, 1, 2], [1, 2, 2]], r: 10,
  },
  acetyl_coa: {
    atoms: [
      ['C', -18, 0], ['C', -10, 0], ['O', -10, -8],
      ['S', -2, 0], ['C', 6, 0], ['N', 12, 6], ['P', 12, -6],
    ],
    bonds: [[0, 1, 1], [1, 2, 2], [1, 3, 1], [3, 4, 1], [4, 5, 1], [4, 6, 1]],
    r: 18,
  },
  oxaloacetate: {
    atoms: [
      ['O', -18, -5], ['O', -18, 5], ['C', -12, 0],
      ['C', -4, 0], ['O', -4, -8],
      ['C', 4, 0], ['C', 12, 0],
      ['O', 18, -5], ['O', 18, 5],
    ],
    bonds: [[0, 2, 2], [1, 2, 1], [2, 3, 1], [3, 4, 2], [3, 5, 1], [5, 6, 1], [6, 7, 2], [6, 8, 1]],
    r: 18,
  },
  citrate: {
    atoms: [
      ['C', 0, -10], ['O', -6, -16], ['O', 6, -16],
      ['C', 0, -2], ['O', 7, -2],
      ['C', -8, 4], ['C', 8, 4],
      ['C', -14, 12], ['O', -20, 8], ['O', -20, 16],
      ['C', 14, 12], ['O', 20, 8], ['O', 20, 16],
    ],
    bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [3, 4, 1], [3, 5, 1], [3, 6, 1],
            [5, 7, 1], [7, 8, 2], [7, 9, 1], [6, 10, 1], [10, 11, 2], [10, 12, 1]],
    r: 22,
  },
  isocitrate: {
    atoms: [
      ['C', -2, -10], ['O', -8, -16], ['O', 4, -16],
      ['C', -2, -2],
      ['C', -10, 4], ['O', -2, 6],
      ['C', 6, 4],
      ['C', -16, 12], ['O', -22, 8], ['O', -22, 16],
      ['C', 14, 12], ['O', 20, 8], ['O', 20, 16],
    ],
    bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [3, 4, 1], [4, 5, 1], [3, 6, 1],
            [4, 7, 1], [7, 8, 2], [7, 9, 1], [6, 10, 1], [10, 11, 2], [10, 12, 1]],
    r: 22,
  },
  alpha_kg: {
    atoms: [
      ['O', -18, -5], ['O', -18, 5], ['C', -12, 0],
      ['C', -4, 0], ['O', -4, -8],
      ['C', 4, 4], ['C', 12, 0],
      ['O', 18, -5], ['O', 18, 5],
    ],
    bonds: [[0, 2, 2], [1, 2, 1], [2, 3, 1], [3, 4, 2], [3, 5, 1], [5, 6, 1], [6, 7, 2], [6, 8, 1]],
    r: 18,
  },
  succinyl_coa: {
    atoms: [
      ['O', -22, -5], ['O', -22, 5], ['C', -16, 0],
      ['C', -8, 0], ['C', 0, 0],
      ['S', 8, 0], ['C', 14, 0], ['N', 18, 6], ['P', 18, -6],
    ],
    bonds: [[0, 2, 2], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 1], [6, 7, 1], [6, 8, 1]],
    r: 20,
  },
  succinate: {
    atoms: [
      ['O', -18, -5], ['O', -18, 5], ['C', -12, 0],
      ['C', -4, 0], ['C', 4, 0], ['C', 12, 0],
      ['O', 18, -5], ['O', 18, 5],
    ],
    bonds: [[0, 2, 2], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 6, 2], [5, 7, 1]],
    r: 18,
  },
  fumarate: {
    atoms: [
      ['O', -18, -5], ['O', -18, 5], ['C', -12, 0],
      ['C', -4, 0], ['C', 4, 0], ['C', 12, 0],
      ['O', 18, -5], ['O', 18, 5],
    ],
    bonds: [[0, 2, 2], [1, 2, 1], [2, 3, 1], [3, 4, 2], [4, 5, 1], [5, 6, 2], [5, 7, 1]],
    r: 18,
  },
  malate: {
    atoms: [
      ['O', -18, -5], ['O', -18, 5], ['C', -12, 0],
      ['C', -4, 0], ['O', -4, -7],
      ['C', 4, 0], ['C', 12, 0],
      ['O', 18, -5], ['O', 18, 5],
    ],
    bonds: [[0, 2, 2], [1, 2, 1], [2, 3, 1], [3, 4, 1], [3, 5, 1], [5, 6, 1], [6, 7, 2], [6, 8, 1]],
    r: 18,
  },
  coa_sh: {
    atoms: [['S', -8, 0], ['C', 0, 0], ['N', 6, -5], ['P', 6, 5], ['H', -14, 0]],
    bonds: [[0, 1, 1], [1, 2, 1], [1, 3, 1], [0, 4, 1]],
    r: 12,
  },
  nad_plus: {
    atoms: [['N', -6, 0], ['C', 0, 0], ['P', 6, -4], ['O', 6, 4], ['C', 12, 0]],
    bonds: [[0, 1, 1], [1, 2, 1], [1, 3, 1], [1, 4, 1]],
    r: 12,
  },
  fad: {
    atoms: [['N', -10, -4], ['N', -10, 4], ['C', -4, 0], ['C', 4, 0], ['P', 10, -4], ['O', 10, 4]],
    bonds: [[0, 2, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [3, 5, 1]],
    r: 12,
  },
  gdp: {
    atoms: [['C', -8, 0], ['O', -2, -4], ['P', 4, 0], ['O', 4, -7], ['P', 12, 0], ['O', 12, -7]],
    bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 2], [2, 4, 1], [4, 5, 2]],
    r: 14,
  },
  pi: {
    atoms: [['P', 0, 0], ['O', -7, 0], ['O', 7, 0], ['O', 0, -7], ['O', 0, 7]],
    bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 2], [0, 4, 1]],
    r: 10,
  },
};

export const TCA_BIMOL = [
  { a: 'acetyl_coa', b: 'oxaloacetate', products: ['citrate', 'coa_sh'], pictogram: 'plus' },
  { a: 'alpha_kg',   b: 'coa_sh',       products: ['succinyl_coa', 'co2'], pictogram: 'co2_up' },
  { a: 'fumarate',   b: 'h2o',          products: ['malate'], pictogram: 'h2o_in' },
];

export const TCA_UNIMOL = [
  { kind: 'citrate',      minAge: 4, maxAge: 8, products: ['isocitrate'],          pictogram: 'rotate' },
  { kind: 'isocitrate',   minAge: 3, maxAge: 6, products: ['alpha_kg', 'co2'],     pictogram: 'co2_up' },
  { kind: 'succinyl_coa', minAge: 3, maxAge: 6, products: ['succinate', 'coa_sh'], pictogram: 'arrow' },
  { kind: 'succinate',    minAge: 3, maxAge: 6, products: ['fumarate'],            pictogram: 'h2_up' },
  { kind: 'malate',       minAge: 3, maxAge: 6, products: ['oxaloacetate'],        pictogram: 'h2_up' },
];

export const TCA_SPAWNABLE = [
  'acetyl_coa', 'oxaloacetate', 'h2o', 'coa_sh',
  'nad_plus', 'fad', 'gdp', 'pi',
];

export const PRESETS = {
  tca: {
    name: 'Citric-acid cycle',
    defs: TCA_DEFS,
    bimol: TCA_BIMOL,
    unimol: TCA_UNIMOL,
    spawnable: TCA_SPAWNABLE,
  },
};

export const DEFAULT_PRESET_KEY = 'tca';
