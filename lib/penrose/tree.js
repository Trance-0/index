// Lazy subdivision tree. Each node caches its children after the first
// subdivide, so repeated renders at the same or nearby views don't
// re-compute anything. Seed-changing params (thetaOffset, mirrorShift,
// seedR) invalidate the tree; divisions/zoom/pan do not.

import { PHI, BASE, C, cAdd, cSub, cDivS, cRect } from './geometry';

function makeNode(shape, v1, v2, v3) {
  return {
    shape, v1, v2, v3,
    children: null,
    minX: Math.min(v1.re, v2.re, v3.re),
    maxX: Math.max(v1.re, v2.re, v3.re),
    minY: Math.min(v1.im, v2.im, v3.im),
    maxY: Math.max(v1.im, v2.im, v3.im),
    maxEdge: Math.max(
      Math.hypot(v2.re - v1.re, v2.im - v1.im),
      Math.hypot(v3.re - v2.re, v3.im - v2.im),
      Math.hypot(v1.re - v3.re, v1.im - v3.im),
    ),
  };
}

function subdivideNode(node) {
  const { shape, v1, v2, v3 } = node;
  if (shape === 'thin') {
    const p1 = cAdd(v1, cDivS(cSub(v2, v1), PHI));
    node.children = [
      makeNode('thin', v3, p1, v2),
      makeNode('thicc', p1, v3, v1),
    ];
  } else {
    const p2 = cAdd(v2, cDivS(cSub(v1, v2), PHI));
    const p3 = cAdd(v2, cDivS(cSub(v3, v2), PHI));
    node.children = [
      makeNode('thicc', p3, v3, v1),
      makeNode('thicc', p2, p3, v2),
      makeNode('thin', p3, p2, v1),
    ];
  }
}

export function createPenroseTree(thetaOffset, mirrorShift, seedR = 1) {
  const roots = [];
  for (let i = 0; i < BASE * 2; i++) {
    const a2 = (2 * i - 1) * Math.PI / (BASE * 2) + thetaOffset;
    const a3 = (2 * i + 1) * Math.PI / (BASE * 2) + thetaOffset;
    let v2 = cRect(seedR, a2);
    let v3 = cRect(seedR, a3);
    if (((i + mirrorShift) % 2) === 0) {
      const tmp = v2; v2 = v3; v3 = tmp;
    }
    roots.push(makeNode('thin', C(0, 0), v2, v3));
  }
  return { roots, thetaOffset, mirrorShift, seedR };
}

export function collectVisibleTriangles(tree, {
  W, H, s,
  panX = 0, panY = 0, rotation = 0,
  maxDepth = 12,
  minPixelSize = 4,
}) {
  const cr = Math.cos(-rotation);
  const sr = Math.sin(-rotation);
  const toTile = (x, y) => {
    const ox = x - W / 2 - panX;
    const oy = y - H / 2 - panY;
    return { re: (cr * ox - sr * oy) / s, im: (sr * ox + cr * oy) / s };
  };
  const c1 = toTile(0, 0), c2 = toTile(W, 0), c3 = toTile(W, H), c4 = toTile(0, H);
  const minVX = Math.min(c1.re, c2.re, c3.re, c4.re);
  const maxVX = Math.max(c1.re, c2.re, c3.re, c4.re);
  const minVY = Math.min(c1.im, c2.im, c3.im, c4.im);
  const maxVY = Math.max(c1.im, c2.im, c3.im, c4.im);

  const minEdgeTile = minPixelSize / s;
  const output = [];
  const stack = [];
  for (const root of tree.roots) stack.push({ node: root, depth: 0 });
  while (stack.length > 0) {
    const { node, depth } = stack.pop();
    if (node.maxX < minVX || node.minX > maxVX || node.maxY < minVY || node.minY > maxVY) continue;
    if (depth >= maxDepth || node.maxEdge < minEdgeTile) {
      output.push(node);
      continue;
    }
    if (!node.children) subdivideNode(node);
    for (const child of node.children) stack.push({ node: child, depth: depth + 1 });
  }
  return output;
}
