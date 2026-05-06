// Tiny canvas-drawn icons for the reaction badges.
// Glyph keys must match values used in BIMOL/UNIMOL `pictogram` fields.

export function drawPictogram(ctx, name, x, y, alpha = 1, color = '#222') {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.4;

  switch (name) {
    case 'plus':
      ctx.beginPath();
      ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y);
      ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5);
      ctx.stroke();
      break;
    case 'arrow':
      ctx.beginPath();
      ctx.moveTo(x - 6, y); ctx.lineTo(x + 5, y);
      ctx.moveTo(x + 5, y); ctx.lineTo(x + 1, y - 3);
      ctx.moveTo(x + 5, y); ctx.lineTo(x + 1, y + 3);
      ctx.stroke();
      break;
    case 'rotate':
      ctx.beginPath();
      ctx.arc(x, y, 5, Math.PI * 0.2, Math.PI * 1.7, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 4, y - 3); ctx.lineTo(x + 5, y + 1);
      ctx.lineTo(x + 1, y);
      ctx.stroke();
      break;
    case 'co2_up': {
      const cy = y + 2;
      ctx.fillStyle = '#c1574c';
      ctx.beginPath(); ctx.arc(x - 5, cy, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 5, cy, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5e5e5e';
      ctx.beginPath(); ctx.arc(x, cy, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 5); ctx.lineTo(x, y - 8); ctx.lineTo(x + 4, y - 5);
      ctx.stroke();
      break;
    }
    case 'h2o_in': {
      ctx.fillStyle = '#c1574c';
      ctx.beginPath(); ctx.arc(x, y - 1, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#dcdcdc';
      ctx.strokeStyle = '#888';
      ctx.beginPath(); ctx.arc(x - 4, y + 3, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 4, y + 3, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 5); ctx.lineTo(x, y - 2); ctx.lineTo(x + 4, y - 5);
      ctx.stroke();
      break;
    }
    case 'h2_up': {
      ctx.fillStyle = '#dcdcdc';
      ctx.strokeStyle = '#888';
      ctx.beginPath(); ctx.arc(x - 3, y + 2, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 3, y + 2, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 4); ctx.lineTo(x, y - 7); ctx.lineTo(x + 4, y - 4);
      ctx.stroke();
      break;
    }
    default:
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.stroke();
  }
  ctx.restore();
}
