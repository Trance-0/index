// Discrete colormap presets used to assign distinct colors to multi-selected
// tracked particles. The renderer cycles a per-tracked index through one of
// these presets when more than one particle is being tracked.

export const COLORMAP_PRESETS = {
  white: { name: 'White (single)', colors: ['#ffffff'] },
  tab10: {
    name: 'Tab 10',
    colors: [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    ],
  },
  set2: {
    name: 'Set 2',
    colors: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
  },
  pastel: {
    name: 'Pastel',
    colors: ['#ff9aa2', '#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7', '#c7ceea', '#cbb4d4', '#fae3d9'],
  },
  neon: {
    name: 'Neon',
    colors: ['#39ff14', '#ff00ff', '#00ffff', '#ffff00', '#ff6ec7', '#ff8c00', '#7df9ff', '#caff70'],
  },
  warm: {
    name: 'Warm',
    colors: ['#ff5252', '#ff7b00', '#ffba08', '#f48c06', '#dc2f02', '#9d0208'],
  },
  cool: {
    name: 'Cool',
    colors: ['#48cae4', '#0096c7', '#0077b6', '#023e8a', '#90e0ef', '#caf0f8'],
  },
};

export const DEFAULT_COLORMAP = 'tab10';

export function colormapColor(presetKey, index) {
  const preset = COLORMAP_PRESETS[presetKey] || COLORMAP_PRESETS[DEFAULT_COLORMAP];
  const colors = preset.colors;
  if (!colors.length) return '#ffffff';
  return colors[((index % colors.length) + colors.length) % colors.length];
}
