'use client'

import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

export default function MikuTap() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Miku Tap - INDEX</title>
        <meta
          name="description"
          content="Interactive Miku Tap music experience."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="min-h-full">
          <iframe
            src="https://mikutap.trance-0.com"
            title="Miku Tap"
            className="w-full border-0"
            style={{ height: 'calc(100vh - 70px)' }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
