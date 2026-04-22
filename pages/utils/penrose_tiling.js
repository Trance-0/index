'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';
import { drawPenrose } from '../penrose_background';

export default function PenroseTilingExplorer() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dragRef = useRef({
    active: false,
    button: 0,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    startRotation: 0,
  });

  const [divisions, setDivisions] = useState(6);
  const [thetaOffset, setThetaOffset] = useState(() => Math.random() * Math.PI * 2);
  const [mirrorShift, setMirrorShift] = useState(() => Math.random() < 0.5 ? 0 : 1);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [showOutline, setShowOutline] = useState(true);
  const [thinColor, setThinColor] = useState('#f4d35e');
  const [thickColor, setThickColor] = useState('#ee964b');
  const [outlineColor, setOutlineColor] = useState('#1d3557');
  const [bgColor, setBgColor] = useState('#f1faee');
  const [outlineWidth, setOutlineWidth] = useState(1.2);
  const [menuOpen, setMenuOpen] = useState(false);
  const [triangleCount, setTriangleCount] = useState(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    const W = container.clientWidth;
    const H = container.clientHeight;
    if (W === 0 || H === 0) return;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = drawPenrose(ctx, W, H, {
      divisions,
      thetaOffset,
      mirrorShift,
      zoom,
      panX,
      panY,
      rotation,
      showOutline,
      thinColor,
      thickColor,
      outlineColor,
      bgColor,
      outlineWidthPx: outlineWidth,
      enlarge: 1.1,
    });
    setTriangleCount(count);
  }, [divisions, thetaOffset, mirrorShift, zoom, panX, panY, rotation,
      showOutline, thinColor, thickColor, outlineColor, bgColor, outlineWidth]);

  useEffect(() => { render(); }, [render]);

  useEffect(() => {
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [render]);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((z) => {
      const next = z * Math.exp(delta);
      return Math.max(0.1, Math.min(50, next));
    });
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    dragRef.current = {
      active: true,
      button: e.button,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: panX,
      startPanY: panY,
      startRotation: rotation,
    };
  };

  const handleMouseMove = (e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.button === 2) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const a0 = Math.atan2(d.startY - cy, d.startX - cx);
      const a1 = Math.atan2(e.clientY - cy, e.clientX - cx);
      setRotation(d.startRotation + (a1 - a0));
    } else {
      setPanX(d.startPanX + dx);
      setPanY(d.startPanY + dy);
    }
  };

  const handleMouseUp = () => { dragRef.current.active = false; };
  const handleMouseLeave = () => { dragRef.current.active = false; };
  const handleContextMenu = (e) => e.preventDefault();

  const randomize = () => {
    setThetaOffset(Math.random() * Math.PI * 2);
    setMirrorShift(Math.random() < 0.5 ? 0 : 1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setZoom(1);
  };

  const resetView = () => {
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setZoom(1);
  };

  const savePNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `penrose-tiling-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Head>
        <title>Penrose Tiling Explorer</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className="flex-1 relative overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0 select-none"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
          style={{ cursor: dragRef.current.active ? 'grabbing' : 'grab' }}
        >
          <canvas ref={canvasRef} className="block w-full h-full" />
        </div>

        {/* Info overlay (top-left) */}
        <div className="absolute top-3 left-3 pointer-events-none text-xs px-3 py-2 rounded-md bg-black/40 text-white backdrop-blur-sm">
          <div>Triangles: {triangleCount.toLocaleString()}</div>
          <div className="opacity-80 mt-1">Scroll: zoom &nbsp;·&nbsp; Left-drag: pan &nbsp;·&nbsp; Right-drag: rotate</div>
        </div>

        {/* Bottom center toggle + popup menu */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
          {menuOpen && (
            <div className="mb-3 w-[min(92vw,680px)] max-h-[55vh] overflow-auto bg-secondary rounded-lg shadow-xl border p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pt-divisions" className="block mb-1 text-sm font-medium">
                    Subdivisions: {divisions}
                  </label>
                  <input id="pt-divisions" type="range" min={0} max={9} step={1}
                    value={divisions} onChange={(e) => setDivisions(Number(e.target.value))}
                    className="w-full" />
                </div>
                <div>
                  <label htmlFor="pt-outlineW" className="block mb-1 text-sm font-medium">
                    Outline width: {outlineWidth.toFixed(2)}px
                  </label>
                  <input id="pt-outlineW" type="range" min={0} max={4} step={0.1}
                    value={outlineWidth} onChange={(e) => setOutlineWidth(Number(e.target.value))}
                    className="w-full" />
                </div>

                <div className="flex items-center gap-3">
                  <input id="pt-mirror" type="checkbox"
                    checked={mirrorShift === 1}
                    onChange={(e) => setMirrorShift(e.target.checked ? 1 : 0)} />
                  <label htmlFor="pt-mirror" className="text-sm font-medium">Mirror seed</label>
                </div>
                <div className="flex items-center gap-3">
                  <input id="pt-outline" type="checkbox"
                    checked={showOutline}
                    onChange={(e) => setShowOutline(e.target.checked)} />
                  <label htmlFor="pt-outline" className="text-sm font-medium">Show outlines</label>
                </div>

                <div className="grid grid-cols-2 gap-3 md:col-span-2">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Thin rhomb</label>
                    <input type="color" value={thinColor}
                      onChange={(e) => setThinColor(e.target.value)}
                      className="w-full h-9 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Thick rhomb</label>
                    <input type="color" value={thickColor}
                      onChange={(e) => setThickColor(e.target.value)}
                      className="w-full h-9 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Outline</label>
                    <input type="color" value={outlineColor}
                      onChange={(e) => setOutlineColor(e.target.value)}
                      className="w-full h-9 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Background</label>
                    <input type="color" value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full h-9 rounded cursor-pointer" />
                  </div>
                </div>

                <div className="flex gap-2 md:col-span-2 pt-1">
                  <button onClick={randomize} type="button"
                    className="button-info flex-1 px-3 py-2 rounded transition-colors text-sm">
                    Randomize
                  </button>
                  <button onClick={resetView} type="button"
                    className="button-warning flex-1 px-3 py-2 rounded transition-colors text-sm">
                    Reset view
                  </button>
                  <button onClick={savePNG} type="button"
                    className="button-success flex-1 px-3 py-2 rounded transition-colors text-sm">
                    Save PNG
                  </button>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            type="button"
            className="px-4 py-2 rounded-full shadow-md bg-black/50 text-white text-sm backdrop-blur-sm hover:bg-black/70 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            {menuOpen ? 'Hide controls' : 'Controls'}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
