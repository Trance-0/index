'use client'

import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

export default function MathlibExplorer() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Mathlib Explorer - INDEX</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="min-h-full">
            <iframe src="https://mle.trance-0.com" className="w-full" style={{ height: `calc(100vh - 70px)` }}></iframe>
        </div>
      </main>
    </div>
  );
}
