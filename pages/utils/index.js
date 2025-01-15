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

      <main className="flex-grow bg-gray-100">
        <Navbar />
        <div className="min-h-full">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Utilities</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Timer Widget */}
              <a href="/utils/timer">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <h2 className="text-xl font-semibold mb-4">Timer</h2>
                  <p className="text-gray-600">Countdown timer and stopwatch if you hate google ones.</p>
                </div>
              </a>

              {/* Graph explorer */}
              <a href="/utils/graph_explorer">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <h2 className="text-xl font-semibold mb-4">Graph explorer</h2>
                  <p className="text-gray-600">Explore graphs in real time.</p>
                </div>
              </a>

              {/* Graph generator */}
              <a href="/utils/graph_generator">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <h2 className="text-xl font-semibold mb-4">Graph generator</h2>
                  <p className="text-gray-600">Generate a graph.</p>
                </div>
              </a>

              {/* Password generator */}
              <a href="/utils/pass_gen">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <h2 className="text-xl font-semibold mb-4">Password generator</h2>
                  <p className="text-gray-600">Generate a random password.</p>
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
