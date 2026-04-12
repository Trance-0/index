'use client'

import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

export default function SheafExplorer() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Sheaf Explorer - INDEX</title>
        <meta
          name="description"
          content="Explore sheaves interactively."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="min-h-full">
          <iframe
            src="https://sheaf.trance-0.com"
            title="Sheaf Explorer"
            className="w-full border-0"
            style={{ height: 'calc(100vh - 70px)' }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
