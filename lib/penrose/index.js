// Public surface of the penrose library.

export { PHI, BASE, APOTHEM, C, cAdd, cSub, cDivS, cRect } from './geometry';
export { generateTriangles, generateAdaptiveTriangles } from './triangles';
export { createPenroseTree, collectVisibleTriangles } from './tree';
export { drawPenrose, getDefaultColors } from './draw';
export { default as PenroseBackground } from './background';
