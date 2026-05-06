// Pure helpers for graph / tree generation.

const randInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function generateTree(n) {
  const result = new Array(n).fill(-1);
  for (let i = 1; i < n - 1; i++) {
    const possibleParents = [];
    for (let j = i + 1; j < n; j++) possibleParents.push(j);
    const idx = Math.floor(Math.random() * possibleParents.length);
    result[i] = possibleParents[idx];
  }
  if (n > 1) {
    const firstNode = Math.floor(Math.random() * (n - 1));
    result[firstNode] = n - 1;
  }
  return result;
}

export function generateBinaryTree(height, minNodeValue, maxNodeValue) {
  const maxNodes = Math.pow(2, height) - 1;
  const result = new Array(maxNodes).fill(null);
  result[0] = randInt(minNodeValue, maxNodeValue);
  for (let level = 0; level < height - 1; level++) {
    const start = Math.pow(2, level) - 1;
    const end = Math.pow(2, level + 1) - 1;
    for (let i = start; i < end; i++) {
      if (result[i] !== null) {
        const left = 2 * i + 1, right = 2 * i + 2;
        if (Math.random() > 0.3 && left < maxNodes) result[left] = randInt(minNodeValue, maxNodeValue);
        if (Math.random() > 0.3 && right < maxNodes) result[right] = randInt(minNodeValue, maxNodeValue);
      }
    }
  }
  return result;
}

export function generateAcyclicGraph(numNodes, outputType, minWeight, maxWeight) {
  if (outputType === 'adjlist') {
    const adjList = Array(numNodes).fill().map(() => []);
    for (let i = 0; i < numNodes - 1; i++) {
      const numEdges = Math.floor(Math.random() * (numNodes - i - 1)) + 1;
      const targets = Array.from({ length: numNodes - i - 1 }, (_, k) => k + i + 1);
      for (let j = 0; j < numEdges; j++) {
        const idx = Math.floor(Math.random() * targets.length);
        adjList[i].push(targets[idx]);
        targets.splice(idx, 1);
      }
    }
    return adjList;
  }
  const edges = [];
  for (let i = 0; i < numNodes - 1; i++) {
    const numEdges = Math.floor(Math.random() * (numNodes - i - 1)) + 1;
    const targets = Array.from({ length: numNodes - i - 1 }, (_, k) => k + i + 1);
    for (let j = 0; j < numEdges; j++) {
      const idx = Math.floor(Math.random() * targets.length);
      edges.push([i, targets[idx], randInt(minWeight, maxWeight)]);
      targets.splice(idx, 1);
    }
  }
  return edges;
}

export function generateBidirectionalGraph(numNodes, outputType, minWeight, maxWeight) {
  if (outputType === 'adjlist') {
    const adjList = Array(numNodes).fill().map(() => []);
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        if (Math.random() > 0.5) { adjList[i].push(j); adjList[j].push(i); }
      }
    }
    return adjList;
  }
  const edges = [];
  for (let i = 0; i < numNodes; i++) {
    for (let j = i + 1; j < numNodes; j++) {
      if (Math.random() > 0.5) {
        const w = randInt(minWeight, maxWeight);
        edges.push([i, j, w]); edges.push([j, i, w]);
      }
    }
  }
  return edges;
}

export function generateCyclicGraph(numNodes, outputType, minWeight, maxWeight) {
  if (outputType === 'adjlist') {
    const adjList = Array(numNodes).fill().map(() => []);
    for (let i = 0; i < numNodes; i++) adjList[i].push((i + 1) % numNodes);
    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
        if (i !== j && Math.random() > 0.7) adjList[i].push(j);
      }
    }
    return adjList;
  }
  const edges = [];
  for (let i = 0; i < numNodes; i++) {
    edges.push([i, (i + 1) % numNodes, randInt(minWeight, maxWeight)]);
  }
  for (let i = 0; i < numNodes; i++) {
    for (let j = 0; j < numNodes; j++) {
      if (i !== j && Math.random() > 0.7) edges.push([i, j, randInt(minWeight, maxWeight)]);
    }
  }
  return edges;
}

export function generateSparseGraph(numNodes, outputType, minWeight, maxWeight) {
  if (outputType === 'adjlist') {
    const adjList = Array(numNodes).fill().map(() => []);
    for (let i = 0; i < numNodes; i++) {
      if (Math.random() > 0.7) {
        const numEdges = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < numEdges; j++) {
          const t = Math.floor(Math.random() * numNodes);
          if (t !== i) adjList[i].push(t);
        }
      }
    }
    return adjList;
  }
  const edges = [];
  for (let i = 0; i < numNodes; i++) {
    if (Math.random() > 0.7) {
      const numEdges = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < numEdges; j++) {
        const t = Math.floor(Math.random() * numNodes);
        if (t !== i) edges.push([i, t, randInt(minWeight, maxWeight)]);
      }
    }
  }
  return edges;
}

// Single dispatch entry point.
export function generateGraph({
  outputType, graphType,
  numNodes, treeHeight,
  minWeight, maxWeight,
  minNodeValue, maxNodeValue,
}) {
  if (outputType === 'tree') return generateTree(numNodes);
  if (outputType === 'binarytree') return generateBinaryTree(treeHeight, minNodeValue, maxNodeValue);
  switch (graphType) {
    case 'acyclic':       return generateAcyclicGraph(numNodes, outputType, minWeight, maxWeight);
    case 'bidirectional': return generateBidirectionalGraph(numNodes, outputType, minWeight, maxWeight);
    case 'cyclic':        return generateCyclicGraph(numNodes, outputType, minWeight, maxWeight);
    case 'sparse':        return generateSparseGraph(numNodes, outputType, minWeight, maxWeight);
    default:              return [];
  }
}
