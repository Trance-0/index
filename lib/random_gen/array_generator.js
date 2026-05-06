'use client'

import { useState } from 'react';
import {
  generateRandomArray,
  formatArray,
  isIntegerRange,
} from './array';

export default function ArrayGenerator() {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(100);
  const [is2D, setIs2D] = useState(false);
  const [multiline, setMultiline] = useState(false);
  const [unique, setUnique] = useState(false);
  const [sorted, setSorted] = useState(false);
  const [inverseSort, setInverseSort] = useState(false);
  const [generated, setGenerated] = useState([]);
  const [warning, setWarning] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');

  const arrayLength = is2D ? rows * cols : rows;
  const integerMode = isIntegerRange(minValue, maxValue);
  const integerRangeSize = integerMode ? maxValue - minValue + 1 : null;
  const hasImpossibleUniqueRequest = unique && integerMode && integerRangeSize < arrayLength;

  const handleGenerate = () => {
    const { values, error } = generateRandomArray({
      rows, cols, minValue, maxValue,
      is2D, unique, sorted, inverseSort,
    });
    setWarning(error || '');
    setGenerated(values);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatArray(generated, { is2D, multiline }));
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Random Array Generator</h1>
      <div className="bg-secondary rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {is2D ? 'Number of Rows' : 'Array Length'}
            </label>
            <input
              type="number"
              value={rows}
              onChange={(e) => setRows(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full p-2 border rounded"
              min="1"
            />
          </div>

          {is2D && (
            <div>
              <label className="block text-sm font-medium mb-1">Number of Columns</label>
              <input
                type="number"
                value={cols}
                onChange={(e) => setCols(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full p-2 border rounded"
                min="1"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Minimum Value</label>
            <input
              value={minValue}
              onChange={(e) => {
                if (e.target.value === '' || !e.target.value.match(/^-?\d*(\.\d+)?$/)) return;
                setMinValue(parseFloat(e.target.value));
              }}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Maximum Value</label>
            <input
              value={maxValue}
              onChange={(e) => {
                if (e.target.value === '' || !e.target.value.match(/^-?\d*(\.\d+)?$/)) return;
                setMaxValue(parseFloat(e.target.value));
              }}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="is2D" checked={is2D}
                onChange={(e) => setIs2D(e.target.checked)} className="rounded" />
              <label htmlFor="is2D" className="text-sm font-medium">Generate 2D Array</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="multiline" checked={multiline}
                onChange={(e) => setMultiline(e.target.checked)} className="rounded" />
              <label htmlFor="multiline" className="text-sm font-medium">Multiline Output</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="unique" checked={unique}
                onChange={(e) => setUnique(e.target.checked)} className="rounded" />
              <label htmlFor="unique" className="text-sm font-medium">Unique Values</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="sorted" checked={sorted}
                onChange={(e) => {
                  setSorted(e.target.checked);
                  if (!e.target.checked) setInverseSort(false);
                }} className="rounded" />
              <label htmlFor="sorted" className="text-sm font-medium">Sorted Array</label>
            </div>
            {sorted && (
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="inverseSort" checked={inverseSort}
                  onChange={(e) => setInverseSort(e.target.checked)} className="rounded" />
                <label htmlFor="inverseSort" className="text-sm font-medium">Descending Order</label>
              </div>
            )}
          </div>

          {hasImpossibleUniqueRequest && (
            <div className="inline-flex items-center rounded-full bg-yellow-200 px-3 py-1 text-sm font-medium text-yellow-900 dark:bg-yellow-700 dark:text-yellow-50">
              Unique integer array is impossible with the current range.
            </div>
          )}
          {warning && (
            <div className="inline-flex items-center rounded-full bg-red-200 px-3 py-1 text-sm font-medium text-red-900 dark:bg-red-700 dark:text-red-50">
              {warning}
            </div>
          )}

          <button
            onClick={handleGenerate}
            className="w-full button-info text-white p-2 rounded hover:bg-blue-600 transition-colors"
          >
            Generate Random Array
          </button>

          {generated.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-medium">Generated Array:</h2>
                <button
                  onClick={copyToClipboard}
                  className="bg-secondary text-secondary px-3 py-1 rounded hover:bg-gray-200"
                >
                  {copyButtonText}
                </button>
              </div>
              <div className="p-4 bg-secondary border rounded">
                <pre className="font-mono whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                  {formatArray(generated, { is2D, multiline })}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
