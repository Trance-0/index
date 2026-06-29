'use client'

// Interactive non-ML image-processing / upscaling demo for scanned line art.
//
// The page is purely the UI layer: pixel math lives in
// `lib/convolution_editor/filters.js` and the node registry / presets live in
// `lib/convolution_editor/pipeline.js`. Here we manage React state, the side-by-side
// viewer with a nearest-neighbor zoom lens, the vertical pipeline editor,
// add/config modals (including the custom convolution kernel editor), presets,
// and the async pipeline runner that updates per-node status / progress.

import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

import {
  NODE_DEFS,
  NODE_TYPE_ORDER,
  KERNEL_TEMPLATES,
  buildKernelTemplate,
  PRESETS,
  PRESET_ORDER,
  DEFAULT_PADDING,
  makeNode,
  makePreset,
  executeNode,
  compositeMask,
  loadImageData,
  drawImageDataToCanvas,
  imageDataToBlob,
} from '../../lib/convolution_editor';

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

const STATUS_STYLES = {
  idle: { label: 'idle', cls: 'bg-gray-400/60 text-white' },
  running: { label: 'running', cls: 'bg-blue-500/80 text-white' },
  done: { label: 'done', cls: 'bg-green-600/80 text-white' },
  error: { label: 'error', cls: 'bg-red-600/80 text-white' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.idle;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.cls}`}>{s.label}</span>;
}

function ProgressBar({ value, status }) {
  const color = status === 'error' ? 'bg-red-500' : status === 'done' ? 'bg-green-500' : 'bg-blue-500';
  return (
    <div className="w-full h-1.5 rounded bg-black/10 dark:bg-white/10 overflow-hidden">
      <div className={`h-full ${color} transition-all duration-200`} style={{ width: `${Math.round((value || 0) * 100)}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Side-by-side image viewer with mask overlays + hover reporting
// ---------------------------------------------------------------------------
//
// Renders one ImageData into a crisp (pixelated) canvas. Reports the normalized
// hover coordinate (u, v in 0..1) so the parent can drive a shared zoom lens.
// When `drawMode` is on, dragging produces rectangles in source-pixel space.

function ImageViewer({
  title, imageData, maskRects, draftRects, drawMode,
  onHover, onLeave, onAddRect,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [drag, setDrag] = useState(null); // {x0,y0,x1,y1} in source pixels

  useEffect(() => {
    if (canvasRef.current && imageData) drawImageDataToCanvas(canvasRef.current, imageData);
  }, [imageData]);

  // Map a client point {clientX, clientY} to integer source-pixel coordinates.
  // Works for both mouse and touch events.
  const toPixel = useCallback((pt) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData || !pt) return null;
    const rect = canvas.getBoundingClientRect();
    const u = (pt.clientX - rect.left) / rect.width;
    const v = (pt.clientY - rect.top) / rect.height;
    const cu = Math.max(0, Math.min(1, u));
    const cv = Math.max(0, Math.min(1, v));
    return {
      u: cu, v: cv,
      x: Math.floor(cu * imageData.width),
      y: Math.floor(cv * imageData.height),
    };
  }, [imageData]);

  // Pull a {clientX, clientY} from a mouse or touch event.
  const pointOf = (e) => (e.touches && e.touches[0]) ? e.touches[0] : e;

  const handleMove = (e) => {
    const p = toPixel(pointOf(e));
    if (!p) return;
    if (drawMode && drag) {
      // The canvas sets touch-action:none in draw mode, so the page won't
      // scroll while the rectangle is being dragged out.
      setDrag((d) => ({ ...d, x1: p.x, y1: p.y }));
    } else if (!drawMode && onHover) {
      onHover({ u: p.u, v: p.v, clientX: pointOf(e).clientX, clientY: pointOf(e).clientY });
    }
  };

  const handleDown = (e) => {
    if (!drawMode) return;
    const p = toPixel(pointOf(e));
    if (!p) return;
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };

  const handleUp = () => {
    if (drawMode && drag) {
      const x = Math.min(drag.x0, drag.x1);
      const y = Math.min(drag.y0, drag.y1);
      const w = Math.abs(drag.x1 - drag.x0);
      const h = Math.abs(drag.y1 - drag.y0);
      if (w > 2 && h > 2 && onAddRect) onAddRect({ x, y, w, h });
      setDrag(null);
    }
  };

  const nw = imageData ? imageData.width : 1;
  const nh = imageData ? imageData.height : 1;

  // Render a rectangle (source pixels) as a percentage-positioned overlay div.
  const rectStyle = (r) => ({
    left: `${(r.x / nw) * 100}%`,
    top: `${(r.y / nh) * 100}%`,
    width: `${(r.w / nw) * 100}%`,
    height: `${(r.h / nh) * 100}%`,
  });

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {imageData && <span className="text-xs text-secondary">{imageData.width}×{imageData.height}</span>}
      </div>
      <div
        ref={wrapRef}
        className="relative border rounded bg-[conic-gradient(#0001_90deg,transparent_90deg_180deg,#0001_180deg_270deg,transparent_270deg)] bg-[length:16px_16px] overflow-hidden"
        style={{ minHeight: 180 }}
      >
        {imageData ? (
          <>
            <canvas
              ref={canvasRef}
              onMouseMove={handleMove}
              onMouseLeave={() => { if (onLeave) onLeave(); }}
              onMouseDown={handleDown}
              onMouseUp={handleUp}
              onTouchStart={handleDown}
              onTouchMove={handleMove}
              onTouchEnd={handleUp}
              className="block w-full h-auto"
              style={{
                imageRendering: 'pixelated',
                cursor: drawMode ? 'crosshair' : 'zoom-in',
                // Disable browser touch gestures over the canvas while drawing
                // masks so a drag draws a rectangle instead of scrolling.
                touchAction: drawMode ? 'none' : 'auto',
              }}
            />
            {/* Persisted mask rectangles (faint) */}
            {(maskRects || []).map((r, i) => (
              <div key={`m${i}`} className="absolute border-2 border-amber-400/70 bg-amber-300/15 pointer-events-none" style={rectStyle(r)} />
            ))}
            {/* Draft rectangles for the mask node currently being edited */}
            {(draftRects || []).map((r, i) => (
              <div key={`d${i}`} className="absolute border-2 border-fuchsia-500/80 bg-fuchsia-400/20 pointer-events-none" style={rectStyle(r)} />
            ))}
            {/* Live drag rectangle */}
            {drag && (
              <div
                className="absolute border-2 border-fuchsia-500 bg-fuchsia-400/25 pointer-events-none"
                style={rectStyle({
                  x: Math.min(drag.x0, drag.x1), y: Math.min(drag.y0, drag.y1),
                  w: Math.abs(drag.x1 - drag.x0), h: Math.abs(drag.y1 - drag.y0),
                })}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-44 text-sm text-secondary">No image</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Zoom lens — floating pixelated magnifier shared by both viewers
// ---------------------------------------------------------------------------
//
// Given offscreen canvases for the input and output images and a normalized
// coordinate (u, v), it draws the SAME content region in both, magnified with
// nearest-neighbor sampling so individual pixels are visible.
//
// IMPORTANT: the sampled window is RELATIVE (a fraction of each image's size),
// not a fixed pixel count. `fracX`/`fracY` are computed once from the input
// image, so both lenses cover the identical region of the picture even after an
// Upscale node has made the output several times larger. (A fixed pixel window
// would show a much smaller — zoomed-in — slice of the larger output image.)

const LENS_SIZE = 132;          // on-screen lens canvas size (px)
const LENS_REF_PIXELS = 15;     // window width in INPUT pixels -> sets the fraction

function LensCanvas({ srcCanvas, u, v, fracX, fracY, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, LENS_SIZE, LENS_SIZE);
    if (!srcCanvas) {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, LENS_SIZE, LENS_SIZE);
      return;
    }
    const sw = srcCanvas.width, sh = srcCanvas.height;
    // Window size in THIS image's pixels = fraction × this image's size, so the
    // same content region is shown regardless of resolution.
    const spanX = Math.max(1, fracX * sw);
    const spanY = Math.max(1, fracY * sh);
    let sx = u * sw - spanX / 2;
    let sy = v * sh - spanY / 2;
    sx = Math.max(0, Math.min(sw - spanX, sx));
    sy = Math.max(0, Math.min(sh - spanY, sy));
    // White backdrop so transparent areas read as paper.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, LENS_SIZE, LENS_SIZE);
    ctx.drawImage(srcCanvas, sx, sy, spanX, spanY, 0, 0, LENS_SIZE, LENS_SIZE);
    // Outline the exact hovered source pixel.
    const cellW = LENS_SIZE / spanX, cellH = LENS_SIZE / spanY;
    const px = Math.floor(u * sw), py = Math.floor(v * sh);
    ctx.strokeStyle = 'rgba(255,0,128,0.9)';
    ctx.lineWidth = 1;
    ctx.strokeRect((px - sx) * cellW, (py - sy) * cellH, cellW, cellH);
  }, [srcCanvas, u, v, fracX, fracY]);
  return (
    <div className="flex flex-col items-center">
      <canvas ref={ref} width={LENS_SIZE} height={LENS_SIZE} className="border rounded" style={{ imageRendering: 'pixelated' }} />
      <span className="text-[10px] mt-0.5 text-secondary">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Convolution kernel editor (QR-drawer style)
// ---------------------------------------------------------------------------
//
// The kernel is rendered like the QR module drawer in this project: a grid of
// coloured cells. Each cell's WEIGHT is mapped through a monochrome colormap —
// the kernel's lowest weight is black, its highest is white — so the kernel's
// "shape" is visible at a glance. The user picks a brush value (the numeric
// "colour" to paint) and clicks / drags cells to stamp it. Cell numbers are
// hidden unless "view values" is checked; when shown, the text is black on
// light cells and white on dark cells so it always stays readable. Hover + the
// mouse wheel still nudges a single cell for fine tuning.

// Format a weight for compact display (drops trailing zeros).
function fmtWeight(v) {
  const n = Number(v) || 0;
  return String(Math.round(n * 100) / 100);
}

function KernelEditor({ config, onChange }) {
  const { width, height, weights } = config;
  const [hover, setHover] = useState(null); // index
  const [paintValue, setPaintValue] = useState(1);
  const [viewValues, setViewValues] = useState(false);
  const hoverRef = useRef(null);
  const paintingRef = useRef(false);
  const gridRef = useRef(null);

  // Native, non-passive wheel listener so we can preventDefault page scroll
  // while nudging the hovered cell.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const onWheel = (e) => {
      const idx = hoverRef.current;
      if (idx == null) return;
      e.preventDefault();
      const step = e.shiftKey ? 0.1 : 1;
      const next = weights.slice();
      next[idx] = Math.round((Number(next[idx] || 0) + (e.deltaY < 0 ? step : -step)) * 100) / 100;
      onChange({ ...config, weights: next });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [config, weights, onChange]);

  // Painting stops as soon as the pointer is released anywhere.
  useEffect(() => {
    const stop = () => { paintingRef.current = false; };
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    return () => { window.removeEventListener('mouseup', stop); window.removeEventListener('touchend', stop); };
  }, []);

  const setHovered = (idx) => { setHover(idx); hoverRef.current = idx; };

  // Stamp the brush value onto a cell.
  const paintCell = (idx) => {
    const next = weights.slice();
    next[idx] = Number(paintValue) || 0;
    onChange({ ...config, weights: next });
  };

  // Resize the kernel, keeping overlapping weights (top-left aligned).
  const resize = (w, h) => {
    const nw = Math.max(1, Math.min(9, w | 0));
    const nh = Math.max(1, Math.min(9, h | 0));
    const next = new Array(nw * nh).fill(0);
    for (let y = 0; y < Math.min(nh, height); y++) {
      for (let x = 0; x < Math.min(nw, width); x++) {
        next[y * nw + x] = weights[y * width + x] || 0;
      }
    }
    onChange({ ...config, width: nw, height: nh, weights: next });
  };

  // Apply a template at the CURRENT kernel size — generic templates regenerate
  // at width×height, fixed 3×3 stencils are centered into it. The user's
  // width/height are preserved (never rewritten).
  const loadTemplate = (key) => {
    if (!key) return;
    const built = buildKernelTemplate(key, width, height);
    if (!built) return; // doesn't fit (disabled in the dropdown anyway)
    onChange({
      ...config,
      weights: built.weights,
      normalize: built.normalize,
      clamp: built.clamp,
      abs: built.abs,
    });
  };

  const sum = weights.reduce((a, b) => a + Number(b || 0), 0);
  const min = weights.length ? Math.min(...weights.map(Number)) : 0;
  const max = weights.length ? Math.max(...weights.map(Number)) : 0;
  // Monochrome colormap: min weight -> 0 (black), max weight -> 255 (white).
  const greyOf = (v) => (max <= min ? 128 : Math.round(((Number(v) - min) / (max - min)) * 255));

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs">
          <label>W
            <input type="number" min={1} max={9} value={width}
              onChange={(e) => resize(Number(e.target.value), height)}
              className="ml-1 w-14 px-1 py-0.5 rounded border" />
          </label>
          <label>H
            <input type="number" min={1} max={9} value={height}
              onChange={(e) => resize(width, Number(e.target.value))}
              className="ml-1 w-14 px-1 py-0.5 rounded border" />
          </label>
        </div>
        <div
          ref={gridRef}
          onMouseLeave={() => setHovered(null)}
          className="inline-grid gap-0.5 p-1 rounded bg-black/5 dark:bg-white/5 select-none"
          style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
        >
          {weights.map((wv, idx) => {
            const g = greyOf(wv);
            const textColor = g < 128 ? '#fff' : '#000';
            return (
              <div
                key={idx}
                title={`row ${Math.floor(idx / width)}, col ${idx % width} = ${fmtWeight(wv)}`}
                onMouseDown={() => { paintingRef.current = true; paintCell(idx); }}
                onMouseEnter={() => { setHovered(idx); if (paintingRef.current) paintCell(idx); }}
                className={`w-10 h-10 flex items-center justify-center text-[10px] font-mono rounded cursor-pointer border border-black/10 dark:border-white/20 ${hover === idx ? 'ring-2 ring-fuchsia-500' : ''}`}
                style={{ backgroundColor: `rgb(${g},${g},${g})`, color: textColor }}
              >
                {viewValues ? fmtWeight(wv) : ''}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-secondary mt-1">
          Click / drag to paint the brush value · hover + mouse wheel to nudge (Shift = 0.1)
        </p>
      </div>

      <div className="md:w-52 text-xs space-y-2">
        <div>
          <label className="block mb-1 font-medium">Brush value (the “colour” to paint)</label>
          <input type="number" step={0.1} value={paintValue}
            onChange={(e) => setPaintValue(e.target.value === '' ? 0 : Number(e.target.value))}
            className="w-full px-2 py-1 rounded border" />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={viewValues} onChange={(e) => setViewValues(e.target.checked)} />
          View values on cells
        </label>
        <div>
          <label className="block mb-1 font-medium">Load template (at {width}×{height})</label>
          <select onChange={(e) => { loadTemplate(e.target.value); e.target.value = ''; }}
            defaultValue="" className="w-full px-2 py-1 rounded border">
            <option value="" disabled>Choose…</option>
            {Object.entries(KERNEL_TEMPLATES).map(([k, t]) => {
              // Generic templates fit any size; fixed 3×3 stencils need ≥3×3.
              const fits = t.generic || (width >= 3 && height >= 3);
              return (
                <option key={k} value={k} disabled={!fits}>
                  {t.label}{t.generic ? '' : ' (3×3)'}{!fits ? ' — needs ≥3×3' : ''}
                </option>
              );
            })}
          </select>
        </div>
        <div className="rounded border p-2 bg-black/5 dark:bg-white/5 space-y-1">
          <div className="font-medium">Hovered cell</div>
          {hover == null ? (
            <div className="text-secondary">— none —</div>
          ) : (
            <div>
              <div>row {Math.floor(hover / width)}, col {hover % width}</div>
              <div>weight: <span className="font-mono">{fmtWeight(weights[hover])}</span></div>
            </div>
          )}
          <div className="pt-1 border-t border-black/10 dark:border-white/10 flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm border" style={{ background: '#000' }} /> min {fmtWeight(min)}
            <span className="inline-block w-3 h-3 rounded-sm border ml-2" style={{ background: '#fff' }} /> max {fmtWeight(max)}
          </div>
          <div>sum of weights: <span className="font-mono">{Math.round(sum * 100) / 100}</span></div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic field renderer (used by the config modal)
// ---------------------------------------------------------------------------

function Field({ field, value, onChange }) {
  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }
  if (field.type === 'select') {
    return (
      <label className="block text-sm">
        <span className="block mb-1 font-medium">{field.label}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 rounded border">
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    );
  }
  // number
  return (
    <label className="block text-sm">
      <span className="block mb-1 font-medium">{field.label}</span>
      <input type="number" min={field.min} max={field.max} step={field.step}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-full px-2 py-1 rounded border" />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

function ModalShell({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className={`bg-secondary rounded-lg shadow-xl border ${wide ? 'w-[min(96vw,720px)]' : 'w-[min(96vw,460px)]'} max-h-[88vh] overflow-auto p-4`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-sm opacity-60 hover:opacity-100">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddNodeModal({ onPick, onClose }) {
  return (
    <ModalShell title="Add pipeline node" onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {NODE_TYPE_ORDER.map((t) => (
          <button key={t} onClick={() => onPick(t)} title={NODE_DEFS[t].description}
            className="text-left px-3 py-2 rounded border hover:bg-white/40 dark:hover:bg-black/20">
            <div className="text-sm font-medium">{NODE_DEFS[t].label}</div>
            <div className="text-[11px] text-secondary mt-0.5">{NODE_DEFS[t].description}</div>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}

// Preset picker as its own modal window (replaces the old dropdown).
function PresetModal({ onPick, onClose }) {
  return (
    <ModalShell title="Load preset pipeline" onClose={onClose}>
      <p className="text-xs text-secondary mb-2">
        Loads a ready-made pipeline you can then edit and refine. This replaces the current node list.
      </p>
      <div className="space-y-2">
        {PRESET_ORDER.map((k) => (
          <button key={k} onClick={() => onPick(k)}
            className="block w-full text-left px-3 py-2 rounded border hover:bg-white/40 dark:hover:bg-black/20">
            <div className="text-sm font-medium">{PRESETS[k].label}</div>
            <div className="text-[11px] text-secondary mt-0.5">{PRESETS[k].description}</div>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}

function ConfigModal({ node, onSave, onClose, onEditMask }) {
  const def = NODE_DEFS[node.type];
  const [draft, setDraft] = useState(node.config);
  const setKey = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <ModalShell title={`Configure: ${def.label}`} onClose={onClose} wide={node.type === 'convolution'}>
      <div className="space-y-3">
        {def.fields.map((f) => {
          if (f.showIf && !f.showIf(draft)) return null;
          return <Field key={f.key} field={f} value={draft[f.key]} onChange={(v) => setKey(f.key, v)} />;
        })}

        {node.type === 'convolution' && (
          <div className="pt-2 border-t border-black/10 dark:border-white/10">
            <KernelEditor config={draft} onChange={setDraft} />
          </div>
        )}

        {node.type === 'mask' && (
          <div className="pt-2 border-t border-black/10 dark:border-white/10 text-sm space-y-2">
            <p className="text-secondary text-xs">
              Masks are drawn on the INPUT image. Rectangles use input-pixel coordinates.
              Nodes after this one respect the mask, except size-changing nodes (Upscale),
              which bypass masking.
            </p>
            <div>Regions: <span className="font-mono">{(draft.rects || []).length}</span></div>
            <div className="flex gap-2">
              <button onClick={() => { onSave({ ...draft }); onEditMask(node.id); }}
                className="button-info px-3 py-1.5 rounded text-xs">Draw regions on input image</button>
              <button onClick={() => setDraft((d) => ({ ...d, rects: [] }))}
                className="button-warning px-3 py-1.5 rounded text-xs">Clear regions</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <button onClick={() => onSave(draft)} className="button-success flex-1 px-3 py-2 rounded text-sm">Save</button>
        <button onClick={onClose} className="button-secondary flex-1 px-3 py-2 rounded text-sm bg-gray-400/40">Cancel</button>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Pipeline node row (with native drag-to-reorder)
// ---------------------------------------------------------------------------

function NodeRow({
  node, index, total, onToggle, onRemove, onEdit,
  onDragStart, onDragOver, onDrop, dragging, onMoveUp, onMoveDown,
}) {
  const def = NODE_DEFS[node.type];
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={() => onDrop(index)}
      className={`rounded border p-2 bg-white/40 dark:bg-black/20 ${dragging ? 'opacity-50' : ''} ${node.enabled ? '' : 'opacity-60'}`}
    >
      <div className="flex items-center gap-2">
        <span className="cursor-grab text-secondary select-none hidden sm:inline" title="Drag to reorder">⠿</span>
        {/* Up/down buttons: the reliable reorder path on touch / mobile, where
            native HTML5 drag-and-drop does not fire. */}
        <div className="flex flex-col -my-1">
          <button onClick={onMoveUp} disabled={index === 0}
            className="text-[10px] leading-3 px-1 disabled:opacity-30" title="Move up">▲</button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="text-[10px] leading-3 px-1 disabled:opacity-30" title="Move down">▼</button>
        </div>
        <input type="checkbox" checked={node.enabled} onChange={onToggle} title="Enable / disable" />
        <button onClick={onEdit} title={def.description}
          className="flex-1 text-left text-sm font-medium truncate hover:underline">
          {index + 1}. {def.label}
        </button>
        <StatusBadge status={node.status} />
        <button onClick={onRemove} className="text-xs text-red-500 hover:text-red-700" title="Remove">✕</button>
      </div>
      <div className="mt-1.5">
        <ProgressBar value={node.progress} status={node.status} />
      </div>
      {node.message && (
        <div className={`mt-1 text-[11px] ${node.status === 'error' ? 'text-red-500' : 'text-secondary'}`}>{node.message}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// Bundled sample so the demo is interactive before any upload. Served from
// /public; loaded entirely client-side like user uploads (no server round-trip).
const SAMPLE_IMAGE = '/cov_test_image.jpg';

export default function ConvolutionEditorPage() {
  const [inputImage, setInputImage] = useState(null);
  const [outputImage, setOutputImage] = useState(null);
  const [inputName, setInputName] = useState('');
  const [nodes, setNodes] = useState([]);
  const [padding, setPadding] = useState({ ...DEFAULT_PADDING });
  const [maxDim, setMaxDim] = useState(1200);
  const [running, setRunning] = useState(false);
  const [statusLine, setStatusLine] = useState('Upload an image and run the pipeline.');

  const [addOpen, setAddOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [configNodeId, setConfigNodeId] = useState(null);
  const [maskEditId, setMaskEditId] = useState(null);

  const [lens, setLens] = useState(null); // {u,v,clientX,clientY}
  const [dragIndex, setDragIndex] = useState(null);
  const overIndexRef = useRef(null);

  const fileRef = useRef(null);
  // Offscreen canvases mirroring input/output ImageData, used by the zoom lens.
  const inputCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);

  const configNode = nodes.find((n) => n.id === configNodeId) || null;
  const maskEditNode = nodes.find((n) => n.id === maskEditId) || null;

  // Relative zoom-lens window: a fraction of the image, derived from the INPUT
  // image so both lenses show the same content region even after upscaling.
  const lensWindow = useMemo(() => {
    const base = inputImage || outputImage;
    if (!base) return { fracX: 0.1, fracY: 0.1 };
    return { fracX: LENS_REF_PIXELS / base.width, fracY: LENS_REF_PIXELS / base.height };
  }, [inputImage, outputImage]);

  // Keep offscreen lens canvases in sync with the displayed images.
  useEffect(() => {
    if (!inputImage) { inputCanvasRef.current = null; return; }
    const c = document.createElement('canvas');
    drawImageDataToCanvas(c, inputImage);
    inputCanvasRef.current = c;
  }, [inputImage]);
  useEffect(() => {
    if (!outputImage) { outputCanvasRef.current = null; return; }
    const c = document.createElement('canvas');
    drawImageDataToCanvas(c, outputImage);
    outputCanvasRef.current = c;
  }, [outputImage]);

  // ---- sample image ----
  // Loads the bundled sample from /public, decoded client-side (no upload).
  const loadSample = useCallback(async (announce = true) => {
    try {
      const { imageData, scale } = await loadImageData(SAMPLE_IMAGE, maxDim);
      setInputImage(imageData);
      setOutputImage(null);
      setInputName('cov_test_image.jpg');
      if (announce) {
        setStatusLine(scale < 1
          ? `Loaded sample image (downscaled to ${imageData.width}×${imageData.height}).`
          : `Loaded sample image (${imageData.width}×${imageData.height}).`);
      }
    } catch (e) {
      setStatusLine(`Could not load sample image: ${e.message || e}`);
    }
  }, [maxDim]);

  // Auto-load the sample once on first mount so the viewer is never empty.
  useEffect(() => {
    loadSample(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- upload ----
  const handleFile = async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const { imageData, scale } = await loadImageData(url, maxDim);
      setInputImage(imageData);
      setOutputImage(null);
      setInputName(file.name);
      setStatusLine(scale < 1
        ? `Loaded ${file.name} (downscaled to ${imageData.width}×${imageData.height} for performance).`
        : `Loaded ${file.name} (${imageData.width}×${imageData.height}).`);
    } catch (e) {
      setStatusLine(`Error: ${e.message || e}`);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  // ---- pipeline mutations ----
  const addNode = (type) => {
    const node = makeNode(type);
    setNodes((ns) => [...ns, node]);
    setAddOpen(false);
    setConfigNodeId(node.id); // open config right away
  };
  const removeNode = (id) => setNodes((ns) => ns.filter((n) => n.id !== id));
  const toggleNode = (id) => setNodes((ns) => ns.map((n) => n.id === id ? { ...n, enabled: !n.enabled } : n));
  const saveConfig = (id, config) => setNodes((ns) => ns.map((n) => n.id === id ? { ...n, config } : n));

  const loadPreset = (key) => {
    setNodes(makePreset(key));
    setPresetOpen(false);
    setStatusLine(`Loaded preset: ${PRESETS[key].label}. Edit nodes, then Run.`);
  };

  // Move a node by one slot (used by the row up/down buttons; touch-friendly).
  const moveNode = (from, to) => {
    if (to < 0 || to >= nodes.length) return;
    setNodes((ns) => {
      const next = ns.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const resetPipeline = () => {
    setNodes((ns) => ns.map((n) => ({ ...n, status: 'idle', progress: 0, message: '' })));
    setOutputImage(null);
    setStatusLine('Pipeline reset.');
  };

  // ---- drag reorder ----
  const onDragStart = (i) => setDragIndex(i);
  const onDragOver = (i) => { overIndexRef.current = i; };
  const onDrop = () => {
    const from = dragIndex;
    const to = overIndexRef.current;
    setDragIndex(null);
    if (from == null || to == null || from === to) return;
    setNodes((ns) => {
      const next = ns.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  // ---- run pipeline ----
  const runPipeline = useCallback(async () => {
    if (!inputImage || running) return;
    setRunning(true);
    setStatusLine('Running pipeline…');
    const ctx = { padding };
    // Snapshot working copy of nodes for in-loop status updates.
    let work = nodes.map((n) => ({ ...n, status: 'idle', progress: 0, message: '' }));
    setNodes(work.map((n) => ({ ...n })));

    let current = inputImage;
    let activeMask = null; // mask state contributed by the most recent mask node

    for (let i = 0; i < work.length; i++) {
      const node = work[i];
      if (!node.enabled) {
        work[i] = { ...node, status: 'idle', message: '(disabled, skipped)' };
        setNodes(work.map((n) => ({ ...n })));
        continue;
      }
      work[i] = { ...node, status: 'running', progress: 0.2 };
      setNodes(work.map((n) => ({ ...n })));
      // Yield so the browser can paint the running state / progress bar.
      await new Promise((r) => setTimeout(r, 25));

      try {
        if (node.type === 'mask') {
          activeMask = (node.config.rects && node.config.rects.length)
            ? { rects: node.config.rects, mode: node.config.mode }
            : null;
          const { message } = executeNode(current, node, ctx);
          work[i] = { ...node, status: 'done', progress: 1, message };
        } else {
          const before = current;
          const { imageData, message } = executeNode(current, node, ctx);
          // Apply mask propagation when an upstream mask is active and the
          // operation preserved dimensions (see compositeMask docs).
          const after = activeMask ? compositeMask(before, imageData, activeMask) : imageData;
          current = after;
          work[i] = { ...node, status: 'done', progress: 1, message };
          setOutputImage(current);
        }
      } catch (e) {
        work[i] = { ...node, status: 'error', progress: 1, message: String(e.message || e) };
        setNodes(work.map((n) => ({ ...n })));
        setOutputImage(current);
        setRunning(false);
        setStatusLine(`Pipeline stopped at node ${i + 1}: ${e.message || e}`);
        return;
      }
      setNodes(work.map((n) => ({ ...n })));
      await new Promise((r) => setTimeout(r, 10));
    }

    setOutputImage(current);
    setRunning(false);
    setStatusLine('Pipeline complete.');
  }, [inputImage, nodes, padding, running]);

  // ---- download ----
  const downloadOutput = async () => {
    if (!outputImage) return;
    const blob = await imageDataToBlob(outputImage);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed-${inputName ? inputName.replace(/\.[^.]+$/, '') : 'image'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ---- mask drawing helpers ----
  const addMaskRect = (rect) => {
    if (!maskEditId) return;
    setNodes((ns) => ns.map((n) => n.id === maskEditId
      ? { ...n, config: { ...n.config, rects: [...(n.config.rects || []), rect] } }
      : n));
  };
  // Faint overlays: rectangles from every mask node, except the one being edited.
  const persistedMaskRects = useMemo(() => {
    const rects = [];
    for (const n of nodes) {
      if (n.type === 'mask' && n.id !== maskEditId) rects.push(...(n.config.rects || []));
    }
    return rects;
  }, [nodes, maskEditId]);
  const draftMaskRects = maskEditNode ? (maskEditNode.config.rects || []) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Convolution Editor - INDEX</title>
        <meta name="description" content="Browser-side non-ML image processing and upscaling pipeline for scanned line art." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-1">Convolution Editor</h1>
          <p className="text-sm text-secondary mb-4">
            Browser-only, non-ML pipeline for inspecting convolution, thresholding, morphology and upscaling on scanned line art.
          </p>

          {/* Top control bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { handleFile(e.target.files && e.target.files[0]); e.target.value = ''; }} />
            <button onClick={() => fileRef.current?.click()} className="button-info px-3 py-1.5 rounded text-sm">Upload image</button>
            <button onClick={() => loadSample(true)} className="button-info px-3 py-1.5 rounded text-sm">Load sample</button>
            <button onClick={runPipeline} disabled={!inputImage || running}
              className="button-success px-3 py-1.5 rounded text-sm disabled:opacity-50">
              {running ? 'Running…' : 'Run pipeline'}
            </button>
            <button onClick={resetPipeline} className="button-warning px-3 py-1.5 rounded text-sm">Reset pipeline</button>
            <button onClick={downloadOutput} disabled={!outputImage}
              className="button-info px-3 py-1.5 rounded text-sm disabled:opacity-50">Download output</button>

            <span className="mx-1 h-5 w-px bg-black/20 dark:bg-white/20" />
            <button onClick={() => setPresetOpen(true)} className="button-info px-3 py-1.5 rounded text-sm">Load preset</button>
          </div>

          {statusLine && <div className="mb-3 text-xs text-secondary">{statusLine}</div>}

          {maskEditId && (
            <div className="mb-3 flex items-center gap-3 text-sm rounded border border-fuchsia-500/50 bg-fuchsia-500/10 px-3 py-2">
              <span>Mask draw mode: drag on the <strong>input</strong> image to add rectangles.</span>
              <button onClick={() => setMaskEditId(null)} className="button-info px-2 py-1 rounded text-xs ml-auto">Done</button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Viewer (2 cols) */}
            <div className="lg:col-span-2">
              <div className="flex flex-col md:flex-row gap-4" onMouseLeave={() => setLens(null)}>
                <ImageViewer
                  title="Input"
                  imageData={inputImage}
                  maskRects={persistedMaskRects}
                  draftRects={draftMaskRects}
                  drawMode={!!maskEditId}
                  onHover={setLens}
                  onLeave={() => setLens(null)}
                  onAddRect={addMaskRect}
                />
                <ImageViewer
                  title="Output"
                  imageData={outputImage}
                  onHover={setLens}
                  onLeave={() => setLens(null)}
                />
              </div>
              <div className="mt-2 rounded border p-3 bg-white/30 dark:bg-black/10">
                <h3 className="text-sm font-semibold mb-2">Padding (global)</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <label className="flex items-center gap-1">Mode
                    <select value={padding.mode} onChange={(e) => setPadding((p) => ({ ...p, mode: e.target.value }))}
                      className="px-2 py-1 rounded border">
                      <option value="edge">Edge clamp (replicate)</option>
                      <option value="constant">Constant color</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-1">Pad color
                    <input type="color" value={padding.color}
                      onChange={(e) => setPadding((p) => ({ ...p, color: e.target.value }))}
                      className="w-9 h-7 p-0 border rounded" />
                  </label>
                  <label className="flex items-center gap-1">Max image dim
                    <input type="number" min={200} max={4000} step={100} value={maxDim}
                      onChange={(e) => setMaxDim(Number(e.target.value) || 1200)}
                      className="w-24 px-2 py-1 rounded border" />
                  </label>
                  <span className="text-xs text-secondary">Padding applies to convolution, blur and morphology.</span>
                </div>
              </div>
            </div>

            {/* Pipeline editor (1 col) */}
            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Pipeline</h3>
                <button onClick={() => setAddOpen(true)} className="button-info px-2 py-1 rounded text-xs">+ Add node</button>
              </div>
              <div className="space-y-2">
                {nodes.length === 0 && (
                  <div className="text-xs text-secondary rounded border border-dashed p-4 text-center">
                    No nodes yet. Add a node or load a preset.
                  </div>
                )}
                {nodes.map((node, i) => (
                  <NodeRow
                    key={node.id}
                    node={node}
                    index={i}
                    total={nodes.length}
                    dragging={dragIndex === i}
                    onToggle={() => toggleNode(node.id)}
                    onRemove={() => removeNode(node.id)}
                    onEdit={() => setConfigNodeId(node.id)}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onMoveUp={() => moveNode(i, i - 1)}
                    onMoveDown={() => moveNode(i, i + 1)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating zoom lens — shows the same coordinate in both images */}
      {lens && (inputImage || outputImage) && (
        <div
          className="fixed z-30 pointer-events-none bg-secondary border rounded-lg shadow-xl p-2"
          style={{
            left: Math.min(lens.clientX + 18, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 300),
            top: Math.min(lens.clientY + 18, (typeof window !== 'undefined' ? window.innerHeight : 9999) - 190),
          }}
        >
          <div className="flex gap-2">
            <LensCanvas srcCanvas={inputCanvasRef.current} u={lens.u} v={lens.v}
              fracX={lensWindow.fracX} fracY={lensWindow.fracY} label="Input" />
            <LensCanvas srcCanvas={outputCanvasRef.current} u={lens.u} v={lens.v}
              fracX={lensWindow.fracX} fracY={lensWindow.fracY} label="Output" />
          </div>
        </div>
      )}

      {addOpen && <AddNodeModal onPick={addNode} onClose={() => setAddOpen(false)} />}
      {presetOpen && <PresetModal onPick={loadPreset} onClose={() => setPresetOpen(false)} />}
      {configNode && (
        <ConfigModal
          node={configNode}
          onSave={(config) => { saveConfig(configNode.id, config); setConfigNodeId(null); }}
          onClose={() => setConfigNodeId(null)}
          onEditMask={(id) => { setConfigNodeId(null); setMaskEditId(id); }}
        />
      )}

      <Footer />
    </div>
  );
}
