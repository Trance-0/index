// lib/convolution_editor/filters.js
//
// Pure browser-side image FILTERS for the line-art upscaling demo.
//
// Everything in this file is plain JavaScript operating on Canvas `ImageData`
// and typed arrays. There is no React, no DOM framework state, and no ML — only
// pixel math. The pipeline layer (`./pipeline.js`) wires these filters into
// configurable nodes, and the React page drives that pipeline.
//
// Conventions used throughout:
//   * Images are RGBA `ImageData` (`data` is a Uint8ClampedArray, 4 bytes/px).
//   * "Foreground" for morphology is BLACK ink (low luminance), matching
//     scanned line art on white paper.
//   * Operators are pure: they read an input `ImageData` and return a NEW
//     `ImageData`, never mutating the input. This keeps the pipeline easy to
//     re-run and lets the mask compositor diff before/after buffers.

// ---------------------------------------------------------------------------
// Padding / border handling
// ---------------------------------------------------------------------------
//
// Convolution, blur and morphology all need to read pixels outside the image
// border. Two modes are supported globally (and can be overridden per node):
//   * 'edge'     – clamp the coordinate to the nearest valid pixel (replicate).
//   * 'constant' – use a fixed pad color (default white, like blank paper).

export const DEFAULT_PADDING = { mode: 'edge', color: '#ffffff' };

// Parse a "#rrggbb" string into [r,g,b,a]. Falls back to white on bad input.
export function parseHexColor(hex) {
  if (typeof hex !== 'string') return [255, 255, 255, 255];
  const m = hex.trim().replace('#', '');
  if (m.length === 3) {
    const r = parseInt(m[0] + m[0], 16);
    const g = parseInt(m[1] + m[1], 16);
    const b = parseInt(m[2] + m[2], 16);
    return [r, g, b, 255];
  }
  if (m.length === 6) {
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return [r, g, b, 255];
  }
  return [255, 255, 255, 255];
}

// Read one channel value at (x, y), applying the padding rule when the
// coordinate is out of bounds. `padRGBA` is a pre-parsed [r,g,b,a] array.
function sampleChannel(data, w, h, x, y, c, padMode, padRGBA) {
  if (x >= 0 && x < w && y >= 0 && y < h) {
    return data[(y * w + x) * 4 + c];
  }
  if (padMode === 'constant') {
    return padRGBA[c];
  }
  // 'edge': clamp into range and replicate the border pixel.
  const cx = x < 0 ? 0 : x >= w ? w - 1 : x;
  const cy = y < 0 ? 0 : y >= h ? h - 1 : y;
  return data[(cy * w + cx) * 4 + c];
}

// ---------------------------------------------------------------------------
// ImageData utilities (load / convert / clone / export)
// ---------------------------------------------------------------------------

// Create an empty ImageData of the given size (works in browser only).
export function createImageData(w, h) {
  return new ImageData(w, h);
}

// Deep-copy an ImageData so operators stay non-destructive.
export function cloneImageData(src) {
  const out = new ImageData(src.width, src.height);
  out.data.set(src.data);
  return out;
}

// Load an image source (object URL / data URL) into ImageData. Very large
// images are downscaled so browser processing stays responsive; the scale
// factor that was applied is returned for callers that care.
export function loadImageData(src, maxDim = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width: w, height: h } = img;
      let scale = 1;
      if (maxDim && Math.max(w, h) > maxDim) {
        scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ imageData: ctx.getImageData(0, 0, w, h), scale });
    };
    img.onerror = () => reject(new Error('Could not decode the selected image.'));
    img.src = src;
  });
}

// Draw ImageData onto a canvas element, resizing the canvas to match.
export function drawImageDataToCanvas(canvas, imageData) {
  if (!canvas || !imageData) return;
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.putImageData(imageData, 0, 0);
}

// Convert ImageData to a PNG Blob via an offscreen canvas (for download).
export function imageDataToBlob(imageData, type = 'image/png') {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    canvas.toBlob((blob) => resolve(blob), type);
  });
}

// ---------------------------------------------------------------------------
// Grayscale
// ---------------------------------------------------------------------------
//
// Collapses color into a single intensity written to R, G and B (alpha kept).
//   * luminance – Rec.709 perceptual weights (best default for line art).
//   * average   – simple mean of the three channels.
//   * lightness – (max + min) / 2, the HSL lightness.

export function grayscale(src, { method = 'luminance' } = {}) {
  const out = cloneImageData(src);
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    let v;
    if (method === 'average') {
      v = (r + g + b) / 3;
    } else if (method === 'lightness') {
      v = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    } else {
      v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Thresholding
// ---------------------------------------------------------------------------

// Absolute threshold: every pixel becomes pure black or pure white based on a
// single global cutoff. `invert` swaps which side becomes black (polarity).
export function thresholdAbsolute(src, { threshold = 128, invert = false } = {}) {
  const out = cloneImageData(src);
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    let on = lum < threshold; // dark pixel -> ink (black) by default
    if (invert) on = !on;
    const v = on ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  return out;
}

// Adaptive (local mean) threshold. For each pixel we compare its luminance to
// the mean of a square window around it, minus an offset. This handles uneven
// lighting from phone photos / scans where a single global cutoff fails.
//
// The window mean is computed with a summed-area table (integral image) so the
// cost is O(width*height) regardless of window size.
export function thresholdAdaptive(src, { window = 25, offset = 10, invert = false } = {}) {
  const w = src.width, h = src.height;
  const sd = src.data;
  const out = cloneImageData(src);
  const od = out.data;

  // Per-pixel luminance in a flat Float64 buffer.
  const lum = new Float64Array(w * h);
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    lum[p] = 0.2126 * sd[i] + 0.7152 * sd[i + 1] + 0.0722 * sd[i + 2];
  }

  // Integral image with a 1-pixel zero border so window sums are branch-free.
  const iw = w + 1;
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 1; y <= h; y++) {
    let rowSum = 0;
    for (let x = 1; x <= w; x++) {
      rowSum += lum[(y - 1) * w + (x - 1)];
      integral[y * iw + x] = integral[(y - 1) * iw + x] + rowSum;
    }
  }

  const r = Math.max(1, Math.floor(window / 2));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r);
      const x1 = Math.min(w - 1, x + r), y1 = Math.min(h - 1, y + r);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      // Sum over the window via the four integral-image corners.
      const sum =
        integral[(y1 + 1) * iw + (x1 + 1)] -
        integral[y0 * iw + (x1 + 1)] -
        integral[(y1 + 1) * iw + x0] +
        integral[y0 * iw + x0];
      const mean = sum / area;
      const p = y * w + x;
      let on = lum[p] < mean - offset; // darker than local mean -> ink
      if (invert) on = !on;
      const v = on ? 0 : 255;
      const i = p * 4;
      od[i] = od[i + 1] = od[i + 2] = v;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Convolution (separable Gaussian + arbitrary kernels)
// ---------------------------------------------------------------------------

// Build a normalized 1-D Gaussian kernel. When sigma <= 0 it is derived from
// the kernel size using the common OpenCV heuristic.
export function gaussianKernel1D(size, sigma) {
  const n = Math.max(1, size | 0);
  let s = sigma;
  if (!s || s <= 0) s = 0.3 * ((n - 1) * 0.5 - 1) + 0.8;
  const half = (n - 1) / 2;
  const k = new Float64Array(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = i - half;
    k[i] = Math.exp(-(x * x) / (2 * s * s));
    sum += k[i];
  }
  for (let i = 0; i < n; i++) k[i] /= sum;
  return k;
}

// Convolve each RGB channel with a 1-D kernel along one axis. `horizontal`
// selects the pass direction; alpha is passed through untouched. Used twice
// (H then V) for a fast separable Gaussian blur.
function convolveSeparable(src, kernel, horizontal, padMode, padRGBA) {
  const w = src.width, h = src.height;
  const sd = src.data;
  const out = cloneImageData(src);
  const od = out.data;
  const half = (kernel.length - 1) / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let acc0 = 0, acc1 = 0, acc2 = 0;
      for (let t = 0; t < kernel.length; t++) {
        const off = t - half;
        const sx = horizontal ? x + off : x;
        const sy = horizontal ? y : y + off;
        const wgt = kernel[t];
        acc0 += wgt * sampleChannel(sd, w, h, sx, sy, 0, padMode, padRGBA);
        acc1 += wgt * sampleChannel(sd, w, h, sx, sy, 1, padMode, padRGBA);
        acc2 += wgt * sampleChannel(sd, w, h, sx, sy, 2, padMode, padRGBA);
      }
      const i = (y * w + x) * 4;
      od[i] = acc0; od[i + 1] = acc1; od[i + 2] = acc2;
    }
  }
  return out;
}

// Separable Gaussian blur.
export function gaussianBlur(src, { kernelSize = 5, sigma = 0, padding } = {}) {
  const pad = padding || DEFAULT_PADDING;
  const padRGBA = parseHexColor(pad.color);
  let size = Math.max(1, kernelSize | 0);
  if (size % 2 === 0) size += 1; // force odd so the kernel has a center tap
  const k = gaussianKernel1D(size, sigma);
  const pass1 = convolveSeparable(src, k, true, pad.mode, padRGBA);
  return convolveSeparable(pass1, k, false, pad.mode, padRGBA);
}

// General 2-D convolution with a user-supplied kernel.
//   normalize – divide by the sum of weights (skipped when the sum is ~0).
//   abs       – take |value| before clamping (handy for edge kernels).
//   clamp     – clamp into [0,255]; when false values wrap via the
//               Uint8ClampedArray store (still clamped, but documented intent).
export function convolve(src, {
  width = 3, height = 3, weights = null,
  normalize = false, clamp = true, abs = false, padding,
} = {}) {
  const pad = padding || DEFAULT_PADDING;
  const padRGBA = parseHexColor(pad.color);
  const kw = Math.max(1, width | 0);
  const kh = Math.max(1, height | 0);
  const k = weights && weights.length === kw * kh
    ? weights
    : identityWeights(kw, kh);

  let norm = 1;
  if (normalize) {
    let s = 0;
    for (let i = 0; i < k.length; i++) s += k[i];
    norm = Math.abs(s) > 1e-6 ? s : 1;
  }

  const w = src.width, h = src.height;
  const sd = src.data;
  const out = cloneImageData(src);
  const od = out.data;
  const halfX = (kw - 1) / 2;
  const halfY = (kh - 1) / 2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let acc0 = 0, acc1 = 0, acc2 = 0;
      for (let ky = 0; ky < kh; ky++) {
        for (let kx = 0; kx < kw; kx++) {
          const wgt = k[ky * kw + kx];
          if (wgt === 0) continue;
          const sx = x + (kx - halfX);
          const sy = y + (ky - halfY);
          acc0 += wgt * sampleChannel(sd, w, h, sx, sy, 0, pad.mode, padRGBA);
          acc1 += wgt * sampleChannel(sd, w, h, sx, sy, 1, pad.mode, padRGBA);
          acc2 += wgt * sampleChannel(sd, w, h, sx, sy, 2, pad.mode, padRGBA);
        }
      }
      acc0 /= norm; acc1 /= norm; acc2 /= norm;
      if (abs) { acc0 = Math.abs(acc0); acc1 = Math.abs(acc1); acc2 = Math.abs(acc2); }
      if (clamp) {
        acc0 = acc0 < 0 ? 0 : acc0 > 255 ? 255 : acc0;
        acc1 = acc1 < 0 ? 0 : acc1 > 255 ? 255 : acc1;
        acc2 = acc2 < 0 ? 0 : acc2 > 255 ? 255 : acc2;
      }
      const i = (y * w + x) * 4;
      od[i] = acc0; od[i + 1] = acc1; od[i + 2] = acc2;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Upscale
// ---------------------------------------------------------------------------
//
// nearest  – pixel-perfect block scaling (keeps hard ink edges crisp).
// bilinear – weighted average of the 4 surrounding source pixels (smoother).

export function upscale(src, { method = 'nearest', scale = 2 } = {}) {
  const s = Math.max(1, Number(scale) || 1);
  const w = src.width, h = src.height;
  const dw = Math.max(1, Math.round(w * s));
  const dh = Math.max(1, Math.round(h * s));
  const sd = src.data;
  const out = new ImageData(dw, dh);
  const od = out.data;

  if (method === 'bilinear') {
    for (let y = 0; y < dh; y++) {
      // Map destination center back to source space.
      const fy = ((y + 0.5) / s) - 0.5;
      const y0 = Math.floor(fy);
      const wy = fy - y0;
      const y0c = Math.max(0, Math.min(h - 1, y0));
      const y1c = Math.max(0, Math.min(h - 1, y0 + 1));
      for (let x = 0; x < dw; x++) {
        const fx = ((x + 0.5) / s) - 0.5;
        const x0 = Math.floor(fx);
        const wx = fx - x0;
        const x0c = Math.max(0, Math.min(w - 1, x0));
        const x1c = Math.max(0, Math.min(w - 1, x0 + 1));
        const i00 = (y0c * w + x0c) * 4;
        const i01 = (y0c * w + x1c) * 4;
        const i10 = (y1c * w + x0c) * 4;
        const i11 = (y1c * w + x1c) * 4;
        const o = (y * dw + x) * 4;
        for (let c = 0; c < 4; c++) {
          const top = sd[i00 + c] * (1 - wx) + sd[i01 + c] * wx;
          const bot = sd[i10 + c] * (1 - wx) + sd[i11 + c] * wx;
          od[o + c] = top * (1 - wy) + bot * wy;
        }
      }
    }
  } else {
    // Nearest neighbor.
    for (let y = 0; y < dh; y++) {
      const sy = Math.min(h - 1, Math.floor(y / s));
      for (let x = 0; x < dw; x++) {
        const sx = Math.min(w - 1, Math.floor(x / s));
        const si = (sy * w + sx) * 4;
        const o = (y * dw + x) * 4;
        od[o] = sd[si]; od[o + 1] = sd[si + 1];
        od[o + 2] = sd[si + 2]; od[o + 3] = sd[si + 3];
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Morphology (erosion / dilation) — BLACK ink is the foreground
// ---------------------------------------------------------------------------
//
// We operate on luminance. With dark ink as the foreground on a light page:
//   * EROSION shrinks the ink. A pixel keeps ink only if EVERY pixel in the
//     window is ink, i.e. the output is the MAX luminance over the window.
//   * DILATION grows the ink. A pixel becomes ink if ANY window pixel is ink,
//     i.e. the output is the MIN luminance over the window.
// This greyscale min/max formulation works on both binary and grey images and
// is what reconnects broken strokes (dilate) or removes speckle (erode).

function morphology(src, kernelSize, takeMax, padding) {
  const pad = padding || DEFAULT_PADDING;
  const padRGBA = parseHexColor(pad.color);
  let k = Math.max(1, kernelSize | 0);
  if (k % 2 === 0) k += 1;
  const r = (k - 1) / 2;
  const w = src.width, h = src.height;
  const sd = src.data;

  // Precompute luminance with padding-aware sampling done inline below.
  const out = cloneImageData(src);
  const od = out.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let best = takeMax ? -Infinity : Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const rr = sampleChannel(sd, w, h, x + dx, y + dy, 0, pad.mode, padRGBA);
          const gg = sampleChannel(sd, w, h, x + dx, y + dy, 1, pad.mode, padRGBA);
          const bb = sampleChannel(sd, w, h, x + dx, y + dy, 2, pad.mode, padRGBA);
          const lum = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
          if (takeMax) { if (lum > best) best = lum; }
          else { if (lum < best) best = lum; }
        }
      }
      const i = (y * w + x) * 4;
      od[i] = od[i + 1] = od[i + 2] = best;
    }
  }
  return out;
}

// Erosion of black ink => local MAX luminance (ink retreats).
export function erode(src, { kernelSize = 3, padding } = {}) {
  return morphology(src, kernelSize, true, padding);
}

// Dilation of black ink => local MIN luminance (ink spreads).
export function dilate(src, { kernelSize = 3, padding } = {}) {
  return morphology(src, kernelSize, false, padding);
}

// ---------------------------------------------------------------------------
// Masking
// ---------------------------------------------------------------------------
//
// Masks are axis-aligned rectangles expressed in INPUT-image pixel space:
//   { x, y, w, h }.
//
// Per-node mask propagation is implemented by the pipeline runner: for each
// node that runs AFTER an active mask node, the runner snapshots the buffer,
// runs the node, then composites the result with `compositeMask` so only the
// intended region keeps the new pixels.
//
//   mode 'protect'      – masked region is PROTECTED from processing
//                         (inside = original, outside = processed).
//   mode 'process-only' – ONLY the masked region is processed
//                         (inside = processed, outside = original).
//
// LIMITATION (documented as allowed by the spec): masks live in source-pixel
// coordinates and `compositeMask` requires `before` and `after` to share the
// same dimensions. Nodes that change dimensions (Upscale) therefore bypass the
// mask compositor — the runner skips masking for any node whose output size
// differs from its input, rather than guessing how to remap the rectangles.

export function isInsideRects(x, y, rects) {
  if (!rects || !rects.length) return false;
  for (const r of rects) {
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return true;
  }
  return false;
}

// Combine a pre-node buffer and post-node buffer according to the mask mode.
// Returns a new ImageData. If sizes differ, masking is skipped (see note above)
// and `after` is returned unchanged.
export function compositeMask(before, after, mask) {
  if (!mask || !mask.rects || !mask.rects.length) return after;
  if (before.width !== after.width || before.height !== after.height) return after;
  const w = after.width, h = after.height;
  const bd = before.data, ad = after.data;
  const out = cloneImageData(after);
  const od = out.data;
  const protect = mask.mode !== 'process-only'; // default = protect
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inside = isInsideRects(x, y, mask.rects);
      // keepBefore = use the unprocessed pixel here.
      const keepBefore = protect ? inside : !inside;
      if (keepBefore) {
        const i = (y * w + x) * 4;
        od[i] = bd[i]; od[i + 1] = bd[i + 1];
        od[i + 2] = bd[i + 2]; od[i + 3] = bd[i + 3];
      }
    }
  }
  return out;
}

// Helper: identity kernel weights (1 in the center, 0 elsewhere).
function identityWeights(kw, kh) {
  const a = new Array(kw * kh).fill(0);
  a[Math.floor(kh / 2) * kw + Math.floor(kw / 2)] = 1;
  return a;
}

// ---------------------------------------------------------------------------
// Convolution kernel templates
// ---------------------------------------------------------------------------
//
// Each template returns a fresh config { width, height, weights, normalize,
// clamp, abs } so the kernel editor can load and then tweak it.

export const KERNEL_TEMPLATES = {
  identity: {
    label: 'Identity',
    make: () => ({ width: 3, height: 3, normalize: false, clamp: true, abs: false,
      weights: [0, 0, 0, 0, 1, 0, 0, 0, 0] }),
  },
  box_blur: {
    label: 'Box blur',
    make: () => ({ width: 3, height: 3, normalize: true, clamp: true, abs: false,
      weights: [1, 1, 1, 1, 1, 1, 1, 1, 1] }),
  },
  sharpen: {
    label: 'Sharpen',
    make: () => ({ width: 3, height: 3, normalize: false, clamp: true, abs: false,
      weights: [0, -1, 0, -1, 5, -1, 0, -1, 0] }),
  },
  edge_detect: {
    label: 'Edge detect',
    make: () => ({ width: 3, height: 3, normalize: false, clamp: true, abs: true,
      weights: [-1, -1, -1, -1, 8, -1, -1, -1, -1] }),
  },
  horizontal_bridge: {
    label: 'Horizontal line bridge',
    // Emphasizes horizontal continuity to reconnect broken horizontal strokes.
    make: () => ({ width: 3, height: 3, normalize: true, clamp: true, abs: false,
      weights: [0, 0, 0, 1, 1, 1, 0, 0, 0] }),
  },
  vertical_bridge: {
    label: 'Vertical line bridge',
    make: () => ({ width: 3, height: 3, normalize: true, clamp: true, abs: false,
      weights: [0, 1, 0, 0, 1, 0, 0, 1, 0] }),
  },
  laplacian: {
    label: 'Laplacian',
    make: () => ({ width: 3, height: 3, normalize: false, clamp: true, abs: true,
      weights: [0, 1, 0, 1, -4, 1, 0, 1, 0] }),
  },
  emboss: {
    label: 'Emboss',
    make: () => ({ width: 3, height: 3, normalize: false, clamp: true, abs: false,
      weights: [-2, -1, 0, -1, 1, 1, 0, 1, 2] }),
  },
};
