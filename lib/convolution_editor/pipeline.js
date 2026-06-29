// lib/convolution_editor/pipeline.js
//
// Pipeline layer for the image editor: the node REGISTRY, node execution, and
// presets. This sits between the pure filters in `./filters.js` and the React
// UI page. It is still framework-free — no React — so the same definitions can
// describe both how a node runs (its filter call) and how its config form is
// rendered (its declarative `fields`).

import {
  grayscale,
  thresholdAbsolute,
  thresholdAdaptive,
  gaussianBlur,
  convolve,
  upscale,
  erode,
  dilate,
  KERNEL_TEMPLATES,
} from './filters.js';

// ---------------------------------------------------------------------------
// Node registry
// ---------------------------------------------------------------------------
//
// Each node type declares:
//   label       – display name.
//   defaultConfig() – fresh default parameters.
//   fields      – declarative form schema so the config modal is generic
//                 (the Convolution node renders an extra custom kernel editor).
//   run(img, cfg, ctx) – pure operator returning { imageData, message }.
//
// `ctx` carries the global padding config so individual operators can default
// to it: ctx.padding = { mode, color }.

export const NODE_DEFS = {
  grayscale: {
    label: 'Grayscale',
    defaultConfig: () => ({ method: 'luminance' }),
    fields: [
      { key: 'method', label: 'Method', type: 'select',
        options: [
          { value: 'luminance', label: 'Luminance (Rec.709)' },
          { value: 'average', label: 'Average' },
          { value: 'lightness', label: 'Lightness (HSL)' },
        ] },
    ],
    run: (img, cfg) => ({
      imageData: grayscale(img, cfg),
      message: 'Grayscale complete',
    }),
  },

  threshold: {
    label: 'Binary Thresholding',
    defaultConfig: () => ({ adaptive: true, threshold: 128, window: 25, offset: 10, invert: false }),
    fields: [
      { key: 'adaptive', label: 'Adaptive threshold', type: 'checkbox' },
      { key: 'threshold', label: 'Absolute threshold (0–255)', type: 'number',
        min: 0, max: 255, step: 1, showIf: (c) => !c.adaptive },
      { key: 'window', label: 'Adaptive window width (px)', type: 'number',
        min: 3, max: 199, step: 2, showIf: (c) => c.adaptive },
      { key: 'offset', label: 'Adaptive offset / sensitivity', type: 'number',
        min: -50, max: 50, step: 1, showIf: (c) => c.adaptive },
      { key: 'invert', label: 'Invert polarity (swap black/white)', type: 'checkbox' },
    ],
    run: (img, cfg) => {
      if (cfg.adaptive) {
        return {
          imageData: thresholdAdaptive(img, cfg),
          message: 'Adaptive threshold complete',
        };
      }
      return {
        imageData: thresholdAbsolute(img, cfg),
        message: 'Threshold complete',
      };
    },
  },

  gaussian: {
    label: 'Gaussian Blur',
    defaultConfig: () => ({ kernelSize: 5, sigma: 0 }),
    fields: [
      { key: 'kernelSize', label: 'Kernel size (odd)', type: 'number', min: 1, max: 31, step: 2 },
      { key: 'sigma', label: 'Sigma (0 = auto)', type: 'number', min: 0, max: 20, step: 0.1 },
    ],
    run: (img, cfg, ctx) => ({
      imageData: gaussianBlur(img, { ...cfg, padding: ctx.padding }),
      message: 'Gaussian blur complete',
    }),
  },

  upscale: {
    label: 'Upscale',
    defaultConfig: () => ({ method: 'nearest', scale: 2 }),
    fields: [
      { key: 'method', label: 'Method', type: 'select',
        options: [
          { value: 'nearest', label: 'Nearest neighbor' },
          { value: 'bilinear', label: 'Bilinear' },
        ] },
      { key: 'scale', label: 'Scale factor', type: 'number', min: 1, max: 8, step: 0.5 },
    ],
    run: (img, cfg) => {
      const out = upscale(img, cfg);
      return {
        imageData: out,
        message: `Upscale complete (${cfg.scale}× → ${out.width}×${out.height})`,
      };
    },
  },

  erosion: {
    label: 'Erosion',
    defaultConfig: () => ({ kernelSize: 3 }),
    fields: [
      { key: 'kernelSize', label: 'Kernel size (odd)', type: 'number', min: 1, max: 25, step: 2 },
    ],
    run: (img, cfg, ctx) => ({
      imageData: erode(img, { ...cfg, padding: ctx.padding }),
      message: 'Erosion complete',
    }),
  },

  dilation: {
    label: 'Dilation',
    defaultConfig: () => ({ kernelSize: 3 }),
    fields: [
      { key: 'kernelSize', label: 'Kernel size (odd)', type: 'number', min: 1, max: 25, step: 2 },
    ],
    run: (img, cfg, ctx) => ({
      imageData: dilate(img, { ...cfg, padding: ctx.padding }),
      message: 'Dilation complete',
    }),
  },

  convolution: {
    label: 'Convolution',
    defaultConfig: () => KERNEL_TEMPLATES.sharpen.make(),
    // The kernel grid itself is rendered by a dedicated editor in the page;
    // these fields cover the surrounding flags.
    fields: [
      { key: 'normalize', label: 'Normalize (÷ sum of weights)', type: 'checkbox' },
      { key: 'clamp', label: 'Clamp output to 0–255', type: 'checkbox' },
      { key: 'abs', label: 'Absolute value', type: 'checkbox' },
    ],
    run: (img, cfg, ctx) => ({
      imageData: convolve(img, { ...cfg, padding: ctx.padding }),
      message: 'Convolution complete',
    }),
  },

  mask: {
    label: 'Masking / Unmasking',
    defaultConfig: () => ({ mode: 'protect', rects: [] }),
    fields: [
      { key: 'mode', label: 'Mode', type: 'select',
        options: [
          { value: 'protect', label: 'Protect masked region from processing' },
          { value: 'process-only', label: 'Process only the masked region' },
        ] },
    ],
    // A mask node does not change pixels itself; it activates masking for the
    // nodes that follow. The runner reads cfg.rects / cfg.mode from ctx.
    run: (img, cfg) => ({
      imageData: img,
      message: `Mask set (${cfg.rects ? cfg.rects.length : 0} region${(cfg.rects && cfg.rects.length === 1) ? '' : 's'}, ${cfg.mode})`,
    }),
  },
};

// Order shown in the "add node" picker.
export const NODE_TYPE_ORDER = [
  'grayscale', 'threshold', 'gaussian', 'upscale',
  'erosion', 'dilation', 'convolution', 'mask',
];

// ---------------------------------------------------------------------------
// Pipeline node execution
// ---------------------------------------------------------------------------

// Run a single node. Pure with respect to the input ImageData (operators
// clone). Throws on unknown node types so the runner can flag an error state.
export function executeNode(imageData, node, ctx) {
  const def = NODE_DEFS[node.type];
  if (!def) throw new Error(`Unknown node type: ${node.type}`);
  return def.run(imageData, node.config || {}, ctx || {});
}

// Create a new pipeline node with sensible defaults.
let nodeCounter = 0;
export function makeNode(type) {
  const def = NODE_DEFS[type];
  if (!def) throw new Error(`Unknown node type: ${type}`);
  nodeCounter += 1;
  return {
    id: `node-${Date.now()}-${nodeCounter}`,
    type,
    enabled: true,
    config: def.defaultConfig(),
    status: 'idle',
    progress: 0,
    message: '',
  };
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------
//
// Each preset is a list of { type, config } entries. `makePreset` expands them
// into full pipeline nodes ready to drop into the editor.

export const PRESETS = {
  binary_upscale: {
    label: 'Binary image upscaling',
    description: 'Grayscale → adaptive threshold → light cleanup → nearest-neighbor upscale.',
    nodes: [
      { type: 'grayscale', config: { method: 'luminance' } },
      { type: 'threshold', config: { adaptive: true, threshold: 128, window: 25, offset: 10, invert: false } },
      { type: 'erosion', config: { kernelSize: 3 } },
      { type: 'upscale', config: { method: 'nearest', scale: 3 } },
    ],
  },
  scan_cleanup: {
    label: 'Scan cleanup',
    description: 'Grayscale → adaptive threshold → dilation to thicken faint ink.',
    nodes: [
      { type: 'grayscale', config: { method: 'luminance' } },
      { type: 'threshold', config: { adaptive: true, threshold: 128, window: 31, offset: 12, invert: false } },
      { type: 'dilation', config: { kernelSize: 3 } },
      { type: 'erosion', config: { kernelSize: 3 } },
    ],
  },
  line_reconnect: {
    label: 'Line reconnect',
    description: 'Grayscale → threshold → dilation → erosion (close gaps) → upscale.',
    nodes: [
      { type: 'grayscale', config: { method: 'luminance' } },
      { type: 'threshold', config: { adaptive: false, threshold: 140, window: 25, offset: 10, invert: false } },
      { type: 'dilation', config: { kernelSize: 3 } },
      { type: 'erosion', config: { kernelSize: 3 } },
      { type: 'upscale', config: { method: 'nearest', scale: 2 } },
    ],
  },
  conv_playground: {
    label: 'Custom convolution playground',
    description: 'Grayscale → editable convolution kernel.',
    nodes: [
      { type: 'grayscale', config: { method: 'luminance' } },
      { type: 'convolution', config: KERNEL_TEMPLATES.sharpen.make() },
    ],
  },
};

export const PRESET_ORDER = ['binary_upscale', 'scan_cleanup', 'line_reconnect', 'conv_playground'];

// Expand a preset key into a list of ready-to-use pipeline nodes.
export function makePreset(key) {
  const preset = PRESETS[key];
  if (!preset) return [];
  return preset.nodes.map((n) => {
    const node = makeNode(n.type);
    node.config = { ...node.config, ...n.config };
    return node;
  });
}
