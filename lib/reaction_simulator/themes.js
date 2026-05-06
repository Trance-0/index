// Renderer themes: background gradient, atom palette, bond and badge styling.

export const THEMES = {
  daylight: {
    name: 'Daylight',
    background: {
      type: 'linear', angle: 90,
      stops: [
        { offset: 0, color: '#fef9c3' },
        { offset: 1, color: '#fde68a' },
      ],
    },
    palette: 'cpk',
    bond: 'rgba(60,60,60,0.55)',
    badge: { fill: 'rgba(255,255,255,0.92)', shadow: 'rgba(0,0,0,0.18)' },
    pictogramColor: '#222',
    text: '#1a1a1a',
  },
  midnight: {
    name: 'Midnight',
    background: {
      type: 'radial',
      stops: [
        { offset: 0, color: '#1f2952' },
        { offset: 1, color: '#070b1a' },
      ],
    },
    palette: 'neon',
    bond: 'rgba(220,220,220,0.55)',
    badge: { fill: 'rgba(220,225,230,0.85)', shadow: 'rgba(0,0,0,0.45)' },
    pictogramColor: '#222',
    text: '#dde7ff',
  },
  sepia: {
    name: 'Sepia',
    background: {
      type: 'linear', angle: 110,
      stops: [
        { offset: 0, color: '#f4e7c8' },
        { offset: 1, color: '#d9bb8a' },
      ],
    },
    palette: 'pastel',
    bond: 'rgba(80,55,30,0.55)',
    badge: { fill: 'rgba(255,250,235,0.92)', shadow: 'rgba(60,40,20,0.25)' },
    pictogramColor: '#3a2810',
    text: '#3a2810',
  },
  ocean: {
    name: 'Ocean',
    background: {
      type: 'linear', angle: 135,
      stops: [
        { offset: 0, color: '#0f3a5b' },
        { offset: 0.5, color: '#1e6091' },
        { offset: 1, color: '#56a4c4' },
      ],
    },
    palette: 'jewel',
    bond: 'rgba(220,235,245,0.6)',
    badge: { fill: 'rgba(245,250,255,0.9)', shadow: 'rgba(0,20,40,0.4)' },
    pictogramColor: '#0a2a44',
    text: '#e6f4fb',
  },
  monochrome: {
    name: 'Monochrome',
    background: {
      type: 'linear', angle: 0,
      stops: [
        { offset: 0, color: '#f5f5f5' },
        { offset: 1, color: '#e2e2e2' },
      ],
    },
    palette: 'monochrome',
    bond: 'rgba(0,0,0,0.65)',
    badge: { fill: 'rgba(255,255,255,0.95)', shadow: 'rgba(0,0,0,0.2)' },
    pictogramColor: '#000',
    text: '#000',
  },
  candy: {
    name: 'Candy',
    background: {
      type: 'radial',
      stops: [
        { offset: 0, color: '#ffe0f1' },
        { offset: 0.6, color: '#ffc6df' },
        { offset: 1, color: '#c19bff' },
      ],
    },
    palette: 'pastel',
    bond: 'rgba(110,70,140,0.55)',
    badge: { fill: 'rgba(255,255,255,0.92)', shadow: 'rgba(120,40,100,0.3)' },
    pictogramColor: '#5a2155',
    text: '#3d1140',
  },
};
