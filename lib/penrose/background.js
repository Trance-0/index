'use client'

import { useEffect, useRef, useCallback } from 'react';
import { drawPenrose, getDefaultColors } from './draw';

export default function PenroseBackground({
  divisions = 6,
  opacity = 1,
  thinColor,
  thickColor,
  outlineColor,
  showOutline = true,
  fixed = true,
  zIndex = -1,
}) {
  const canvasRef = useRef(null);
  const seedRef = useRef({
    thetaOffset: Math.random() * Math.PI * 2,
    mirrorShift: Math.random() < 0.5 ? 0 : 1,
  });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    const W = window.innerWidth;
    const H = window.innerHeight;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const defaults = getDefaultColors();
    drawPenrose(ctx, W, H, {
      divisions,
      thetaOffset: seedRef.current.thetaOffset,
      mirrorShift: seedRef.current.mirrorShift,
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
      showOutline,
      thinColor: thinColor ?? defaults.thin,
      thickColor: thickColor ?? defaults.thick,
      outlineColor: outlineColor ?? defaults.outline,
      bgColor: 'transparent',
      outlineWidthPx: 1,
      enlarge: 1.1,
    });
  }, [divisions, thinColor, thickColor, outlineColor, showOutline]);

  useEffect(() => { render(); }, [render]);

  useEffect(() => {
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [render]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = () => render();
    mql?.addEventListener?.('change', onChange);
    const observer = new MutationObserver(() => render());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mql?.removeEventListener?.('change', onChange);
      observer.disconnect();
    };
  }, [render]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: fixed ? 'fixed' : 'absolute',
        inset: 0,
        zIndex,
        pointerEvents: 'none',
        opacity,
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
