'use client'

import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

export default function OttoHzys() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Otto-hzys - INDEX</title>
        <meta
          name="description"
          content="Otto-hzys interactive experience."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="min-h-full">
          <iframe
            src="https://otto.trance-0.com"
            title="Otto-hzys"
            className="w-full border-0"
            style={{ height: 'calc(100vh - 70px)' }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
