'use client'

import { useState, useMemo } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

const ERROR_LEVELS = [
  { value: 'L', label: 'Low (~7%)', description: 'Recovers up to 7% of data' },
  { value: 'M', label: 'Medium (~15%)', description: 'Recovers up to 15% of data' },
  { value: 'Q', label: 'Quartile (~25%)', description: 'Recovers up to 25% of data' },
  { value: 'H', label: 'High (~30%)', description: 'Recovers up to 30% of data' },
];

const MAX_LEN_BY_LEVEL = { L: 2953, M: 2331, Q: 1663, H: 1273 };
const RECOVERY_RATIO_BY_LEVEL = { L: 0.07, M: 0.15, Q: 0.25, H: 0.30 };

const MODULE_TYPES = {
  finder:       { color: '#2563eb', label: 'Finder Pattern',      description: 'Three large squares at corners. Let scanners locate and orient the QR code.' },
  separator:    { color: '#cbd5e1', label: 'Separator',            description: 'One-module-wide white border isolating each finder pattern.' },
  timing:       { color: '#16a34a', label: 'Timing Pattern',       description: 'Alternating row/column at index 6. Establishes module size and grid.' },
  alignment:    { color: '#9333ea', label: 'Alignment Pattern',    description: 'Small squares (version ≥ 2) that help scanners correct for distortion.' },
  format:       { color: '#f97316', label: 'Format Information',   description: 'Encodes the error-correction level and mask pattern used.' },
  version:      { color: '#ec4899', label: 'Version Information',  description: 'Six-by-three block present in version 7+, encoding the QR version.' },
  dark_module:  { color: '#dc2626', label: 'Dark Module',          description: 'A single always-dark reference module at (4V+9, 8).' },
  data:         { color: '#facc15', label: 'Data & ECC',           description: 'Encoded payload and error-correction codewords. The part that actually holds your text.' },
};

const ALIGNMENT_CENTERS = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
  [6, 30, 54], [6, 32, 58], [6, 34, 62],
  [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74],
  [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90],
  [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170],
];

function classifyModules(size, version) {
  const n = size;
  const m = [];
  for (let r = 0; r < n; r++) m.push(Array(n).fill('data'));
  const set = (r, c, t) => { if (r >= 0 && r < n && c >= 0 && c < n) m[r][c] = t; };

  for (let dr = 0; dr < 7; dr++) {
    for (let dc = 0; dc < 7; dc++) {
      set(dr, dc, 'finder');
      set(dr, n - 7 + dc, 'finder');
      set(n - 7 + dr, dc, 'finder');
    }
  }
  for (let i = 0; i < 8; i++) {
    set(7, i, 'separator');
    set(i, 7, 'separator');
    set(7, n - 1 - i, 'separator');
    set(i, n - 8, 'separator');
    set(n - 8, i, 'separator');
    set(n - 1 - i, 7, 'separator');
  }
  for (let i = 8; i < n - 8; i++) {
    set(6, i, 'timing');
    set(i, 6, 'timing');
  }
  const centers = ALIGNMENT_CENTERS[version - 1] || [];
  for (const cr of centers) {
    for (const cc of centers) {
      const overlapsFinder =
        (cr < 8 && cc < 8) ||
        (cr < 8 && cc >= n - 8) ||
        (cr >= n - 8 && cc < 8);
      if (overlapsFinder) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          set(cr + dr, cc + dc, 'alignment');
        }
      }
    }
  }
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      set(8, i, 'format');
      set(i, 8, 'format');
    }
  }
  for (let i = 0; i < 8; i++) set(8, n - 1 - i, 'format');
  for (let i = 0; i < 7; i++) set(n - 1 - i, 8, 'format');

  if (version >= 7) {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 3; c++) {
        set(r, n - 11 + c, 'version');
        set(n - 11 + c, r, 'version');
      }
    }
  }

  set(n - 8, 8, 'dark_module');
  return m;
}

function extractMatrixFromImage(imageData, location, size) {
  const N = size;
  const tlf = location.topLeftFinderPattern;
  const trf = location.topRightFinderPattern;
  const blf = location.bottomLeftFinderPattern;
  if (!tlf || !trf || !blf) return null;

  const Ax = (trf.x - tlf.x) / (N - 7);
  const Bx = (blf.x - tlf.x) / (N - 7);
  const Cx = tlf.x - 3 * Ax - 3 * Bx;
  const Ay = (trf.y - tlf.y) / (N - 7);
  const By = (blf.y - tlf.y) / (N - 7);
  const Cy = tlf.y - 3 * Ay - 3 * By;

  const moduleW = Math.hypot(Ax, Ay);
  const moduleH = Math.hypot(Bx, By);
  const modulePx = (moduleW + moduleH) / 2;
  const sampleRadius = Math.max(0, Math.floor(modulePx * 0.25));

  const matrix = new Uint8Array(N * N);
  const w = imageData.width;
  const h = imageData.height;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cx = Ax * c + Bx * r + Cx;
      const cy = Ay * c + By * r + Cy;
      let sum = 0, count = 0;
      for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
        for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
          const px = Math.round(cx + dx), py = Math.round(cy + dy);
          if (px >= 0 && px < w && py >= 0 && py < h) {
            const idx = (py * w + px) * 4;
            const gray = (imageData.data[idx] + imageData.data[idx + 1] + imageData.data[idx + 2]) / 3;
            sum += gray;
            count++;
          }
        }
      }
      matrix[r * N + c] = count > 0 && sum / count < 128 ? 1 : 0;
    }
  }
  return matrix;
}

function findBestReference(decodedText, version, scannedMatrix, size, types) {
  let best = null;
  let bestDiff = Infinity;
  for (const level of ['L', 'M', 'Q', 'H']) {
    for (let mask = 0; mask < 8; mask++) {
      try {
        const qr = QRCode.create(decodedText, {
          errorCorrectionLevel: level,
          maskPattern: mask,
          version,
        });
        if (qr.modules.size !== size) continue;
        let diff = 0;
        for (let i = 0; i < size * size; i++) {
          if (scannedMatrix[i] !== qr.modules.data[i]) diff++;
        }
        if (diff < bestDiff) {
          bestDiff = diff;
          best = { level, mask, matrix: qr.modules.data };
        }
      } catch (e) {
        // skip incompatible combos
      }
    }
  }
  if (!best) return null;

  let fixedDiff = 0, dataDiff = 0, fixedTotal = 0, dataTotal = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      const isData = types[r][c] === 'data';
      const mismatch = scannedMatrix[i] !== best.matrix[i];
      if (isData) {
        dataTotal++;
        if (mismatch) dataDiff++;
      } else {
        fixedTotal++;
        if (mismatch) fixedDiff++;
      }
    }
  }
  return { ...best, diffCount: bestDiff, fixedDiff, dataDiff, fixedTotal, dataTotal };
}

function QRMatrixSVG({
  size,
  data,
  overrides,
  margin = 0,
  classifier,
  errorBits,
  onModuleClick,
  maxWidth = 500,
  id,
  interactive = false,
}) {
  const cellSize = 12;
  const totalModules = size + margin * 2;
  const svgSize = totalModules * cellSize;

  const rects = [];
  rects.push(
    <rect key="bg" x={0} y={0} width={svgSize} height={svgSize} fill="#ffffff" />
  );

  const errorOverlays = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`;
      const baseDark = data[r * size + c] === 1;
      const flipped = overrides && overrides.has(key);
      const isDark = flipped ? !baseDark : baseDark;
      const isError = errorBits && errorBits.has(key);

      let fill;
      if (classifier) {
        const type = classifier(r, c);
        const baseColor = MODULE_TYPES[type].color;
        fill = isDark ? baseColor : `${baseColor}33`;
      } else {
        fill = isDark ? '#000000' : '#ffffff';
      }

      const x = (c + margin) * cellSize;
      const y = (r + margin) * cellSize;

      rects.push(
        <rect
          key={key}
          x={x}
          y={y}
          width={cellSize}
          height={cellSize}
          fill={fill}
          onClick={onModuleClick ? () => onModuleClick(r, c) : undefined}
          style={onModuleClick ? { cursor: 'pointer' } : undefined}
        />
      );

      if (isError) {
        errorOverlays.push(
          <rect
            key={`err-${key}`}
            x={x + 1}
            y={y + 1}
            width={cellSize - 2}
            height={cellSize - 2}
            fill="none"
            stroke="#ef4444"
            strokeWidth={2}
            pointerEvents="none"
          />
        );
      }
    }
  }

  return (
    <svg
      id={id}
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      width="100%"
      style={{ maxWidth, height: 'auto', background: '#ffffff', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering={interactive ? 'crispEdges' : 'crispEdges'}
    >
      {rects}
      {errorOverlays}
    </svg>
  );
}

function Legend({ includeError, errorLabel, errorDescription }) {
  return (
    <>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(MODULE_TYPES).map(([key, info]) => (
          <div key={key} className="flex items-start gap-2 text-xs">
            <span
              className="inline-block w-4 h-4 rounded flex-shrink-0 mt-0.5"
              style={{ backgroundColor: info.color }}
            />
            <div>
              <div className="font-semibold">{info.label}</div>
              <div className="opacity-70">{info.description}</div>
            </div>
          </div>
        ))}
        {includeError && (
          <div className="flex items-start gap-2 text-xs">
            <span
              className="inline-block w-4 h-4 rounded flex-shrink-0 mt-0.5 border-2"
              style={{ borderColor: '#ef4444', backgroundColor: 'transparent' }}
            />
            <div>
              <div className="font-semibold">{errorLabel || 'Error Bit'}</div>
              <div className="opacity-70">{errorDescription || 'Scanned module does not match the reconstructed reference. Error correction rescued the decode.'}</div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 text-xs opacity-60">
        Fully saturated cells are dark modules; faded cells are light modules.
      </div>
    </>
  );
}

export default function QRConvert() {
  const [text, setText] = useState('');
  const [scannedText, setScannedText] = useState('');
  const [, setImageFile] = useState(null);
  const [errorLevel, setErrorLevel] = useState('L');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showDecodeAnalyzer, setShowDecodeAnalyzer] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [overrides, setOverrides] = useState(new Set());
  const [decodeAnalysis, setDecodeAnalysis] = useState(null);
  const [error, setError] = useState('');

  const maxLen = MAX_LEN_BY_LEVEL[errorLevel];

  const analysis = useMemo(() => {
    if (!text || error) return null;
    try {
      const qr = QRCode.create(text, { errorCorrectionLevel: errorLevel });
      const size = qr.modules.size;
      const data = qr.modules.data;
      const version = qr.version;
      const types = classifyModules(size, version);
      return { size, data, version, types };
    } catch (e) {
      return null;
    }
  }, [text, errorLevel, error]);

  const classifier = useMemo(() => {
    if (!analysis) return null;
    return (r, c) => analysis.types[r][c];
  }, [analysis]);

  const decodeClassifier = useMemo(() => {
    if (!decodeAnalysis) return null;
    return (r, c) => decodeAnalysis.types[r][c];
  }, [decodeAnalysis]);

  const handleModuleClick = (r, c) => {
    const key = `${r},${c}`;
    setOverrides(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleClearOverrides = () => setOverrides(new Set());

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (!code) {
          alert('No QR code found in image');
          setDecodeAnalysis(null);
          return;
        }
        setScannedText(code.data);
        const version = code.version;
        const N = 21 + 4 * (version - 1);
        if (version < 1 || version > 40) {
          setDecodeAnalysis(null);
          return;
        }
        const scanned = extractMatrixFromImage(imageData, code.location, N);
        if (!scanned) {
          setDecodeAnalysis(null);
          return;
        }
        const types = classifyModules(N, version);
        const best = findBestReference(code.data, version, scanned, N, types);
        const dataErrors = new Set();
        const fixedErrors = new Set();
        if (best) {
          for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
              const i = r * N + c;
              if (scanned[i] !== best.matrix[i]) {
                const key = `${r},${c}`;
                if (types[r][c] === 'data') dataErrors.add(key);
                else fixedErrors.add(key);
              }
            }
          }
        }
        const extractionOk = best && best.fixedTotal > 0
          ? best.fixedDiff / best.fixedTotal < 0.05
          : true;
        const textLikelyRight = best
          ? best.dataDiff / Math.max(1, best.dataTotal) < 0.15
          : false;
        setDecodeAnalysis({
          size: N,
          version,
          scanned,
          reference: best?.matrix || null,
          types,
          errors: dataErrors,
          fixedErrors,
          ecLevel: best?.level || null,
          maskPattern: best?.mask ?? null,
          errorCount: dataErrors.size,
          fixedDiff: best?.fixedDiff ?? 0,
          dataDiff: best?.dataDiff ?? 0,
          dataTotal: best?.dataTotal ?? 0,
          extractionOk,
          textLikelyRight,
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const renderMatrixToCanvas = () => {
    if (!analysis) return null;
    const { size, data } = analysis;
    const margin = 4;
    const pixelPerModule = 20;
    const totalPixels = (size + margin * 2) * pixelPerModule;
    const canvas = document.createElement('canvas');
    canvas.width = totalPixels;
    canvas.height = totalPixels;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalPixels, totalPixels);
    ctx.fillStyle = '#000000';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const baseDark = data[r * size + c] === 1;
        const flipped = overrides.has(`${r},${c}`);
        const isDark = flipped ? !baseDark : baseDark;
        if (isDark) {
          const x = (c + margin) * pixelPerModule;
          const y = (r + margin) * pixelPerModule;
          ctx.fillRect(x, y, pixelPerModule, pixelPerModule);
        }
      }
    }
    return canvas;
  };

  const handleSaveImage = () => {
    const canvas = renderMatrixToCanvas();
    if (!canvas) return;
    const pngFile = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = 'qr-code[' + text + '].png';
    downloadLink.href = pngFile;
    downloadLink.click();
  };

  const handleCopyImage = async () => {
    const canvas = renderMatrixToCanvas();
    if (!canvas) return;
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve));
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert('QR code image copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy image: ', err);
      alert('Failed to copy image to clipboard');
    }
  };

  const handleCopyScannedText = async () => {
    try {
      await navigator.clipboard.writeText(scannedText);
      alert('Text copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy text to clipboard');
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    if (newText.length > maxLen) {
      setError(`Text is too long for level ${errorLevel}. Maximum length is ${maxLen} characters.`);
    } else {
      setError('');
    }
    setText(newText);
    setOverrides(new Set());
  };

  const handleErrorLevelChange = (e) => {
    const newLevel = e.target.value;
    setErrorLevel(newLevel);
    const newMax = MAX_LEN_BY_LEVEL[newLevel];
    if (text.length > newMax) {
      setError(`Text is too long for level ${newLevel}. Maximum length is ${newMax} characters.`);
    } else {
      setError('');
    }
    setOverrides(new Set());
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>QR Code Tool</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Generate QR Code */}
            <div className="bg-secondary p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Generate QR Code</h2>
              <div className="space-y-4">
                <textarea
                  className={`w-full p-2 border rounded-md ${error ? 'border-red-500' : ''}`}
                  rows="4"
                  placeholder="Enter text to generate QR code"
                  value={text}
                  onChange={handleTextChange}
                />
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm underline opacity-80 hover:opacity-100"
                  >
                    {showAdvanced ? 'Hide' : 'Show'} advanced options
                  </button>
                </div>

                {showAdvanced && (
                  <div className="p-3 border rounded-md space-y-2">
                    <label className="block text-sm font-medium">
                      Error Correction Level
                    </label>
                    <select
                      value={errorLevel}
                      onChange={handleErrorLevelChange}
                      className="w-full p-2 border rounded-md bg-transparent"
                    >
                      {ERROR_LEVELS.map(lvl => (
                        <option key={lvl.value} value={lvl.value}>
                          {lvl.value} — {lvl.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs opacity-70">
                      {ERROR_LEVELS.find(l => l.value === errorLevel).description}.
                      Higher levels tolerate more damage but hold less data.
                    </p>
                  </div>
                )}

                {text && !error && analysis && (
                  <>
                    <div className="flex justify-center p-4 bg-secondary rounded-md">
                      <QRMatrixSVG
                        size={analysis.size}
                        data={analysis.data}
                        overrides={overrides}
                        margin={4}
                        maxWidth={240}
                        id="qr-code"
                        onModuleClick={editMode ? handleModuleClick : null}
                        interactive={editMode}
                      />
                    </div>
                    {editMode && (
                      <div className="text-xs opacity-70 text-center">
                        Click modules to flip them. {overrides.size} module{overrides.size === 1 ? '' : 's'} flipped.
                      </div>
                    )}
                    {(() => {
                      const totalModules = analysis.size * analysis.size;
                      const capacity = Math.floor(totalModules * RECOVERY_RATIO_BY_LEVEL[errorLevel]);
                      if (overrides.size > capacity) {
                        return (
                          <div className="text-xs p-2 rounded border border-yellow-500 bg-yellow-500/10">
                            <strong>Heads up:</strong> you have flipped {overrides.size} modules, which exceeds level {errorLevel}&apos;s
                            typical recovery window (~{capacity} modules for this size). Reed-Solomon may fail to recover the original
                            text, or — worse — resolve to a <em>different</em> valid codeword. If you decode this QR, the scanner could
                            return unrelated data, and the decode-side analyzer will flag the reconstruction as unreliable.
                            Consider raising the error-correction level in <em>advanced options</em> or flipping fewer bits.
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <div className="flex justify-center flex-wrap gap-2">
                      <button
                        onClick={handleSaveImage}
                        className="button-info text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Save Image
                      </button>
                      <button
                        onClick={handleCopyImage}
                        className="button-success text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Copy Image
                      </button>
                      <button
                        onClick={() => setShowAnalyzer(!showAnalyzer)}
                        className="button-info text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        {showAnalyzer ? 'Hide' : 'Show'} Analyzer
                      </button>
                      <button
                        onClick={() => setEditMode(!editMode)}
                        className={`${editMode ? 'bg-red-500 hover:bg-red-600' : 'button-info hover:bg-blue-600'} text-white px-4 py-2 rounded`}
                      >
                        {editMode ? 'Exit Edit Mode' : 'Edit / Flip Bits'}
                      </button>
                      {overrides.size > 0 && (
                        <button
                          onClick={handleClearOverrides}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                        >
                          Reset Edits
                        </button>
                      )}
                    </div>

                    {showAnalyzer && (
                      <div className="mt-4 p-4 bg-secondary rounded-md">
                        <div className="text-sm mb-2 opacity-80">
                          Version {analysis.version} · {analysis.size}×{analysis.size} modules · Level {errorLevel}
                        </div>
                        {overrides.size > 0 && (
                          <div className="text-sm mb-3">
                            <span className="text-red-500 font-semibold">
                              {overrides.size} module{overrides.size === 1 ? '' : 's'} flipped
                            </span>
                            {' '}(outlined in red below)
                          </div>
                        )}
                        <div className="flex justify-center">
                          <QRMatrixSVG
                            size={analysis.size}
                            data={analysis.data}
                            overrides={overrides}
                            errorBits={overrides.size > 0 ? overrides : null}
                            classifier={classifier}
                            margin={0}
                            maxWidth={500}
                          />
                        </div>
                        <Legend
                          includeError={overrides.size > 0}
                          errorLabel="Flipped Bit"
                          errorDescription="Module manually flipped in edit mode. These corrupt the QR; ECC can still recover the decode up to the level's threshold."
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Upload QR Code Image */}
            <div className="bg-secondary p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Upload QR Code Image</h2>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-secondary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-500 file:text-white
                  hover:file:bg-blue-600"
                />

                {scannedText && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Scanned Content:</h3>
                    <div className="p-4 bg-secondary rounded-md break-words overflow-y-auto max-h-48">
                      {scannedText}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={handleCopyScannedText}
                        className="button-success text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Copy Text
                      </button>
                      {decodeAnalysis && (
                        <button
                          onClick={() => setShowDecodeAnalyzer(!showDecodeAnalyzer)}
                          className="button-info text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          {showDecodeAnalyzer ? 'Hide' : 'Show'} Analyzer
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {showDecodeAnalyzer && decodeAnalysis && (
                  <div className="mt-4 p-4 bg-secondary rounded-md">
                    <div className="text-sm mb-2 opacity-80">
                      Version {decodeAnalysis.version} · {decodeAnalysis.size}×{decodeAnalysis.size} modules
                      {decodeAnalysis.ecLevel && ` · Inferred level ${decodeAnalysis.ecLevel} · Mask ${decodeAnalysis.maskPattern}`}
                    </div>
                    {!decodeAnalysis.extractionOk && (
                      <div className="text-sm mb-3 p-3 rounded border-2 border-yellow-500 bg-yellow-500/10">
                        <div className="font-semibold mb-1">⚠ Extraction may be inaccurate</div>
                        <div className="text-xs">
                          {decodeAnalysis.fixedDiff} fixed-pattern modules (finder, timing, alignment, etc.) in the scanned matrix
                          don&apos;t match the expected layout for version {decodeAnalysis.version}. Sampling is probably misaligned,
                          so the error count below is unreliable. Try re-uploading a sharper or higher-resolution image.
                        </div>
                      </div>
                    )}
                    {decodeAnalysis.extractionOk && !decodeAnalysis.textLikelyRight && (
                      <div className="text-sm mb-3 p-3 rounded border-2 border-yellow-500 bg-yellow-500/10">
                        <div className="font-semibold mb-1">⚠ Decoded text may not match what was encoded</div>
                        <div className="text-xs">
                          {decodeAnalysis.dataDiff} of {decodeAnalysis.dataTotal} data modules differ from the reference reconstructed
                          from the decoded text — far more than Reed-Solomon should need to correct. This typically means too many
                          bits were flipped: the decoder couldn&apos;t recover the original message and settled on a <em>different</em>
                          valid codeword. The &quot;scanned content&quot; above is probably not what was originally encoded, so the error
                          count below is comparing against the wrong reference and is not meaningful. The actual number of flipped
                          bits is likely much smaller. Try a QR with a higher error-correction level (Q or H) if you want to flip
                          many bits and still recover the original text.
                        </div>
                      </div>
                    )}
                    <div className="text-sm mb-3">
                      <span className={decodeAnalysis.errorCount > 0 ? 'text-red-500 font-semibold' : 'opacity-80'}>
                        {decodeAnalysis.errorCount} data module error bit{decodeAnalysis.errorCount === 1 ? '' : 's'}
                      </span>
                      {decodeAnalysis.errorCount > 0 && ' (outlined in red — differ from reference reconstructed from decoded text)'}
                    </div>
                    <div className="flex justify-center">
                      <QRMatrixSVG
                        size={decodeAnalysis.size}
                        data={decodeAnalysis.scanned}
                        classifier={decodeClassifier}
                        errorBits={decodeAnalysis.errors}
                        margin={0}
                        maxWidth={500}
                      />
                    </div>
                    <Legend includeError={true} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
