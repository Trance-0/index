// Public surface of the convolution-editor library.
//
// `filters.js`  – pure, framework-free image FILTERS (pixel math).
// `pipeline.js` – node registry, node execution and presets that wire those
//                 filters into a configurable pipeline.
// The React page imports from this barrel.

export {
  // padding / color
  DEFAULT_PADDING,
  parseHexColor,
  // ImageData utilities
  createImageData,
  cloneImageData,
  loadImageData,
  drawImageDataToCanvas,
  imageDataToBlob,
  // filters
  grayscale,
  thresholdAbsolute,
  thresholdAdaptive,
  gaussianKernel1D,
  gaussianBlur,
  convolve,
  upscale,
  erode,
  dilate,
  // masking
  isInsideRects,
  compositeMask,
  // kernel templates
  KERNEL_TEMPLATES,
} from './filters.js';

export {
  NODE_DEFS,
  NODE_TYPE_ORDER,
  executeNode,
  makeNode,
  PRESETS,
  PRESET_ORDER,
  makePreset,
} from './pipeline.js';
