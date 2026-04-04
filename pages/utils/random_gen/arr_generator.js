'use client'

import { useState } from 'react';

function isIntegerRange(minValue, maxValue) {
  return Number.isInteger(minValue) && Number.isInteger(maxValue);
}

function getArrayLength(rows, cols, is2D) {
  return is2D ? rows * cols : rows;
}

function shuffle(values) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function reshapeTo2D(values, rows, cols) {
  return Array.from({ length: rows }, (_, rowIndex) =>
    values.slice(rowIndex * cols, rowIndex * cols + cols)
  );
}

export default function RandomArrayGenerator() {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(100);
  const [is2D, setIs2D] = useState(false);
  const [multiline, setMultiline] = useState(false);
  const [unique, setUnique] = useState(false);
  const [sorted, setSorted] = useState(false);
  const [inverseSort, setInverseSort] = useState(false);
  const [generatedArray, setGeneratedArray] = useState([]);
  const [warning, setWarning] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');

  const arrayLength = getArrayLength(rows, cols, is2D);
  const integerMode = isIntegerRange(minValue, maxValue);
  const integerRangeSize = integerMode ? maxValue - minValue + 1 : null;
  const hasImpossibleUniqueRequest = unique && integerMode && integerRangeSize < arrayLength;

  const generateValue = () => {
    if (integerMode) {
      return Math.floor(Math.random() * (maxValue - minValue + 1) + minValue);
    }
    return Math.random() * (maxValue - minValue) + minValue;
  };

  const generateRandomArray = () => {
    setWarning('');

    if (Number.isNaN(minValue) || Number.isNaN(maxValue) || minValue > maxValue) {
      setWarning('Minimum value must be less than or equal to maximum value.');
      setGeneratedArray([]);
      return;
    }

    if (hasImpossibleUniqueRequest) {
      setWarning('Unique values are impossible with the current integer range and array length.');
      setGeneratedArray([]);
      return;
    }

    let values;

    if (unique) {
      if (integerMode) {
        const pool = shuffle(
          Array.from({ length: integerRangeSize }, (_, index) => minValue + index)
        );
        values = pool.slice(0, arrayLength);
      } else {
        const seen = new Set();
        values = [];
        while (values.length < arrayLength) {
          const value = Number(generateValue().toFixed(6));
          if (!seen.has(value)) {
            seen.add(value);
            values.push(value);
          }
        }
      }
    } else {
      values = Array.from({ length: arrayLength }, () => generateValue());
    }

    if (is2D) {
      const reshapedValues = reshapeTo2D(values, rows, cols);
      if (sorted) {
        reshapedValues.forEach((row) => {
          row.sort((a, b) => inverseSort ? b - a : a - b);
        });
      }
      setGeneratedArray(reshapedValues);
      return;
    }

    if (sorted) {
      values.sort((a, b) => inverseSort ? b - a : a - b);
    }

    setGeneratedArray(values);
  };

  const formatArray = (arr) => {
    if (is2D) {
      const formattedRows = arr.map((row) => `[${row.join(', ')}]`);
      return multiline ? '[\n' + formattedRows.join(',\n') + '\n]' : '[' + formattedRows.join(', ') + ']';
    }
    return multiline ? '[\n' + arr.join(', ') + '\n]' : '[' + arr.join(', ') + ']';
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatArray(generatedArray));
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
              placeholder={is2D ? 'Enter number of rows' : 'Enter array length'}
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
                placeholder="Enter number of columns"
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
              placeholder="Enter minimum value"
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
              placeholder="Enter maximum value"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is2D"
                checked={is2D}
                onChange={(e) => setIs2D(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="is2D" className="text-sm font-medium">
                Generate 2D Array
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="multiline"
                checked={multiline}
                onChange={(e) => setMultiline(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="multiline" className="text-sm font-medium">
                Multiline Output
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="unique"
                checked={unique}
                onChange={(e) => setUnique(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="unique" className="text-sm font-medium">
                Unique Values
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sorted"
                checked={sorted}
                onChange={(e) => {
                  setSorted(e.target.checked);
                  if (!e.target.checked) {
                    setInverseSort(false);
                  }
                }}
                className="rounded"
              />
              <label htmlFor="sorted" className="text-sm font-medium">
                Sorted Array
              </label>
            </div>
            {sorted && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="inverseSort"
                  checked={inverseSort}
                  onChange={(e) => setInverseSort(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="inverseSort" className="text-sm font-medium">
                  Descending Order
                </label>
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
            onClick={generateRandomArray}
            className="w-full button-info text-white p-2 rounded hover:bg-blue-600 transition-colors"
          >
            Generate Random Array
          </button>

          {generatedArray.length > 0 && (
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
                  {formatArray(generatedArray)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
