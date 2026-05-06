'use client'

import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

import {
  Simulator,
  ReactionManager,
  Renderer,
  THEMES,
  ATOM_PALETTES,
  PRESETS,
  DEFAULT_PRESET_KEY,
  generateStructure,
  canonicalName,
  defFormula,
  hsvAdjustPalette,
  drawMoleculePreview,
  COLORMAP_PRESETS,
  DEFAULT_COLORMAP,
} from '../../lib/reaction_simulator';

// Lightweight collapsible section.
function Section({ title, open, onToggle, children }) {
  return (
    <div className="border rounded-md mb-2 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/30"
      >
        <span>{title}</span>
        <span className="text-xs opacity-70">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="p-3 bg-white/20 dark:bg-black/10">{children}</div>}
    </div>
  );
}

function MoleculePreview({ def, palette }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !def) return;
    drawMoleculePreview(ref.current, def, { palette });
  }, [def, palette]);
  return <canvas ref={ref} width={70} height={36} className="border rounded bg-white/60 dark:bg-black/30" />;
}

export default function ReactionSimulatorPage() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const initial = PRESETS[DEFAULT_PRESET_KEY];

  // Settings (UI state).
  const [maxParticles, setMaxParticles] = useState(80);
  const [energyMean, setEnergyMean] = useState(2500);
  const [energyStd, setEnergyStd] = useState(600);
  const [spawnFadeIn, setSpawnFadeIn] = useState(0.8);
  const [staleFadeStart, setStaleFadeStart] = useState(20);
  const [staleFadeEnd, setStaleFadeEnd] = useState(30);

  const [particleScale, setParticleScale] = useState(1);
  const [trackingBoxScale, setTrackingBoxScale] = useState(1.2);
  const [showReactionBox, setShowReactionBox] = useState(false);
  const [reactionBoxLife, setReactionBoxLife] = useState(2);
  const [reactionBoxScale, setReactionBoxScale] = useState(1.2);

  const [hueShift, setHueShift] = useState(0);
  const [satShift, setSatShift] = useState(0);
  const [valShift, setValShift] = useState(0);

  const [colormap, setColormap] = useState(DEFAULT_COLORMAP);

  // Mirror of sim.tracked, refreshed by click and on the analytics tick.
  // Stored as a list of kind strings so React re-renders when tracking changes.
  const [trackedKinds, setTrackedKinds] = useState([]);

  const [themeKey, setThemeKey] = useState('daylight');
  const [paletteOverride, setPaletteOverride] = useState('');

  const [defsText, setDefsText] = useState(() => JSON.stringify(initial.defs, null, 2));
  const [bimolText, setBimolText] = useState(() => JSON.stringify(initial.bimol, null, 2));
  const [unimolText, setUnimolText] = useState(() => JSON.stringify(initial.unimol, null, 2));
  const [spawnableText, setSpawnableText] = useState(() => JSON.stringify(initial.spawnable, null, 2));
  const [parseError, setParseError] = useState('');

  const [formulaInput, setFormulaInput] = useState('C6H12O6');
  const [formulaName, setFormulaName] = useState('');
  const [formulaLayout, setFormulaLayout] = useState('auto');
  const [formulaMsg, setFormulaMsg] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Analytics state, refreshed on a timer.
  const [analytics, setAnalytics] = useState({ counts: {}, top5: [], lifetime: {}, totalEver: 0, totalReactions: 0 });

  // Section open/close state.
  const [openSections, setOpenSections] = useState({
    world: true, fade: false, display: false, theme: false,
    formulas: false, reactions: false, builder: false,
    analytics: false, io: false,
  });
  const toggleSection = (k) => setOpenSections((s) => ({ ...s, [k]: !s[k] }));

  const engineRef = useRef({ sim: null, renderer: null, rxn: null });
  const fileInputRef = useRef(null);

  const themeObj = THEMES[themeKey] || THEMES.daylight;
  const effectiveTheme = useMemo(() => {
    if (!paletteOverride) return themeObj;
    return { ...themeObj, palette: paletteOverride };
  }, [themeObj, paletteOverride]);

  // The same HSV-adjusted palette the renderer uses, mirrored here so the
  // analytics preview canvases match the live canvas appearance.
  const previewPalette = useMemo(() => {
    const base = ATOM_PALETTES[effectiveTheme.palette] || ATOM_PALETTES.cpk;
    return hsvAdjustPalette(base, hueShift, satShift, valShift);
  }, [effectiveTheme.palette, hueShift, satShift, valShift]);

  // Defs object (parsed) for analytics & previews. Falls back to initial on
  // parse failure so the analytics table still has something to render.
  const liveDefs = useMemo(() => {
    try { return JSON.parse(defsText); } catch { return initial.defs; }
  }, [defsText, initial.defs]);

  const applyConfig = useCallback(() => {
    try {
      const defs = JSON.parse(defsText);
      const bimol = JSON.parse(bimolText);
      const unimol = JSON.parse(unimolText);
      const spawnable = JSON.parse(spawnableText);
      if (typeof defs !== 'object' || Array.isArray(defs)) throw new Error('defs must be an object');
      if (!Array.isArray(bimol)) throw new Error('bimol must be an array');
      if (!Array.isArray(unimol)) throw new Error('unimol must be an array');
      if (!Array.isArray(spawnable)) throw new Error('spawnable must be an array');
      const e = engineRef.current;
      if (!e.sim || !e.rxn) return false;
      e.rxn.setRules(bimol, unimol);
      e.sim.setRules({ defs, spawnable });
      e.sim.setOptions({
        maxParticles, energyMean, energyStd,
        spawnFadeIn, staleFadeStart, staleFadeEnd,
        particleScale, reactionBoxLife, reactionBoxScale,
      });
      e.sim.refreshReactions();
      setParseError('');
      return true;
    } catch (err) {
      setParseError(String(err.message || err));
      return false;
    }
  }, [defsText, bimolText, unimolText, spawnableText,
      maxParticles, energyMean, energyStd,
      spawnFadeIn, staleFadeStart, staleFadeEnd,
      particleScale, reactionBoxLife, reactionBoxScale]);

  // ESC opens / applies + closes the settings panel.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSettings((v) => {
          if (v) applyConfig();
          return !v;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [applyConfig]);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Boot the engine + animation loop once.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rxn = new ReactionManager(initial.bimol, initial.unimol);
    const sim = new Simulator({
      defs: initial.defs,
      reactions: rxn,
      spawnable: initial.spawnable,
      options: {
        maxParticles, energyMean, energyStd,
        spawnFadeIn, staleFadeStart, staleFadeEnd,
        particleScale, reactionBoxLife, reactionBoxScale,
      },
    });
    const renderer = new Renderer(canvas, effectiveTheme);
    renderer.setHsv({ h: hueShift, s: satShift, v: valShift });
    renderer.setShowReactionBox(showReactionBox);
    renderer.setColormap(colormap);
    renderer.setTrackingBoxScale(trackingBoxScale);
    engineRef.current = { sim, rxn, renderer };

    const resize = () => {
      const W = container.clientWidth;
      const H = container.clientHeight;
      sim.setSize(W, H);
      renderer.resize(W, H);
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < Math.floor(maxParticles * 0.6); i++) {
      const k = sim.spawnable[Math.floor(Math.random() * sim.spawnable.length)];
      sim.spawn({ kind: k });
    }

    let raf = 0;
    let last = performance.now();
    let popAcc = 0;

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      popAcc += dt;
      if (popAcc >= 1) { sim.populationTick(); popAcc = 0; }
      sim.step(dt);
      renderer.draw(sim, {
        spawnFadeIn: sim.options.spawnFadeIn,
        staleFadeStart: sim.options.staleFadeStart,
        staleFadeEnd: sim.options.staleFadeEnd,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live setting → engine sync.
  useEffect(() => {
    const e = engineRef.current;
    if (!e.sim) return;
    e.sim.setOptions({
      maxParticles, energyMean, energyStd,
      spawnFadeIn, staleFadeStart, staleFadeEnd,
      particleScale, reactionBoxLife,
    });
  }, [maxParticles, energyMean, energyStd,
      spawnFadeIn, staleFadeStart, staleFadeEnd,
      particleScale, reactionBoxLife, reactionBoxScale]);

  useEffect(() => {
    const e = engineRef.current;
    if (!e.renderer) return;
    e.renderer.setTheme(effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    const e = engineRef.current;
    if (!e.renderer) return;
    e.renderer.setHsv({ h: hueShift, s: satShift, v: valShift });
  }, [hueShift, satShift, valShift]);

  useEffect(() => {
    const e = engineRef.current;
    if (!e.renderer) return;
    e.renderer.setShowReactionBox(showReactionBox);
  }, [showReactionBox]);

  useEffect(() => {
    const e = engineRef.current;
    if (!e.renderer) return;
    e.renderer.setColormap(colormap);
  }, [colormap]);

  useEffect(() => {
    const e = engineRef.current;
    if (!e.renderer) return;
    e.renderer.setTrackingBoxScale(trackingBoxScale);
  }, [trackingBoxScale]);

  // Refresh analytics state once a second from the live engine.
  useEffect(() => {
    const id = setInterval(() => {
      const sim = engineRef.current.sim;
      const rxn = engineRef.current.rxn;
      if (!sim || !rxn) return;
      const counts = {};
      for (const p of sim.particles) counts[p.kind] = (counts[p.kind] || 0) + 1;
      const candidates = sim.spawnable;
      const weighted = candidates.map((k) => ({
        kind: k,
        weight: rxn.reactivityScore(k, counts) + 0.001,
      }));
      const totalW = weighted.reduce((s, w) => s + w.weight, 0) || 1;
      weighted.forEach((w) => { w.percent = (w.weight / totalW) * 100; });
      weighted.sort((a, b) => b.weight - a.weight);
      const totalEver = Object.values(sim.lifetimeSpawns || {}).reduce((s, v) => s + v, 0);
      setAnalytics({
        counts,
        top5: weighted.slice(0, 5),
        lifetime: { ...sim.lifetimeSpawns },
        totalEver,
        totalReactions: sim.lifetimeReactions || 0,
      });
      // Sync the React-side labels for tracked particles. When a reaction
      // forwards tracking to a heavier product, this is what surfaces the
      // new kind name to the user.
      const next = (sim.tracked || []).map((p) => p.kind);
      setTrackedKinds((prev) => {
        if (prev.length === next.length && prev.every((k, i) => k === next[i])) return prev;
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Click on the canvas → track or untrack a particle.
  // - Plain click on a particle: replace selection with just that particle,
  //   or deselect if it was already the sole selection.
  // - Plain click on empty space: clear selection.
  // - Ctrl/Cmd-click on a particle: toggle it in the multi-selection.
  // - Ctrl/Cmd-click on empty space: leave selection alone.
  const handleCanvasClick = useCallback((e) => {
    const sim = engineRef.current.sim;
    const container = containerRef.current;
    if (!sim || !container) return;
    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = sim.pickAt(mx, my);
    const additive = e.ctrlKey || e.metaKey;
    if (hit) {
      if (additive) {
        sim.toggleTracked(hit);
      } else {
        const onlySelection = sim.tracked.length === 1 && sim.tracked[0] === hit;
        sim.setTracked(onlySelection ? [] : [hit]);
      }
    } else if (!additive) {
      sim.clearTracked();
    }
    setTrackedKinds((sim.tracked || []).map((p) => p.kind));
  }, []);

  const resetDefaults = () => {
    setMaxParticles(80);
    setEnergyMean(2500); setEnergyStd(600);
    setSpawnFadeIn(0.8);
    setStaleFadeStart(20); setStaleFadeEnd(30);
    setParticleScale(1);
    setTrackingBoxScale(1.2);
    setShowReactionBox(false); setReactionBoxLife(2); setReactionBoxScale(1.2);
    setHueShift(0); setSatShift(0); setValShift(0);
    setColormap(DEFAULT_COLORMAP);
    setThemeKey('daylight'); setPaletteOverride('');
    setDefsText(JSON.stringify(initial.defs, null, 2));
    setBimolText(JSON.stringify(initial.bimol, null, 2));
    setUnimolText(JSON.stringify(initial.unimol, null, 2));
    setSpawnableText(JSON.stringify(initial.spawnable, null, 2));
    setParseError('');
  };

  // ---------- formula builder ----------
  const handleAddFromFormula = () => {
    setFormulaMsg('');
    try {
      const struct = generateStructure({ formula: formulaInput, layout: formulaLayout });
      if (!struct.atoms.length) throw new Error('Formula parsed to zero atoms');
      const name = (formulaName || canonicalName(formulaInput)).trim();
      if (!name) throw new Error('Could not derive a kind name');
      const defs = JSON.parse(defsText);
      defs[name] = struct;
      setDefsText(JSON.stringify(defs, null, 2));
      const spawn = JSON.parse(spawnableText);
      if (!spawn.includes(name)) {
        spawn.push(name);
        setSpawnableText(JSON.stringify(spawn, null, 2));
      }
      setFormulaMsg(`Added kind "${name}" with ${struct.atoms.length} atoms.`);
    } catch (e) {
      setFormulaMsg(`Error: ${e.message || e}`);
    }
  };

  // ---------- import / export ----------
  const downloadConfig = () => {
    const cfg = {
      version: 2,
      options: {
        maxParticles, energyMean, energyStd,
        spawnFadeIn, staleFadeStart, staleFadeEnd,
        particleScale, reactionBoxLife, reactionBoxScale, trackingBoxScale,
      },
      display: {
        showReactionBox,
        colormap,
        hsv: { h: hueShift, s: satShift, v: valShift },
      },
      theme: themeKey, paletteOverride,
      defs: safeParse(defsText) ?? initial.defs,
      bimol: safeParse(bimolText) ?? initial.bimol,
      unimol: safeParse(unimolText) ?? initial.unimol,
      spawnable: safeParse(spawnableText) ?? initial.spawnable,
    };
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reaction-simulator-config-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const cfg = JSON.parse(String(reader.result));
        if (cfg.options) {
          if (cfg.options.maxParticles != null) setMaxParticles(cfg.options.maxParticles);
          if (cfg.options.energyMean != null) setEnergyMean(cfg.options.energyMean);
          if (cfg.options.energyStd != null) setEnergyStd(cfg.options.energyStd);
          if (cfg.options.spawnFadeIn != null) setSpawnFadeIn(cfg.options.spawnFadeIn);
          if (cfg.options.staleFadeStart != null) setStaleFadeStart(cfg.options.staleFadeStart);
          if (cfg.options.staleFadeEnd != null) setStaleFadeEnd(cfg.options.staleFadeEnd);
          if (cfg.options.particleScale != null) setParticleScale(cfg.options.particleScale);
          if (cfg.options.reactionBoxLife != null) setReactionBoxLife(cfg.options.reactionBoxLife);
          if (cfg.options.reactionBoxScale != null) setReactionBoxScale(cfg.options.reactionBoxScale);
          if (cfg.options.trackingBoxScale != null) setTrackingBoxScale(cfg.options.trackingBoxScale);
        }
        if (cfg.display) {
          if (typeof cfg.display.showReactionBox === 'boolean') setShowReactionBox(cfg.display.showReactionBox);
          if (cfg.display.colormap && COLORMAP_PRESETS[cfg.display.colormap]) setColormap(cfg.display.colormap);
          if (cfg.display.hsv) {
            if (cfg.display.hsv.h != null) setHueShift(cfg.display.hsv.h);
            if (cfg.display.hsv.s != null) setSatShift(cfg.display.hsv.s);
            if (cfg.display.hsv.v != null) setValShift(cfg.display.hsv.v);
          }
        }
        if (cfg.theme && THEMES[cfg.theme]) setThemeKey(cfg.theme);
        if (cfg.paletteOverride !== undefined) setPaletteOverride(cfg.paletteOverride || '');
        if (cfg.defs) setDefsText(JSON.stringify(cfg.defs, null, 2));
        if (cfg.bimol) setBimolText(JSON.stringify(cfg.bimol, null, 2));
        if (cfg.unimol) setUnimolText(JSON.stringify(cfg.unimol, null, 2));
        if (cfg.spawnable) setSpawnableText(JSON.stringify(cfg.spawnable, null, 2));
        setParseError('');
      } catch (e) {
        setParseError(`Upload parse error: ${e.message || e}`);
      }
    };
    reader.readAsText(file);
  };

  // Sorted lifetime kind list for analytics table.
  const analyticsRows = useMemo(() => {
    const rows = Object.entries(analytics.lifetime).map(([kind, count]) => ({
      kind, count,
      live: analytics.counts[kind] || 0,
      def: liveDefs[kind],
      formula: liveDefs[kind] ? defFormula(liveDefs[kind]) : '',
    }));
    rows.sort((a, b) => b.count - a.count);
    return rows;
  }, [analytics, liveDefs]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Head>
        <title>Reaction Simulator - INDEX</title>
        <meta name="description" content="Configurable particle reaction simulator." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main className="flex-1 relative overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0"
          onClick={handleCanvasClick}
          style={{ cursor: 'crosshair' }}
        >
          <canvas ref={canvasRef} className="block w-full h-full" />
        </div>

        {trackedKinds.length > 0 && !showSettings && (
          <div
            className="pointer-events-none absolute top-3 left-3 z-20 px-2.5 py-1 rounded bg-black/70 text-white text-xs shadow max-w-[60vw]"
          >
            Tracking{' '}
            {trackedKinds.map((k, i) => (
              <span key={i} className="font-mono">
                {i > 0 ? ', ' : ''}{k}
              </span>
            ))}
            <span className="opacity-60 ml-2">
              ({trackedKinds.length === 1
                  ? 'click again to stop'
                  : 'Ctrl-click to add/remove · click empty space to clear'})
            </span>
          </div>
        )}

        {showHint && (
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-secondary p-4 rounded-lg shadow-lg text-center pointer-events-none"
            style={{ opacity: 0, animation: 'rsFadeInOut 3s ease-in-out forwards' }}
          >
            <p>
              Press <kbd className="px-1.5 py-0.5 rounded border bg-white/60 dark:bg-black/40 text-sm">Esc</kbd> to open settings.
            </p>
            <p className="text-xs mt-1 opacity-70">Click a particle to track it. Hold Ctrl to track multiple. Default preset: citric-acid cycle.</p>
            <style jsx>{`
              @keyframes rsFadeInOut {
                0% { opacity: 0; }
                10% { opacity: 1; }
                80% { opacity: 1; }
                100% { opacity: 0; }
              }
            `}</style>
          </div>
        )}

        {showSettings && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => { applyConfig(); setShowSettings(false); }}
          >
            <div
              className="bg-secondary rounded-lg shadow-xl border w-[min(96vw,860px)] max-h-[88vh] overflow-auto p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Reaction Simulator — Settings</h2>
                <span className="text-xs opacity-60">Esc to close &amp; apply</span>
              </div>

              <Section title="World &amp; Energy" open={openSections.world} onToggle={() => toggleSection('world')}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Max particles: {maxParticles}</label>
                    <input type="range" min={10} max={400} step={1}
                      value={maxParticles}
                      onChange={(e) => setMaxParticles(Number(e.target.value))}
                      className="w-full" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Energy mean: {energyMean}</label>
                    <input type="number" min={0} step={50}
                      value={energyMean}
                      onChange={(e) => setEnergyMean(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-black/30" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Energy std (clipped at 0): {energyStd}</label>
                    <input type="number" min={0} step={50}
                      value={energyStd}
                      onChange={(e) => setEnergyStd(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-black/30" />
                  </div>
                </div>
              </Section>

              <Section title="Spawn &amp; Fade" open={openSections.fade} onToggle={() => toggleSection('fade')}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Spawn fade-in (s): {spawnFadeIn}</label>
                    <input type="range" min={0} max={5} step={0.1}
                      value={spawnFadeIn}
                      onChange={(e) => setSpawnFadeIn(Number(e.target.value))}
                      className="w-full" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Stale fade start (s): {staleFadeStart}</label>
                    <input type="number" min={0} step={1}
                      value={staleFadeStart}
                      onChange={(e) => setStaleFadeStart(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-black/30" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Stale fade end (s): {staleFadeEnd}</label>
                    <input type="number" min={0} step={1}
                      value={staleFadeEnd}
                      onChange={(e) => setStaleFadeEnd(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-black/30" />
                  </div>
                </div>
              </Section>

              <Section title="Display" open={openSections.display} onToggle={() => toggleSection('display')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Particle scale: {particleScale.toFixed(2)}×</label>
                    <input type="range" min={0.1} max={5} step={0.05}
                      value={particleScale}
                      onChange={(e) => setParticleScale(Number(e.target.value))}
                      className="w-full" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Tracking box scale: {trackingBoxScale.toFixed(2)}×
                    </label>
                    <input type="range" min={0.5} max={3} step={0.05}
                      value={trackingBoxScale}
                      onChange={(e) => setTrackingBoxScale(Number(e.target.value))}
                      className="w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="rs-rb"
                      checked={showReactionBox}
                      onChange={(e) => setShowReactionBox(e.target.checked)} />
                    <label htmlFor="rs-rb" className="text-sm font-medium">Show reaction bounding box</label>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Multi-select colormap</label>
                    <select value={colormap}
                      onChange={(e) => setColormap(e.target.value)}
                      className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-black/30">
                      {Object.entries(COLORMAP_PRESETS).map(([k, p]) => (
                        <option key={k} value={k}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {showReactionBox && (
                  <div className="mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium">
                          Reaction box fade-out (s): {reactionBoxLife.toFixed(2)}
                        </label>
                        <input type="range" min={0.1} max={6} step={0.1}
                          value={reactionBoxLife}
                          onChange={(e) => setReactionBoxLife(Number(e.target.value))}
                          className="w-full" />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium">
                          Reaction box scale: {reactionBoxScale.toFixed(2)}×
                        </label>
                        <input type="range" min={0.5} max={3} step={0.05}
                          value={reactionBoxScale}
                          onChange={(e) => setReactionBoxScale(Number(e.target.value))}
                          className="w-full" />
                      </div>
                    </div>
                    <p className="text-xs opacity-70 mt-1">
                      Each box carries a CV-style label with the detailed formula reaction.
                      The icon-style reaction badges are hidden while this is enabled.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Hue shift: {hueShift > 0 ? '+' : ''}{hueShift}°
                    </label>
                    <input type="range" min={-180} max={180} step={1}
                      value={hueShift}
                      onChange={(e) => setHueShift(Number(e.target.value))}
                      className="w-full" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Saturation shift: {satShift > 0 ? '+' : ''}{satShift.toFixed(2)}
                    </label>
                    <input type="range" min={-1} max={1} step={0.02}
                      value={satShift}
                      onChange={(e) => setSatShift(Number(e.target.value))}
                      className="w-full" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Value shift: {valShift > 0 ? '+' : ''}{valShift.toFixed(2)}
                    </label>
                    <input type="range" min={-1} max={1} step={0.02}
                      value={valShift}
                      onChange={(e) => setValShift(Number(e.target.value))}
                      className="w-full" />
                  </div>
                </div>
                <p className="text-xs opacity-70 mt-1">
                  All three HSV sliders are additive. Saturation and value are clipped to [0, 1].
                </p>
              </Section>

              <Section title="Theme" open={openSections.theme} onToggle={() => toggleSection('theme')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Theme</label>
                    <select value={themeKey}
                      onChange={(e) => setThemeKey(e.target.value)}
                      className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-black/30">
                      {Object.entries(THEMES).map(([k, t]) => (
                        <option key={k} value={k}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Particle palette override</label>
                    <select value={paletteOverride}
                      onChange={(e) => setPaletteOverride(e.target.value)}
                      className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-black/30">
                      <option value="">— Use theme default —</option>
                      {Object.keys(ATOM_PALETTES).map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Section>

              <Section title="Particle formulas" open={openSections.formulas} onToggle={() => toggleSection('formulas')}>
                <textarea
                  value={defsText}
                  onChange={(e) => setDefsText(e.target.value)}
                  spellCheck={false}
                  className="w-full h-44 px-2 py-1 rounded border font-mono text-xs bg-white/70 dark:bg-black/30"
                />
              </Section>

              <Section title="Reactions" open={openSections.reactions} onToggle={() => toggleSection('reactions')}>
                <label className="block mb-1 text-sm font-medium">Bimolecular (collision-triggered)</label>
                <textarea
                  value={bimolText}
                  onChange={(e) => setBimolText(e.target.value)}
                  spellCheck={false}
                  className="w-full h-28 px-2 py-1 rounded border font-mono text-xs bg-white/70 dark:bg-black/30"
                />
                <label className="block mt-3 mb-1 text-sm font-medium">Unimolecular (timer-triggered)</label>
                <textarea
                  value={unimolText}
                  onChange={(e) => setUnimolText(e.target.value)}
                  spellCheck={false}
                  className="w-full h-28 px-2 py-1 rounded border font-mono text-xs bg-white/70 dark:bg-black/30"
                />
                <label className="block mt-3 mb-1 text-sm font-medium">Spawnable kinds</label>
                <textarea
                  value={spawnableText}
                  onChange={(e) => setSpawnableText(e.target.value)}
                  spellCheck={false}
                  className="w-full h-16 px-2 py-1 rounded border font-mono text-xs bg-white/70 dark:bg-black/30"
                />
              </Section>

              <Section title="Build a kind from a formula" open={openSections.builder} onToggle={() => toggleSection('builder')}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Formula</label>
                    <input type="text" value={formulaInput}
                      onChange={(e) => setFormulaInput(e.target.value)}
                      placeholder="e.g. C6H12O6 or Ca(OH)2"
                      className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-black/30" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Kind name (optional)</label>
                    <input type="text" value={formulaName}
                      onChange={(e) => setFormulaName(e.target.value)}
                      placeholder="leaves blank → derived"
                      className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-black/30" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Layout</label>
                    <select value={formulaLayout}
                      onChange={(e) => setFormulaLayout(e.target.value)}
                      className="w-full px-2 py-1 rounded border bg-white/70 dark:bg-black/30">
                      <option value="auto">Auto</option>
                      <option value="ring">Ring</option>
                      <option value="chain">Chain</option>
                      <option value="grid">Grid</option>
                    </select>
                  </div>
                </div>
                <button type="button" onClick={handleAddFromFormula}
                  className="mt-3 button-info px-3 py-1.5 rounded text-sm">
                  Generate &amp; add kind
                </button>
                {formulaMsg && <p className="text-xs mt-2 opacity-80">{formulaMsg}</p>}
              </Section>

              <Section title="Analytics" open={openSections.analytics} onToggle={() => toggleSection('analytics')}>
                <p className="text-xs opacity-70 mb-2">
                  Total spawned: <span className="font-mono">{analytics.totalEver}</span>{' '}
                  · Reactions fired: <span className="font-mono">{analytics.totalReactions}</span>{' '}
                  · Live count: <span className="font-mono">{Object.values(analytics.counts).reduce((s, v) => s + v, 0)}</span>
                </p>

                <h3 className="text-sm font-semibold mb-1">Top 5 most likely to spawn next</h3>
                <div className="overflow-hidden border rounded mb-3">
                  <table className="w-full text-xs">
                    <thead className="bg-black/10 dark:bg-white/10">
                      <tr>
                        <th className="text-left px-2 py-1">Kind</th>
                        <th className="text-right px-2 py-1">Weight</th>
                        <th className="text-right px-2 py-1">Probability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.top5.length === 0 && (
                        <tr><td className="px-2 py-1 italic opacity-60" colSpan={3}>No spawnable kinds.</td></tr>
                      )}
                      {analytics.top5.map((row) => (
                        <tr key={row.kind} className="border-t border-black/10 dark:border-white/10">
                          <td className="px-2 py-1 font-mono">{row.kind}</td>
                          <td className="px-2 py-1 text-right">{row.weight.toFixed(2)}</td>
                          <td className="px-2 py-1 text-right">{row.percent.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className="text-sm font-semibold mb-1">Lifetime spawns by kind</h3>
                <div className="border rounded" style={{ maxHeight: 220, overflowY: 'auto' }}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-secondary">
                      <tr>
                        <th className="text-left px-2 py-1">Kind</th>
                        <th className="text-left px-2 py-1">Formula</th>
                        <th className="text-left px-2 py-1">Figure</th>
                        <th className="text-right px-2 py-1">Count</th>
                        <th className="text-right px-2 py-1">Live</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsRows.length === 0 && (
                        <tr><td className="px-2 py-1 italic opacity-60" colSpan={5}>No spawns yet.</td></tr>
                      )}
                      {analyticsRows.map((row) => (
                        <tr key={row.kind} className="border-t border-black/10 dark:border-white/10">
                          <td className="px-2 py-1 font-mono align-middle">{row.kind}</td>
                          <td className="px-2 py-1 font-mono align-middle">{row.formula}</td>
                          <td className="px-2 py-1 align-middle">
                            {row.def && <MoleculePreview def={row.def} palette={previewPalette} />}
                          </td>
                          <td className="px-2 py-1 text-right align-middle">{row.count}</td>
                          <td className="px-2 py-1 text-right align-middle">{row.live}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="Import / Export" open={openSections.io} onToggle={() => toggleSection('io')}>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={downloadConfig}
                    className="button-info px-3 py-1.5 rounded text-sm">Download config</button>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="button-info px-3 py-1.5 rounded text-sm">Upload config…</button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      handleUploadFile(f);
                      e.target.value = '';
                    }}
                  />
                </div>
              </Section>

              {parseError && (
                <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                  Parse error: {parseError}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => { if (applyConfig()) setShowSettings(false); }}
                  className="button-success flex-1 px-3 py-2 rounded text-sm">
                  Apply &amp; close
                </button>
                <button type="button" onClick={() => { applyConfig(); }}
                  className="button-info flex-1 px-3 py-2 rounded text-sm">
                  Apply (keep open)
                </button>
                <button type="button" onClick={resetDefaults}
                  className="button-warning flex-1 px-3 py-2 rounded text-sm">
                  Reset defaults
                </button>
                <button type="button" onClick={() => setShowSettings(false)}
                  className="button-secondary flex-1 px-3 py-2 rounded text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
