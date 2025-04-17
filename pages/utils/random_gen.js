'use client'

import { useState } from 'react';
import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';
import ArrayGenerator from './random_gen/arr_generator';
import GraphGenerator from './random_gen/graph_generator';
import StringGenerator from './random_gen/string_generator';
import PermutationGenerator from './random_gen/perm_generator';

export default function RandomDataGenerator() {
  const [activeTab, setActiveTab] = useState('string');

  const tabs = [
    { id: 'string', label: 'String Generator' },
    { id: 'array', label: 'Array Generator' },
    { id: 'graph', label: 'Graph Generator' },
    { id: 'perm', label: 'Permutation Generator' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Random Data Generator</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Random Data Generator</h1>
          <div className="bg-secondary rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <div className="flex border-b mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`px-4 py-2 ${
                    activeTab === tab.id ? 'border-b-2 border-blue-500' : ''
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {activeTab === 'string' && <StringGenerator />}
              {activeTab === 'array' && <ArrayGenerator />}
              {activeTab === 'graph' && <GraphGenerator />}
              {activeTab === 'perm' && <PermutationGenerator />}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
