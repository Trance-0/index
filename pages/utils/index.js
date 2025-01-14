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

      <main className="flex-grow">
        <Navbar />
        <div className="min-h-full bg-gray-100">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Utilities</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Calculator Widget */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold mb-4">Calculator</h2>
                <p className="text-gray-600">Basic calculator functionality</p>
              </div>

              {/* Weather Widget */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold mb-4">Weather</h2>
                <p className="text-gray-600">Current weather conditions</p>
              </div>

              {/* Notes Widget */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold mb-4">Quick Notes</h2>
                <p className="text-gray-600">Simple note-taking tool</p>
              </div>

              {/* Timer Widget */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold mb-4">Timer</h2>
                <p className="text-gray-600">Countdown timer and stopwatch</p>
              </div>

              {/* Unit Converter Widget */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold mb-4">Unit Converter</h2>
                <p className="text-gray-600">Convert between different units</p>
              </div>

              {/* Color Picker Widget */}
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold mb-4">Color Picker</h2>
                <p className="text-gray-600">Color selection and conversion tool</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
