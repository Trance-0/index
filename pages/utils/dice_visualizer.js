'use client'

import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

export default function DiceVisualizer() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Dice Visualizer - INDEX</title>
        <meta
          name="description"
          content="Embedded Dice Probability Visualizer for Call of Cthulhu and Dungeons and Dragons dice expressions."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="min-h-full">
          <iframe
            src="https://dice-visualize.vercel.app/"
            title="Dice Visualizer"
            className="w-full border-0"
            style={{ height: 'calc(100vh - 70px)' }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
