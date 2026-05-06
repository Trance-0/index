// Small molecule preview, suitable for embedding inside an analytics table.

import { getAtomStyle } from './atoms';

export function drawMoleculePreview(canvas, def, {
  palette,
  bgColor = '#ffffff',
  bondColor = 'rgba(60,60,60,0.55)',
  scale = 0.7,
  pad = 4,
} = {}) {
  if (!canvas || !def) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  const atoms = def.atoms || [];
  if (!atoms.length) return;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [, dx, dy] of atoms) {
    if (dx < minX) minX = dx;
    if (dx > maxX) maxX = dx;
    if (dy < minY) minY = dy;
    if (dy > maxY) maxY = dy;
  }
  const span = Math.max(maxX - minX, maxY - minY, 1);
  const fit = Math.min((W - pad * 2) / span, (H - pad * 2) / span) * scale;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(fit, fit);
  ctx.translate(-cx, -cy);

  ctx.strokeStyle = bondColor;
  ctx.lineWidth = 1.4 / fit;
  for (const [i, j, order] of def.bonds || []) {
    const A = atoms[i], B = atoms[j];
    if (!A || !B) continue;
    if (order === 2) {
      const dx = B[1] - A[1], dy = B[2] - A[2];
      const d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d * 1.6, ny = dx / d * 1.6;
      ctx.beginPath();
      ctx.moveTo(A[1] + nx, A[2] + ny); ctx.lineTo(B[1] + nx, B[2] + ny);
      ctx.moveTo(A[1] - nx, A[2] - ny); ctx.lineTo(B[1] - nx, B[2] - ny);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(A[1], A[2]); ctx.lineTo(B[1], B[2]);
      ctx.stroke();
    }
  }
  for (const [el, dx, dy] of atoms) {
    const pal = getAtomStyle(palette, el);
    ctx.fillStyle = pal.fill;
    ctx.strokeStyle = pal.stroke;
    ctx.lineWidth = 0.8 / fit;
    ctx.beginPath();
    ctx.arc(dx, dy, pal.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
