'use client'

import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

export default function GeometryOfMusic() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Geometry of Music - INDEX</title>
        <meta
          name="description"
          content="Explore the geometry of music interactively."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="min-h-full">
          <iframe
            src="https://geometry-of-music.pages.dev/"
            title="Geometry of Music"
            className="w-full border-0"
            style={{ height: 'calc(100vh - 70px - 68px)' }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
