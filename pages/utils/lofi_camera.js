'use client'

import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

const MIN_BLOCK_SIZE = 5;
const MAX_BLOCK_SIZE = 100;
const CACHE_KEY = 'lofiCameraSourceImage';
const FILTER_MODES = [
  { value: 'average', label: 'Average' },
  { value: 'extrema', label: 'Extrema' },
  { value: 'blackwhite', label: 'Black and White' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
  { value: 'vivid', label: 'Vivid' },
  { value: 'inverse', label: 'Inverse' }
];

function clampBlockSize(value) {
  const numericValue = Number.parseInt(value, 10);
  if (Number.isNaN(numericValue)) {
    return 30;
  }
  return Math.min(MAX_BLOCK_SIZE, Math.max(MIN_BLOCK_SIZE, Math.round(numericValue / 5) * 5));
}

function getBlockColor(data, width, startX, startY, regionWidth, regionHeight, mode) {
  let redTotal = 0;
  let greenTotal = 0;
  let blueTotal = 0;
  let alphaTotal = 0;
  let count = 0;

  let brightest = { luminance: -1, r: 0, g: 0, b: 0, a: 255 };
  let darkest = { luminance: 256, r: 0, g: 0, b: 0, a: 255 };

  for (let y = startY; y < startY + regionHeight; y += 1) {
    for (let x = startX; x < startX + regionWidth; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      redTotal += r;
      greenTotal += g;
      blueTotal += b;
      alphaTotal += a;
      count += 1;

      if (luminance > brightest.luminance) {
        brightest = { luminance, r, g, b, a };
      }
      if (luminance < darkest.luminance) {
        darkest = { luminance, r, g, b, a };
      }
    }
  }

  if (count === 0) {
    return [0, 0, 0, 255];
  }

  if (mode === 'extrema') {
    const brightestDistance = Math.abs(brightest.luminance - 128);
    const darkestDistance = Math.abs(darkest.luminance - 128);
    const chosen = brightestDistance >= darkestDistance ? brightest : darkest;
    return [chosen.r, chosen.g, chosen.b, chosen.a];
  }

  return [
    Math.round(redTotal / count),
    Math.round(greenTotal / count),
    Math.round(blueTotal / count),
    Math.round(alphaTotal / count)
  ];
}

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function applyColorMode(color, mode) {
  const [r, g, b, a] = color;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  switch (mode) {
    case 'blackwhite': {
      const monochrome = clampChannel(luminance);
      return [monochrome, monochrome, monochrome, a];
    }
    case 'warm':
      return [
        clampChannel(r * 1.12 + 10),
        clampChannel(g * 0.98 + 4),
        clampChannel(b * 0.82),
        a
      ];
    case 'cold':
      return [
        clampChannel(r * 0.88),
        clampChannel(g * 1.01 + 4),
        clampChannel(b * 1.14 + 12),
        a
      ];
    case 'vivid': {
      const vividBoost = 1.18;
      return [
        clampChannel((r - luminance) * vividBoost + luminance + 8),
        clampChannel((g - luminance) * vividBoost + luminance + 8),
        clampChannel((b - luminance) * vividBoost + luminance + 8),
        a
      ];
    }
    case 'inverse':
      return [255 - r, 255 - g, 255 - b, a];
    default:
      return [r, g, b, a];
  }
}

export default function LofiCamera() {
  const videoRef = useRef(null);
  const sourceCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [hasCachedSource, setHasCachedSource] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [error, setError] = useState('');
  const [blockSize, setBlockSize] = useState(30);
  const [mode, setMode] = useState('average');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const cachedImage = localStorage.getItem(CACHE_KEY);
    if (cachedImage) {
      setHasCachedSource(true);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!editorReady) {
      return;
    }

    const sourceCanvas = sourceCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;

    if (!sourceCanvas || !outputCanvas) {
      return;
    }

    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
    const outputContext = outputCanvas.getContext('2d');

    if (!sourceContext || !outputContext) {
      return;
    }

    setProcessing(true);

    const { width, height } = sourceCanvas;
    const imageData = sourceContext.getImageData(0, 0, width, height);

    outputCanvas.width = width;
    outputCanvas.height = height;
    outputContext.clearRect(0, 0, width, height);
    outputContext.imageSmoothingEnabled = false;

    for (let startY = 0; startY < height; startY += blockSize) {
      const regionHeight = Math.min(blockSize, height - startY);
      for (let startX = 0; startX < width; startX += blockSize) {
        const regionWidth = Math.min(blockSize, width - startX);
        const reducedColor = getBlockColor(
          imageData.data,
          width,
          startX,
          startY,
          regionWidth,
          regionHeight,
          mode === 'extrema' ? 'extrema' : 'average'
        );
        const [r, g, b, a] = applyColorMode(reducedColor, mode);

        outputContext.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        outputContext.fillRect(startX, startY, regionWidth, regionHeight);
      }
    }

    setProcessing(false);
  }, [blockSize, editorReady, mode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const startCamera = async () => {
    try {
      setError('');

      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);
    } catch {
      setError('Unable to access the camera. Check browser permissions and HTTPS/local access.');
      setCameraReady(false);
    }
  };

  const loadCachedImageToEditor = (cachedImage) => {
    const sourceCanvas = sourceCanvasRef.current;
    if (!sourceCanvas) {
      return;
    }

    const sourceContext = sourceCanvas.getContext('2d');
    if (!sourceContext) {
      setError('Canvas is not available in this browser.');
      return;
    }

    const image = new Image();
    image.onload = () => {
      sourceCanvas.width = image.width;
      sourceCanvas.height = image.height;
      sourceContext.clearRect(0, 0, image.width, image.height);
      sourceContext.drawImage(image, 0, 0);
      setEditorReady(true);
      setHasCachedSource(true);
      setError('');
    };
    image.onerror = () => {
      setError('Unable to load the cached capture.');
    };
    image.src = cachedImage;
  };

  const cacheAndOpenImage = (dataUrl) => {
    localStorage.setItem(CACHE_KEY, dataUrl);
    loadCachedImageToEditor(dataUrl);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const sourceCanvas = sourceCanvasRef.current;

    if (!video || !sourceCanvas || !video.videoWidth || !video.videoHeight) {
      setError('Camera frame is not ready yet.');
      return;
    }

    const sourceContext = sourceCanvas.getContext('2d');
    if (!sourceContext) {
      setError('Canvas is not available in this browser.');
      return;
    }

    sourceCanvas.width = video.videoWidth;
    sourceCanvas.height = video.videoHeight;
    sourceContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    const cachedImage = sourceCanvas.toDataURL('image/png');
    cacheAndOpenImage(cachedImage);
    stopCamera();
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        stopCamera();
        cacheAndOpenImage(reader.result);
      } else {
        setError('Unable to read the selected image.');
      }
    };
    reader.onerror = () => {
      setError('Unable to read the selected image.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const openEditorFromCache = () => {
    const cachedImage = localStorage.getItem(CACHE_KEY);
    if (!cachedImage) {
      setError('No cached capture found yet. Capture a frame first.');
      return;
    }
    loadCachedImageToEditor(cachedImage);
  };

  const saveImage = () => {
    const outputCanvas = outputCanvasRef.current;
    if (!outputCanvas) {
      setError('Capture an image before saving.');
      return;
    }

    const imageUrl = outputCanvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = imageUrl;
    downloadLink.download = `lofi-camera-${Date.now()}.png`;
    downloadLink.click();
  };

  const goBackToCapture = () => {
    setEditorReady(false);
    setError('');
    startCamera();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Lofi Camera</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-3">Lofi Camera</h1>
            <p className="mb-6 text-secondary">
              Capture first, then fine-tune the blocky output in a focused editor built for phone screens.
            </p>

            {!editorReady ? (
              <section className="bg-secondary rounded-lg shadow-md p-4 md:p-6">
                <h2 className="text-xl font-semibold mb-4">Capture Source Image</h2>
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full rounded-lg border aspect-[3/4] md:aspect-video object-cover bg-black"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={startCamera}
                      className="button-info px-3 py-2 rounded transition-colors text-sm"
                      type="button"
                    >
                      Start
                    </button>
                    <button
                      onClick={captureFrame}
                      className="button-success px-3 py-2 rounded transition-colors text-sm"
                      type="button"
                      disabled={!cameraReady}
                    >
                      Capture
                    </button>
                    <button
                      onClick={handleUploadClick}
                      className="px-3 py-2 rounded transition-colors text-sm bg-yellow-500 text-black hover:bg-yellow-400 dark:bg-yellow-600 dark:text-white dark:hover:bg-yellow-500"
                      type="button"
                    >
                      Upload
                    </button>
                    <button
                      onClick={openEditorFromCache}
                      className="button-warning px-3 py-2 rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                      disabled={!hasCachedSource}
                    >
                      Last
                    </button>
                  </div>
                  <p className="text-sm text-secondary">
                    After capture, the source image is cached in your browser so you can keep editing without re-taking the shot.
                  </p>
                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}
                </div>
              </section>
            ) : (
              <section className="bg-secondary rounded-lg shadow-md p-4 md:p-6">
                <h2 className="text-xl font-semibold mb-4">Adjust Processed Image</h2>
                <div className="space-y-4">
                  <canvas
                    ref={outputCanvasRef}
                    className="w-full rounded-lg border bg-black aspect-[3/4] md:aspect-video object-contain"
                  />
                  {processing && (
                    <p className="text-sm text-secondary">Processing image blocks...</p>
                  )}

                  <div className="space-y-4 pt-2">
                    <div>
                      <label htmlFor="blockSizeRange" className="block mb-2 font-medium">
                        Convolution window size
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          id="blockSizeRange"
                          type="range"
                          min={MIN_BLOCK_SIZE}
                          max={MAX_BLOCK_SIZE}
                          step={5}
                          value={blockSize}
                          onChange={(event) => setBlockSize(clampBlockSize(event.target.value))}
                          className="w-full"
                        />
                        <input
                          type="number"
                          min={MIN_BLOCK_SIZE}
                          max={MAX_BLOCK_SIZE}
                          step={5}
                          value={blockSize}
                          onChange={(event) => setBlockSize(clampBlockSize(event.target.value))}
                          className="w-20 px-3 py-2 border rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="lofiMode" className="block mb-2 font-medium">
                        Block color mode
                      </label>
                      <select
                        id="lofiMode"
                        value={mode}
                        onChange={(event) => setMode(event.target.value)}
                        className="w-full px-3 py-2 border rounded"
                      >
                        {FILTER_MODES.map((filterMode) => (
                          <option key={filterMode.value} value={filterMode.value}>
                            {filterMode.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 sticky bottom-0 bg-inherit">
                    <button
                      onClick={goBackToCapture}
                      className="button-warning flex-1 px-4 py-3 rounded transition-colors"
                      type="button"
                    >
                      Back
                    </button>
                    <button
                      onClick={saveImage}
                      className="button-success flex-1 px-4 py-3 rounded transition-colors"
                      type="button"
                      disabled={processing}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </section>
            )}

            <canvas ref={sourceCanvasRef} className="hidden" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
