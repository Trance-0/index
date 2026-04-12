'use client'

import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

export default function Utils() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Utils - INDEX</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="min-h-full">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Utilities</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Timer Widget */}
              <a href="/utils/timer" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Timer</h2>
                  <p>Countdown timer and stopwatch if you hate google ones.</p>
                </div>
              </a>

              {/* Graph explorer */}
              <a href="/utils/graph_explorer" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Graph explorer</h2>
                  <p>Explore graphs in real time. (Testing, may not work)</p>
                </div>
              </a>

              {/* Random generator */}
              <a href="/utils/random_gen" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Random generator</h2>
                  <p>Generate a random number/array/graph/permutation or string as you need.</p>
                </div>
              </a>

              {/* QR code converter */}
              <a href="/utils/qr_convert" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">QR code converter</h2>
                  <p>Convert text to QR code and vice versa.</p>
                </div>
              </a>

              {/* Lofi camera */}
              <a href="/utils/lofi_camera" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Lofi camera</h2>
                  <p>Capture a camera frame and turn it into a blocky low-fi image you can save in one click.</p>
                </div>
              </a>

              {/* Division raster */}
              <a href="/utils/division_raster" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Division raster</h2>
                  <p>Impressive paper.js project.</p>
                </div>
              </a>


              {/* Dice Visualizer */}
              <a href="/utils/dice_visualizer" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Dice Visualizer</h2>
                  <p>Dice probability visualizer for CoC and DnD expressions.</p>
                </div>
              </a>

              {/* Workday2Calendar */}
              <a href="/utils/workday2calendar" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Workday2Calendar</h2>
                  <p>Convert your Workday schedule to a calendar format that can be imported into most calendar applications.</p>
                </div>
              </a>

              {/* Sheaf Explorer */}
              <a href="/utils/sheaf_explorer" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Sheaf Explorer</h2>
                  <p>Explore sheaves interactively.</p>
                </div>
              </a>
              
              {/* 100% Accurate MBTI Test */}
              <a href="/utils/mbti_test" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">100% Accurate Personality Test</h2>
                  <p>Take the 100% accurate IMSB <s>MBTI</s> personality test.</p>
                </div>
              </a>

              {/* Miku Tap */}
              <a href="/utils/miku_tap" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Miku Tap</h2>
                  <p>Interactive Miku Tap music experience.</p>
                  <p className="text-xs mt-2 opacity-60">Source: <span className="underline">github.com/HFIProgramming/mikutap</span></p>
                </div>
              </a>

              {/* Mathlib Explorer */}
              <a href="/utils/mathlib_explorer" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Mathlib Explorer</h2>
                  <p>Explore mathlib using a graph.</p>
                  <p className="text-xs mt-2 opacity-60">Source: <span className="underline">github.com/ekibun/mathlibexplorer</span></p>
                </div>
              </a>

              {/* Otto-hzys */}
              <a href="/utils/otto_hzys" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Otto-hzys</h2>
                  <p>Otto-hzys interactive experience.</p>
                  <p className="text-xs mt-2 opacity-60">Source: <span className="underline">github.com/hua-zhi-wan/otto-hzys</span></p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
