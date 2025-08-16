

'use client'

import Head from 'next/head';
import Navbar from './navbar';
import Footer from './footer';

export default function Privacy() {
    return (
        <div className="min-h-screen flex flex-col">
            <Head>
                <title>Privacy Policy - INDEX</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Navbar />
            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="rounded-lg shadow-md p-6 mb-6">
                            <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

                            <div className="prose prose-lg max-w-none">
                                <p className="text-gray-600 mb-6">
                                    Last updated: 2025-08-17
                                </p>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Information We Collect</h2>
                                    <p className="text-gray-700 mb-4">
                                        We collect (we define collect as storing any of your inputs outside of your local machine) <strong>absolutely no information</strong> from you, every data is stored in your local cache. Please refer to the <a href="https://nextjs.org/docs/app/guides/caching" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Next.js Caching</a> documentation for technical details.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Us</h2>
                                    <p className="text-gray-700 mb-4">
                                        If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:me@trance-0.com" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">me@trance-0.com</a>
                                    </p>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
