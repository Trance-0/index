'use client'

import { useState } from 'react';
import { generateGraph } from './graph';

export default function GraphGenerator() {
  const [numNodes, setNumNodes] = useState(5);
  const [treeHeight, setTreeHeight] = useState(3);
  const [outputType, setOutputType] = useState('adjlist');
  const [graphType, setGraphType] = useState('acyclic');
  const [minWeight, setMinWeight] = useState(1);
  const [maxWeight, setMaxWeight] = useState(10);
  const [minNodeValue, setMinNodeValue] = useState(0);
  const [maxNodeValue, setMaxNodeValue] = useState(100);
  const [generated, setGenerated] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');
  const [multiline, setMultiline] = useState(false);

  const handleGenerate = () => {
    const result = generateGraph({
      outputType, graphType,
      numNodes, treeHeight,
      minWeight, maxWeight,
      minNodeValue, maxNodeValue,
    });
    setGenerated(JSON.stringify(result, null, multiline ? 2 : 0));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generated);
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
  };

  const isTree = outputType === 'tree' || outputType === 'binarytree';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Graph Generator</h1>
      <div className="bg-secondary rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {isTree ? (
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Tree Height</label>
                <input
                  type="number" min="1" max="6"
                  value={treeHeight}
                  onChange={(e) => setTreeHeight(parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Number of Nodes</label>
                <input
                  type="number" min="2" max="20"
                  value={numNodes}
                  onChange={(e) => setNumNodes(parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Output Type</label>
              <select
                value={outputType}
                onChange={(e) => setOutputType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="adjlist">Adjacency List</option>
                <option value="edgelist">Edge List</option>
                <option value="tree">Tree</option>
                <option value="binarytree">Binary Tree</option>
              </select>
            </div>

            {!isTree && (
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Graph Type</label>
                <select
                  value={graphType}
                  onChange={(e) => setGraphType(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="acyclic">Acyclic</option>
                  <option value="bidirectional">Bidirectional</option>
                  <option value="cyclic">Cyclic</option>
                  <option value="sparse">Sparse</option>
                </select>
              </div>
            )}

            {outputType === 'binarytree' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Node Value</label>
                  <input
                    type="number"
                    value={minNodeValue}
                    onChange={(e) => setMinNodeValue(parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Node Value</label>
                  <input
                    type="number"
                    value={maxNodeValue}
                    onChange={(e) => setMaxNodeValue(parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </>
            )}

            {outputType === 'edgelist' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Edge Weight</label>
                  <input
                    type="number"
                    value={minWeight}
                    onChange={(e) => setMinWeight(parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Edge Weight</label>
                  <input
                    type="number"
                    value={maxWeight}
                    onChange={(e) => setMaxWeight(parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox" id="gg-multiline"
                checked={multiline}
                onChange={(e) => setMultiline(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="gg-multiline" className="text-sm font-medium">Multiline Output</label>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full button-info text-white p-2 rounded hover:bg-blue-600 transition-colors"
          >
            Generate Graph
          </button>

          {generated && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-medium">Generated Graph:</h2>
                <button
                  onClick={copyToClipboard}
                  className="bg-secondary text-secondary px-3 py-1 rounded hover:bg-gray-200"
                >
                  {copyButtonText}
                </button>
              </div>
              <textarea
                value={generated}
                readOnly
                className="w-full h-64 p-2 border rounded font-mono text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
