'use client'

import { useState } from 'react';
import { generatePermutation, formatPermutation } from './permutation';

export default function PermutationGenerator() {
  const [size, setSize] = useState(5);
  const [startValue, setStartValue] = useState(0);
  const [multiline, setMultiline] = useState(false);
  const [generated, setGenerated] = useState([]);
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');

  const handleGenerate = () => {
    setGenerated(generatePermutation(size, startValue));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatPermutation(generated, multiline));
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Random Permutation Generator</h1>
      <div className="bg-secondary rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Permutation Size</label>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(Math.max(1, parseInt(e.target.value)))}
              className="w-full p-2 border rounded"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Value</label>
            <input
              type="number"
              value={startValue}
              onChange={(e) => setStartValue(parseInt(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="multiline"
              checked={multiline}
              onChange={(e) => setMultiline(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="multiline" className="text-sm font-medium">Multiline Output</label>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full button-info text-white p-2 rounded hover:bg-blue-600 transition-colors"
          >
            Generate Permutation
          </button>

          {generated.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-medium">Generated Permutation:</h2>
                <button
                  onClick={copyToClipboard}
                  className="bg-secondary text-secondary px-3 py-1 rounded hover:bg-gray-200"
                >
                  {copyButtonText}
                </button>
              </div>
              <div className="p-4 bg-secondary border rounded">
                <pre className="font-mono whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                  {formatPermutation(generated, multiline)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
