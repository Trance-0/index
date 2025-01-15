'use client'

import { useState } from 'react';
import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';
import {blake3, blake2s, blake2b, sha256, sha384, sha512, crc32, crc64 } from 'hash-wasm';

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const MIN_PASSWORD_LENGTH = 8;
const ALGORITHMS = {
  'blake3': blake3,
  'blake2s': blake2s, 
  'blake2b': blake2b,
  'sha256': sha256,
  'sha384': sha384,
  'sha512': sha512,
  'crc32': crc32,
  'crc64': crc64
};

export default function PasswordGenerator() {
  const [seed, setSeed] = useState('');
  const [salt, setSalt] = useState('');
  const [email, setEmail] = useState('');
  const [site, setSite] = useState('');
  const [charset, setCharset] = useState(DEFAULT_CHARSET);
  const [length, setLength] = useState(16);
  const [algorithm, setAlgorithm] = useState('blake3');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [steps, setSteps] = useState([]);

  const addStep = (step) => {
    setSteps(prev => [...prev, step]);
  };

  const generatePassword = async () => {
    setSteps([]);
    
    if (length < MIN_PASSWORD_LENGTH) {
      addStep(`Error: Password length must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    
    try {
      // Step 1: Combine inputs
      const combinedInput = `${seed}:${salt}:${email}:${site}`;
      addStep('1. Combined inputs for processing');
      
      // Step 2: Initial key derivation using selected algorithm
      const initialHash = await ALGORITHMS[algorithm](combinedInput);
      addStep(`2. Performed initial key derivation with ${algorithm}`);

      // Step 3: Additional mixing with site
      const mixInput = initialHash + (site || 'defaultSite'); 
      const mixedHash = await ALGORITHMS[algorithm](mixInput);
      addStep('3. Additional mixing with site-specific salt');

      // Step 4: Convert to password using charset and ensure at least one hyphen
      let password = '';
      const bytes = new Uint8Array(mixedHash.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      
      // Generate password with extra character for hyphen insertion
      for (let i = 0; i < length + 1; i++) {
        password += charset[bytes[i] % charset.length];
      }

      // Insert hyphen at random position
      const hyphenPos = bytes[length] % (password.length - 1) + 1; // Avoid first position
      password = password.slice(0, hyphenPos) + '-' + password.slice(hyphenPos);
      
      addStep('4. Converted hash to password and inserted required hyphen');

      setGeneratedPassword(password);
      
    } catch (error) {
      console.error('Error generating password:', error);
      addStep(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Password Generator</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex-grow bg-gray-100">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Password Generator</h1>

          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Algorithm</label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {Object.keys(ALGORITHMS).map(algo => (
                    <option key={algo} value={algo}>{algo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Seed</label>
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter seed value"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Salt (optional)</label>
                <input
                  type="text"
                  value={salt}
                  onChange={(e) => setSalt(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter salt value"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Site</label>
                <input
                  type="text"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., google.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Character Set</label>
                <input
                  type="text"
                  value={charset}
                  onChange={(e) => setCharset(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter character set"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password Length (min: {MIN_PASSWORD_LENGTH})</label>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(Math.max(MIN_PASSWORD_LENGTH, parseInt(e.target.value)))}
                  className="w-full p-2 border rounded"
                  min={MIN_PASSWORD_LENGTH}
                  max="64"
                />
              </div>

              <button
                onClick={generatePassword}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Generate Password
              </button>

              {generatedPassword && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h3 className="font-bold mb-2">Generated Password:</h3>
                  <div className="font-mono bg-white p-2 border rounded select-all">
                    {generatedPassword}
                  </div>
                </div>
              )}

              {steps.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold mb-2">Generation Steps:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {steps.map((step, index) => (
                      <li key={index} className="text-sm text-gray-600">{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
