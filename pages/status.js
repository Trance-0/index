'use client'

import Head from 'next/head';
import Navbar from './navbar';
import Footer from './footer';

export default function Status() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Status - INDEX</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="min-h-full">
            <iframe src="https://status.trance-0.com" className="w-full" style={{ height: `calc(100vh - 70px)` }}></iframe>
        </div>
      </main>
    </div>
  );
}
