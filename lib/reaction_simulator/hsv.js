// Lightweight color parsing + HSV adjustment used to recolour atom palettes.

export function parseColor(input) {
  if (typeof input !== 'string') return { r: 128, g: 128, b: 128, a: 1 };
  const s = input.trim();
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
  }
  const rgbMatch = s.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((p) => parseFloat(p.trim()));
    return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts[3] != null ? parts[3] : 1 };
  }
  return { r: 128, g: 128, b: 128, a: 1 };
}

export function rgbToHsv(r, g, b) {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
  }
  h = (h * 60 + 360) % 360;
  return [h, s, v];
}

export function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rr = 0, gg = 0, bb = 0;
  if (h < 60)       [rr, gg, bb] = [c, x, 0];
  else if (h < 120) [rr, gg, bb] = [x, c, 0];
  else if (h < 180) [rr, gg, bb] = [0, c, x];
  else if (h < 240) [rr, gg, bb] = [0, x, c];
  else if (h < 300) [rr, gg, bb] = [x, 0, c];
  else              [rr, gg, bb] = [c, 0, x];
  return [
    Math.round((rr + m) * 255),
    Math.round((gg + m) * 255),
    Math.round((bb + m) * 255),
  ];
}

// All three arguments are *additive* shifts. Hue is in degrees;
// saturation and value are in [-1, 1] and clipped to [0, 1] after addition.
export function applyHsvShift(color, hueShift = 0, satShift = 0, valShift = 0) {
  if (hueShift === 0 && satShift === 0 && valShift === 0) return color;
  const { r, g, b, a } = parseColor(color);
  const [h, s, v] = rgbToHsv(r, g, b);
  const [nr, ng, nb] = hsvToRgb(
    h + hueShift,
    Math.max(0, Math.min(1, s + satShift)),
    Math.max(0, Math.min(1, v + valShift)),
  );
  return a < 1 ? `rgba(${nr},${ng},${nb},${a})` : `rgb(${nr},${ng},${nb})`;
}

// Build an HSV-adjusted palette from a base palette (object keyed by element).
export function hsvAdjustPalette(palette, hueShift, satShift, valShift) {
  if (!palette) return palette;
  if (hueShift === 0 && satShift === 0 && valShift === 0) return palette;
  const out = {};
  for (const [el, style] of Object.entries(palette)) {
    if (!style || typeof style !== 'object') { out[el] = style; continue; }
    out[el] = {
      ...style,
      fill: applyHsvShift(style.fill, hueShift, satShift, valShift),
      stroke: applyHsvShift(style.stroke, hueShift, satShift, valShift),
    };
  }
  return out;
}
