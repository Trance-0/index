'use client'

import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import Navbar from '../navbar';
import Footer from '../footer';

export default function Graph() {
  const [input, setInput] = useState('');
  const [graphType, setGraphType] = useState('adjmap');
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [parseStatus, setParseStatus] = useState('');
  const [startAtOne, setStartAtOne] = useState(false);
  const [weightIndex, setWeightIndex] = useState(2);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Check if the screen is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    
    // Load history from localStorage on mount
    const savedHistory = localStorage.getItem('graphHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    // Initialize default graph for debugging
    if (containerRef.current && !svgRef.current) {
      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;

      // Create SVG
      const svg = d3.select(containerRef.current)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      // Add zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(zoom);

      // Create a group for the graph
      const g = svg.append('g');
      svgRef.current = svg;

      // Define arrow marker
      svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25) // Position of arrow relative to node
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#999");

      // Sample data for debugging
      const defaultData = {
        nodes: [
          { id: '0', label: '0' },
          { id: '1', label: '1' },
          { id: '2', label: '2' }
        ],
        edges: [
          { source: '0', target: '1' },
          { source: '1', target: '2' },
          { source: '2', target: '0' }
        ]
      };

      // Create force simulation
      const simulation = d3.forceSimulation(defaultData.nodes)
        .force('link', d3.forceLink(defaultData.edges)
          .id(d => d.id)
          .distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2));

      // Draw edges
      const edges = g.selectAll('.edge')
        .data(defaultData.edges)
        .join('line')
        .attr('class', 'edge')
        .style('stroke', '#999')
        .style('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');

      // Draw nodes
      const nodes = g.selectAll('.node')
        .data(defaultData.nodes)
        .join('g')
        .attr('class', 'node')
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

      nodes.append('circle')
        .attr('r', 15)
        .style('fill', '#fff')
        .style('stroke', '#999')
        .style('stroke-width', 2);

      nodes.append('text')
        .text(d => d.label)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .style('font-size', '12px');

      // Update positions on simulation tick
      simulation.on('tick', () => {
        edges
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        nodes
          .attr('transform', d => `translate(${d.x},${d.y})`);
      });

      // Drag functions
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    }

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);

  }, []);

  const validateInput = (input, type) => {
    try {
      const parsed = JSON.parse(input);

      if (!Array.isArray(parsed)) {
        return { isValid: false, error: 'Input must be an array' };
      }

      switch (type) {
        case 'adjmap':
          if (!parsed.every(arr => Array.isArray(arr))) {
            return { isValid: false, error: 'Each element must be an array of adjacent nodes' };
          }
          // Check if all elements are valid node indices
          const maxNode = startAtOne ? parsed.length : parsed.length - 1;
          const minNode = startAtOne ? 1 : 0;
          for (let i = 0; i < parsed.length; i++) {
            if (!parsed[i].every(n => Number.isInteger(n) && n >= minNode && n <= maxNode)) {
              return { isValid: false, error: `Invalid node indices in adjacency map (must be between ${minNode} and ${maxNode})` };
            }
          }
          break;

        case 'edgelist':
          if (!parsed.every(arr => Array.isArray(arr) && (arr.length === 2 || arr.length === 3))) {
            return { isValid: false, error: 'Each element must be a pair [source, target] or triple [source, target, weight]' };
          }
          // Check if all nodes are integers
          if (!parsed.every(edge => edge.every((val, idx) => 
            idx === weightIndex - 1 ? typeof val === 'number' : Number.isInteger(val)
          ))) {
            return { isValid: false, error: 'Nodes must be integers and weight (if present) must be a number' };
          }
          break;

        case 'tree':
        case 'binarytree':
          if (!parsed.every(val => Number.isInteger(val) || val === null || val === -1)) {
            return { isValid: false, error: 'Tree nodes must be integers, null, or -1' };
          }
          if (type === 'binarytree' && !parsed.some(val => val === null)) {
            return { isValid: false, error: 'Binary tree must use null for empty nodes' };
          }
          if (type === 'tree' && !parsed.some(val => val === -1)) {
            return { isValid: false, error: 'Tree must use -1 for empty nodes' };
          }
          break;

        default:
          return { isValid: false, error: 'Invalid graph type' };
      }

      return { isValid: true, data: parsed };
    } catch (e) {
      return { isValid: false, error: 'Invalid JSON format' };
    }
  };

  const processData = () => {
    const validation = validateInput(input, graphType);
    
    if (!validation.isValid) {
      setParseStatus(`Error: ${validation.error}`);
      return;
    }

    setParseStatus('Valid input format. Rendering graph...');
    setData(validation.data);

    // Add to history
    const newEntry = {
      type: graphType,
      data: input,
      timestamp: new Date().toISOString()
    };
    const updatedHistory = [...history, newEntry];
    setHistory(updatedHistory);
    localStorage.setItem('graphHistory', JSON.stringify(updatedHistory));

    // Update visualization
    if (svgRef.current) {
      updateVisualization(validation.data);
    }
  };

  const updateVisualization = (data) => {
    const svg = svgRef.current;
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;

    // Clear previous graph
    svg.selectAll('*').remove();

    // Define arrow marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    // Convert data to nodes and links based on graph type
    let nodes = [];
    let links = [];

    if (graphType === 'adjmap') {
      const offset = startAtOne ? 1 : 0;
      nodes = data.map((_, i) => ({ id: (i + offset).toString(), label: (i + offset).toString() }));
      for (let i = 0; i < data.length; i++) {
        if (Array.isArray(data[i])) {
          data[i].forEach(j => {
            links.push({ 
              source: (i + offset).toString(), 
              target: j.toString()
            });
          });
        }
      }
    } else if (graphType === 'edgelist') {
      const nodeSet = new Set();
      data.forEach(edge => {
        nodeSet.add(edge[0].toString());
        nodeSet.add(edge[1].toString());
      });
      nodes = Array.from(nodeSet).map(id => ({ id, label: id }));
      links = data.map(edge => ({
        source: edge[0].toString(),
        target: edge[1].toString(),
        weight: edge[weightIndex - 1]
      }));
    } else if (graphType === 'binarytree' || graphType === 'tree') {
      // Convert array representation to nodes and links
      nodes = data
        .map((value, index) => {
          if (value === null || value === -1) return null;
          return { id: index.toString(), label: value.toString() };
        })
        .filter(node => node !== null);

      links = [];
      for (let i = 0; i < data.length; i++) {
        if (data[i] === null || data[i] === -1) continue;
        
        // For binary tree, left child is 2i+1, right child is 2i+2
        const leftChild = 2 * i + 1;
        const rightChild = 2 * i + 2;

        if (leftChild < data.length && data[leftChild] !== null && data[leftChild] !== -1) {
          links.push({
            source: i.toString(),
            target: leftChild.toString()
          });
        }

        if (rightChild < data.length && data[rightChild] !== null && data[rightChild] !== -1) {
          links.push({
            source: i.toString(),
            target: rightChild.toString()
          });
        }
      }
    }

    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // For trees, use a hierarchical layout
    if (graphType === 'binarytree' || graphType === 'tree') {
      const treeLayout = d3.tree()
        .size([width - 100, height - 100]);

      // Create hierarchy
      const root = d3.stratify()
        .id(d => d.id)
        .parentId(d => {
          const id = parseInt(d.id);
          if (id === 0) return null;
          return Math.floor((id - 1) / 2).toString();
        })(nodes);

      const treeData = treeLayout(root);

      // Draw links
      g.selectAll('.link')
        .data(treeData.links())
        .join('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
          .x(d => d.x + width/2 - 50)
          .y(d => d.y + 50))
        .style('fill', 'none')
        .style('stroke', '#999')
        .style('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');

      // Draw nodes
      const nodeGroups = g.selectAll('.node')
        .data(treeData.descendants())
        .join('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x + width/2 - 50},${d.y + 50})`);

      nodeGroups.append('circle')
        .attr('r', 15)
        .style('fill', '#fff')
        .style('stroke', '#999')
        .style('stroke-width', 2);

      nodeGroups.append('text')
        .text(d => d.data.label)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .style('font-size', '12px');

    } else {
      // Create force simulation for non-tree graphs
      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2));

      // Draw edges
      const edges = g.selectAll('.edge')
        .data(links)
        .join('line')
        .attr('class', 'edge')
        .style('stroke', '#999')
        .style('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');

      // Add weight labels if present
      if (graphType === 'edgelist') {
        g.selectAll('.weight-label')
          .data(links.filter(d => d.weight !== undefined))
          .join('text')
          .attr('class', 'weight-label')
          .attr('text-anchor', 'middle')
          .attr('dy', -5)
          .style('font-size', '10px')
          .text(d => d.weight);
      }

      // Draw nodes
      const nodeGroups = g.selectAll('.node')
        .data(nodes)
        .join('g')
        .attr('class', 'node')
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

      nodeGroups.append('circle')
        .attr('r', 15)
        .style('fill', '#fff')
        .style('stroke', '#999')
        .style('stroke-width', 2);

      nodeGroups.append('text')
        .text(d => d.label)
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .style('font-size', '12px');

      // Update positions on simulation tick
      simulation.on('tick', () => {
        edges
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        if (graphType === 'edgelist') {
          g.selectAll('.weight-label')
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2);
        }

        nodeGroups
          .attr('transform', d => `translate(${d.x},${d.y})`);
      });

      // Drag functions
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    }
  };

  const loadHistoryEntry = (entry) => {
    setInput(entry.data);
    setGraphType(entry.type);
    setData(JSON.parse(entry.data));
    setParseStatus('Loaded from history');
    updateVisualization(JSON.parse(entry.data));
  };

  const deleteHistoryEntry = (index) => {
    const updatedHistory = history.filter((_, i) => i !== index);
    setHistory(updatedHistory);
    localStorage.setItem('graphHistory', JSON.stringify(updatedHistory));
  };

  return (
    <div className={`${isMobile ? '' : 'h-screen'} flex flex-col overflow-hidden`}>
      <Navbar />
      
      <main className={`flex-grow ${isMobile ? 'flex flex-col' : 'flex'} overflow-hidden`}>
        {!isMobile ? (
          // Desktop layout
          <>
          <div className="w-3/4 p-4">
            <div ref={containerRef} className="w-full h-full border rounded"></div>
          </div>
            <div className="w-1/4 flex flex-col bg-gray-100 border-r">
              <div className="p-4">
                <select 
                  value={graphType}
                  onChange={(e) => {
                    setGraphType(e.target.value);
                    setParseStatus('');
                  }}
                  className="w-full mb-4 p-2 border rounded"
                >
                  <option value="adjmap">Adjacency Map</option>
                  <option value="edgelist">Edge List</option>
                  <option value="tree">Tree</option>
                  <option value="binarytree">Binary Tree</option>
                </select>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={startAtOne}
                      onChange={(e) => setStartAtOne(e.target.checked)}
                      className="mr-2"
                    />
                    Start node indices at 1
                  </label>
                </div>

                {graphType === 'edgelist' && (
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Weight Entry Index:</label>
                    <select
                      value={weightIndex}
                      onChange={(e) => setWeightIndex(parseInt(e.target.value))}
                      className="w-full p-2 border rounded"
                    >
                      <option value={2}>2 (Second Entry)</option>
                      <option value={3}>3 (Third Entry)</option>
                    </select>
                  </div>
                )}
                
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setParseStatus('');
                  }}
                  placeholder="Enter graph data in JSON format..."
                  className="w-full h-40 p-2 border rounded mb-2"
                />

                {parseStatus && (
                  <div className={`mb-2 p-2 rounded text-sm ${
                    parseStatus.startsWith('Error') 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {parseStatus}
                  </div>
                )}
                
                <button
                  onClick={processData}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
                >
                  Visualize
                </button>
              </div>

              <h3 className="font-bold mb-2 ms-4">History</h3>
              <div className="border-t flex-grow overflow-y-auto">
                <div className="p-4">
                  {history.map((entry, index) => (
                    <div key={entry.timestamp} className="flex items-center justify-between mb-2 p-2 bg-white rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{entry.type}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px] overflow-hidden text-ellipsis">{entry.data}</div>
                      </div>
                      <div className="flex justify-end gap-2 ml-4">
                        <button
                          onClick={() => loadHistoryEntry(entry)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteHistoryEntry(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </>
        ) : (
          // Mobile layout
          <>
            <div className="w-full p-4">
              <div ref={containerRef} className="w-full h-[calc(100vh-128px)] border rounded"></div>
            </div>

            <div className="w-full flex flex-col bg-gray-100">
              <div className="p-4">
                <select 
                  value={graphType}
                  onChange={(e) => {
                    setGraphType(e.target.value);
                    setParseStatus('');
                  }}
                  className="w-full mb-4 p-2 border rounded"
                >
                  <option value="adjmap">Adjacency Map</option>
                  <option value="edgelist">Edge List</option>
                  <option value="tree">Tree</option>
                  <option value="binarytree">Binary Tree</option>
                </select>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={startAtOne}
                      onChange={(e) => setStartAtOne(e.target.checked)}
                      className="mr-2"
                    />
                    Start node indices at 1
                  </label>
                </div>

                {graphType === 'edgelist' && (
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Weight Entry Index:</label>
                    <select
                      value={weightIndex}
                      onChange={(e) => setWeightIndex(parseInt(e.target.value))}
                      className="w-full p-2 border rounded"
                    >
                      <option value={2}>2 (Second Entry)</option>
                      <option value={3}>3 (Third Entry)</option>
                    </select>
                  </div>
                )}
                
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setParseStatus('');
                  }}
                  placeholder="Enter graph data in JSON format..."
                  className="w-full h-40 p-2 border rounded mb-2"
                />

                {parseStatus && (
                  <div className={`mb-2 p-2 rounded text-sm ${
                    parseStatus.startsWith('Error') 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {parseStatus}
                  </div>
                )}
                
                <button
                  onClick={processData}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
                >
                  Visualize
                </button>
              </div>

              <h3 className="font-bold mb-2 ms-4">History</h3>
              <div className="border-t overflow-y-auto">
                <div className="p-4">
                  {history.map((entry, index) => (
                    <div key={entry.timestamp} className="flex items-center justify-between mb-2 p-2 bg-white rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{entry.type}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px] overflow-hidden text-ellipsis">{entry.data}</div>
                      </div>
                      <div className="flex justify-end gap-2 ml-4">
                        <button
                          onClick={() => loadHistoryEntry(entry)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteHistoryEntry(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}