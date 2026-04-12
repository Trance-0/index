'use client'

import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

export default function MbtiTest() {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>100% Accurate MBTI Test - INDEX</title>
        <meta
          name="description"
          content="Take the 100% accurate MBTI personality test."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="min-h-full">
          <iframe
            src="https://test.trance-0.com"
            title="100% Accurate MBTI Test"
            className="w-full border-0"
            style={{ height: 'calc(100vh - 70px)' }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
