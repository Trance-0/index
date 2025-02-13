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

              {/* Graph generator */}
              <a href="/utils/graph_generator" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Graph generator</h2>
                  <p>Generate a graph.</p>
                </div>
              </a>

              {/* Password generator */}
              <a href="/utils/pass_gen" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Password generator</h2>
                  <p>Generate a random password. (Testing, may not work as expected)</p>
                </div>
              </a>

              {/* Random generator */}
              <a href="/utils/random_gen" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Random generator</h2>
                  <p>Generate a random number or string as you need.</p>
                </div>
              </a>

              {/* Random array generator */}
              <a href="/utils/random_arr_gen" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Random array generator</h2>
                  <p>Generate a random array as test cases.</p>
                </div>
              </a>

              {/* QR code converter */}
              <a href="/utils/qr_convert" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">QR code converter</h2>
                  <p>Convert text to QR code and vice versa.</p>
                </div>
              </a>

              {/* Division raster */}
              <a href="/utils/division_raster" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Division raster</h2>
                  <p>Impressive paper.js project.</p>
                </div>
              </a>

              {/* Mathlib Explorer */}
              <a href="/utils/mathlib_explorer" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Mathlib Explorer</h2>
                  <p>Explore mathlib using a graph.</p>
                </div>
              </a>

              {/* Chat with AI */}
              <a href="/utils/chatroom" className="h-full">
                <div className="rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow h-full">
                  <h2 className="text-xl font-semibold mb-4">Chat with AI</h2>
                  <p>Chat with AI using OpenAI's API.</p>
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
