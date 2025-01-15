'use client'

import { useState } from 'react';
import Navbar from '../navbar';
import Footer from '../footer';

export default function GraphGenerator() {
  const [numNodes, setNumNodes] = useState(5);
  const [treeHeight, setTreeHeight] = useState(3);
  const [outputType, setOutputType] = useState('adjlist');
  const [graphType, setGraphType] = useState('acyclic');
  const [minWeight, setMinWeight] = useState(1);
  const [maxWeight, setMaxWeight] = useState(10);
  const [minNodeValue, setMinNodeValue] = useState(0);
  const [maxNodeValue, setMaxNodeValue] = useState(100);
  const [generatedGraph, setGeneratedGraph] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');

  const generateGraph = () => {
    let result;
    
    if (outputType === 'binarytree' || outputType === 'tree') {
      if (outputType === 'binarytree') {
        result = generateBinaryTree(treeHeight);
      } else {
        result = generateTree(numNodes);
      }
    } else {
      switch(graphType) {
        case 'acyclic':
          result = generateAcyclicGraph();
          break;
        case 'bidirectional':
          result = generateBidirectionalGraph();
          break;
        case 'cyclic':
          result = generateCyclicGraph();
          break;
        case 'sparse':
          result = generateSparseGraph();
          break;
        default:
          result = [];
      }
    }

    setGeneratedGraph(JSON.stringify(result, null, 2));
  };

  const generateTree = (n) => {
    const result = new Array(n).fill(-1);
    
    // Start from index 1 since 0 will be assigned later
    for (let i = 1; i < n-1; i++) {
      // Randomly choose a parent from nodes that come after this one
      const possibleParents = [];
      for (let j = i+1; j < n; j++) {
        possibleParents.push(j);
      }
      const parentIdx = Math.floor(Math.random() * possibleParents.length);
      result[i] = possibleParents[parentIdx];
    }
    
    // Ensure at least one node points to the root (last node)
    if (n > 1) {
      const firstNode = Math.floor(Math.random() * (n-1));
      result[firstNode] = n-1;
    }
    
    return result;
  };

  const generateBinaryTree = (height) => {
    const maxNodes = Math.pow(2, height) - 1;
    const result = new Array(maxNodes).fill(null);
    
    // Generate random values for nodes
    let nodeCount = 1; // Start with root
    result[0] = Math.floor(Math.random() * (maxNodeValue - minNodeValue + 1)) + minNodeValue;
    
    // For each level except the last
    for (let level = 0; level < height-1; level++) {
      const levelStart = Math.pow(2, level) - 1;
      const levelEnd = Math.pow(2, level+1) - 1;
      
      // For each node in current level
      for (let i = levelStart; i < levelEnd; i++) {
        if (result[i] !== null) {
          // Randomly decide to add children
          const leftChild = 2*i + 1;
          const rightChild = 2*i + 2;
          
          if (Math.random() > 0.3 && leftChild < maxNodes) {
            result[leftChild] = Math.floor(Math.random() * (maxNodeValue - minNodeValue + 1)) + minNodeValue;
            nodeCount++;
          }
          
          if (Math.random() > 0.3 && rightChild < maxNodes) {
            result[rightChild] = Math.floor(Math.random() * (maxNodeValue - minNodeValue + 1)) + minNodeValue;
            nodeCount++;
          }
        }
      }
    }
    
    return result;
  };

  const generateSparseGraph = () => {
    if (outputType === 'adjlist') {
      const adjList = Array(numNodes).fill().map(() => []);
      // Only connect some nodes, leaving others isolated
      const connectedNodes = new Set();
      
      // Ensure at least one node is connected
      const firstNode = Math.floor(Math.random() * numNodes);
      connectedNodes.add(firstNode);

      // Randomly connect some nodes
      for (let i = 0; i < numNodes; i++) {
        if (Math.random() > 0.7) { // 30% chance to connect this node
          connectedNodes.add(i);
          const numEdges = Math.floor(Math.random() * 2) + 1; // 1-2 edges per connected node
          for (let j = 0; j < numEdges; j++) {
            const target = Math.floor(Math.random() * numNodes);
            if (target !== i) {
              adjList[i].push(target);
              connectedNodes.add(target);
            }
          }
        }
      }
      return adjList;
    } else { // edgelist
      const edges = [];
      const connectedNodes = new Set();
      
      // Ensure at least one node is connected
      const firstNode = Math.floor(Math.random() * numNodes);
      connectedNodes.add(firstNode);

      // Randomly connect some nodes
      for (let i = 0; i < numNodes; i++) {
        if (Math.random() > 0.7) { // 30% chance to connect this node
          connectedNodes.add(i);
          const numEdges = Math.floor(Math.random() * 2) + 1; // 1-2 edges per connected node
          for (let j = 0; j < numEdges; j++) {
            const target = Math.floor(Math.random() * numNodes);
            if (target !== i) {
              const weight = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
              edges.push([i, target, weight]);
              connectedNodes.add(target);
            }
          }
        }
      }
      return edges;
    }
  };

  const generateAcyclicGraph = () => {
    if (outputType === 'adjlist') {
      const adjList = Array(numNodes).fill().map(() => []);
      for (let i = 0; i < numNodes - 1; i++) {
        const numEdges = Math.floor(Math.random() * (numNodes - i - 1)) + 1;
        const possibleTargets = Array.from({length: numNodes-i-1}, (_, k) => k+i+1);
        for (let j = 0; j < numEdges; j++) {
          const targetIdx = Math.floor(Math.random() * possibleTargets.length);
          adjList[i].push(possibleTargets[targetIdx]);
          possibleTargets.splice(targetIdx, 1);
        }
      }
      return adjList;
    } else { // edgelist
      const edges = [];
      for (let i = 0; i < numNodes - 1; i++) {
        const numEdges = Math.floor(Math.random() * (numNodes - i - 1)) + 1;
        const possibleTargets = Array.from({length: numNodes-i-1}, (_, k) => k+i+1);
        for (let j = 0; j < numEdges; j++) {
          const targetIdx = Math.floor(Math.random() * possibleTargets.length);
          const weight = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
          edges.push([i, possibleTargets[targetIdx], weight]);
          possibleTargets.splice(targetIdx, 1);
        }
      }
      return edges;
    }
  };

  const generateBidirectionalGraph = () => {
    if (outputType === 'adjlist') {
      const adjList = Array(numNodes).fill().map(() => []);
      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          if (Math.random() > 0.5) {
            adjList[i].push(j);
            adjList[j].push(i);
          }
        }
      }
      return adjList;
    } else { // edgelist
      const edges = [];
      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          if (Math.random() > 0.5) {
            const weight = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
            edges.push([i, j, weight]);
            edges.push([j, i, weight]);
          }
        }
      }
      return edges;
    }
  };

  const generateCyclicGraph = () => {
    if (outputType === 'adjlist') {
      const adjList = Array(numNodes).fill().map(() => []);
      // First create a cycle to ensure connectivity
      for (let i = 0; i < numNodes; i++) {
        adjList[i].push((i + 1) % numNodes);
      }
      // Add random additional edges
      for (let i = 0; i < numNodes; i++) {
        for (let j = 0; j < numNodes; j++) {
          if (i !== j && Math.random() > 0.7) {
            adjList[i].push(j);
          }
        }
      }
      return adjList;
    } else { // edgelist
      const edges = [];
      // Create cycle
      for (let i = 0; i < numNodes; i++) {
        const weight = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
        edges.push([i, (i + 1) % numNodes, weight]);
      }
      // Add random additional edges
      for (let i = 0; i < numNodes; i++) {
        for (let j = 0; j < numNodes; j++) {
          if (i !== j && Math.random() > 0.7) {
            const weight = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
            edges.push([i, j, weight]);
          }
        }
      }
      return edges;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedGraph);
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">Graph Generator</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {(outputType === 'tree' || outputType === 'binarytree') ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tree Height
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={treeHeight}
                    onChange={(e) => setTreeHeight(parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Nodes
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={numNodes}
                    onChange={(e) => setNumNodes(parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Type
                </label>
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
              
              {(outputType !== 'tree' && outputType !== 'binarytree') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graph Type
                  </label>
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

              {(outputType === 'binarytree') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Node Value
                    </label>
                    <input
                      type="number"
                      value={minNodeValue}
                      onChange={(e) => setMinNodeValue(parseInt(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Node Value
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Edge Weight
                    </label>
                    <input
                      type="number"
                      value={minWeight}
                      onChange={(e) => setMinWeight(parseInt(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Edge Weight
                    </label>
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
            
            <button
              onClick={generateGraph}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Generate Graph
            </button>
            
            {generatedGraph && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Generated Graph
                  </label>
                  <button
                    onClick={copyToClipboard}
                    className="bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200"
                  >
                    {copyButtonText}
                  </button>
                </div>
                <textarea
                  value={generatedGraph}
                  readOnly
                  className="w-full h-64 p-2 border rounded font-mono text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
