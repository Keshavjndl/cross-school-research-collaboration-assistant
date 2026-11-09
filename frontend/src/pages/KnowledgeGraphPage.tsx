import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2, Search, Filter, ZoomIn, ZoomOut, RotateCcw,
  Info, Sparkles, Layers, ArrowRight, Eye, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { GraphData, GraphNode, GraphLink } from '../types';

export const KnowledgeGraphPage: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [nodeTypeFilter, setNodeTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());

  // Path Finder State
  const [pathR1, setPathR1] = useState<string>('');
  const [pathR2, setPathR2] = useState<string>('');
  const [pathResults, setPathResults] = useState<any[]>([]);
  const [pathFinding, setPathFinding] = useState(false);

  // Centrality Hubs
  const [centralityData, setCentralityData] = useState<any>(null);

  // Canvas Viewport Transforms (Zoom & Pan)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.85 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);

  // Force simulation simulation nodes & links
  const simNodesRef = useRef<any[]>([]);
  const simLinksRef = useRef<any[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const [data, centrality] = await Promise.all([
        api.getGraphData(nodeTypeFilter),
        api.getCentrality(),
      ]);
      setGraphData(data);
      setCentralityData(centrality);
      initializeSimulation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [nodeTypeFilter]);

  // Simple physics-based layout initialization
  const initializeSimulation = (data: GraphData) => {
    const width = 900;
    const height = 650;
    const cx = width / 2;
    const cy = height / 2;

    const nodes = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      const radius = 100 + (Math.random() * 220);
      return {
        ...n,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        size: n.type === 'School' ? 24 : n.type === 'Researcher' ? 16 : n.type === 'ResearchTheme' ? 14 : 10,
      };
    });

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const links = data.links
      .map((l) => ({
        source: nodeMap.get(l.source),
        target: nodeMap.get(l.target),
        relationship: l.relationship,
      }))
      .filter((l) => l.source && l.target);

    simNodesRef.current = nodes;
    simLinksRef.current = links;

    // Run simple force relaxation steps
    for (let step = 0; step < 80; step++) {
      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = (180 - dist) / dist * 0.4;
            nodes[i].x -= dx * force * 0.1;
            nodes[i].y -= dy * force * 0.1;
            nodes[j].x += dx * force * 0.1;
            nodes[j].y += dy * force * 0.1;
          }
        }
      }

      // Spring attraction along edges
      for (const link of links) {
        if (!link.source || !link.target) continue;
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 80) * 0.05;
        link.source.x += (dx / dist) * force;
        link.source.y += (dy / dist) * force;
        link.target.x -= (dx / dist) * force;
        link.target.y -= (dy / dist) * force;
      }
    }

    renderCanvas();
  };

  // Search concept highlight
  useEffect(() => {
    if (!searchQuery.trim()) {
      setHighlightedNodeIds(new Set());
      return;
    }
    const q = searchQuery.toLowerCase();
    const matching = new Set<string>();
    simNodesRef.current.forEach((n) => {
      if (
        n.name.toLowerCase().includes(q) ||
        (n.category && n.category.toLowerCase().includes(q)) ||
        (n.school_name && n.school_name.toLowerCase().includes(q))
      ) {
        matching.add(n.id);
      }
    });
    setHighlightedNodeIds(matching);
  }, [searchQuery]);

  // Path Finder
  const handleFindPath = async () => {
    if (!pathR1 || !pathR2) return;
    try {
      setPathFinding(true);
      const res = await api.getGraphPaths(Number(pathR1), Number(pathR2));
      setPathResults(res.paths);

      // Highlight path nodes on graph
      const pathNodes = new Set<string>();
      res.paths.forEach((p: any[]) => {
        p.forEach((node) => pathNodes.add(node.id));
      });
      setHighlightedNodeIds(pathNodes);
    } catch (err) {
      console.error(err);
    } finally {
      setPathFinding(false);
    }
  };

  // Canvas Rendering
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Viewport transform (Pan & Zoom)
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    const nodes = simNodesRef.current;
    const links = simLinksRef.current;

    // Draw Links
    ctx.lineWidth = 1;
    for (const link of links) {
      const isPathLink =
        highlightedNodeIds.size > 0 &&
        highlightedNodeIds.has(link.source.id) &&
        highlightedNodeIds.has(link.target.id);

      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);

      if (isPathLink) {
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2.5;
      } else {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.8;
      }
      ctx.stroke();
    }

    // Draw Nodes
    for (const node of nodes) {
      const isSelected = selectedNode?.id === node.id;
      const isHighlighted = highlightedNodeIds.has(node.id);
      const radius = node.size || 12;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

      // Color scheme
      let fillColor = '#64748b';
      if (node.type === 'School') fillColor = '#3b82f6';
      else if (node.type === 'Researcher') fillColor = '#0284c7';
      else if (node.type === 'ResearchTheme') fillColor = '#8b5cf6';
      else if (node.type === 'Publication') fillColor = '#10b981';
      else if (node.type === 'Laboratory') fillColor = '#ec4899';
      else if (node.type === 'InstitutionalResource') fillColor = '#f59e0b';

      ctx.fillStyle = fillColor;
      ctx.fill();

      // Border highlight
      if (isSelected || isHighlighted) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#f59e0b';
        ctx.stroke();
      } else {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }

      // Node Labels (render for larger nodes or when highlighted)
      if (node.type === 'School' || node.type === 'ResearchTheme' || isSelected || isHighlighted || transform.k > 1.0) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        const label = node.name.length > 25 ? node.name.substring(0, 22) + '...' : node.name;
        ctx.fillText(label, node.x, node.y + radius + 12);
      }
    }

    ctx.restore();
  };

  useEffect(() => {
    renderCanvas();
  }, [transform, selectedNode, highlightedNodeIds]);

  // Mouse interaction handlers (Pan & Node selection)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - transform.x) / transform.k;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.k;

    // Check if clicked a node
    const clickedNode = simNodesRef.current.find((n) => {
      const dist = Math.hypot(n.x - mouseX, n.y - mouseY);
      return dist <= (n.size || 14) + 4;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      draggedNodeRef.current = clickedNode;
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      draggedNodeRef.current.x = (e.clientX - rect.left - transform.x) / transform.k;
      draggedNodeRef.current.y = (e.clientY - rect.top - transform.y) / transform.k;
      renderCanvas();
    } else if (isDraggingRef.current) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      }));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    draggedNodeRef.current = null;
  };

  const handleZoom = (factor: number) => {
    setTransform((prev) => ({
      ...prev,
      k: Math.max(0.4, Math.min(2.5, prev.k * factor)),
    }));
  };

  const handleResetZoom = () => {
    setTransform({ x: 0, y: 0, k: 0.85 });
    setSelectedNode(null);
    setHighlightedNodeIds(new Set());
  };

  const researcherNodes = simNodesRef.current.filter((n) => n.type === 'Researcher');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">University Research Knowledge Graph</h2>
          <p className="text-xs text-slate-500">
            Multi-relational semantic network mapping faculty, themes, publications, laboratories, and institutional resources.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadGraph}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-lg flex items-center gap-1 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-layout
          </button>
        </div>
      </div>

      {/* Graph Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Node Filter */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600 font-medium">Filter Nodes:</span>
          <select
            value={nodeTypeFilter}
            onChange={(e) => setNodeTypeFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Entities ({graphData?.total_nodes || 0})</option>
            <option value="Researcher">Researchers Only</option>
            <option value="School">Academic Schools</option>
            <option value="ResearchTheme">Research Themes</option>
            <option value="Publication">Publications</option>
            <option value="Laboratory">Laboratories</option>
            <option value="InstitutionalResource">Institutional Resources</option>
          </select>
        </div>

        {/* Concept Search */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Highlight concept, theme, or name..."
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-lg">
          <button
            onClick={() => handleZoom(1.2)}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas + Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas Area (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[580px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[580px] text-xs text-slate-500">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
              Constructing NetworkX ontology graph...
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                width={900}
                height={580}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="w-full h-full cursor-grab active:cursor-grabbing bg-slate-50/40"
              />

              {/* Node Legend Overlay */}
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm p-2.5 rounded-lg border border-slate-200 shadow-sm text-[10px] space-y-1">
                <div className="font-semibold text-slate-700 mb-1">Entity Color Legend</div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> School
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 ml-2"></span> Researcher
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ml-2"></span> Theme
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Publication
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 ml-2"></span> Laboratory
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-2"></span> Resource
                </div>
              </div>
            </>
          )}
        </div>

        {/* Node Inspector & Path Finder Sidebar */}
        <div className="space-y-5">
          {/* Node Details Inspector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Node Inspector</span>
            </div>

            {selectedNode ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Entity Type</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span className="font-semibold text-slate-800">{selectedNode.type}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Name</span>
                  <p className="font-semibold text-slate-900 text-sm mt-0.5">{selectedNode.name}</p>
                </div>

                {selectedNode.school_name && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Affiliated School</span>
                    <p className="text-slate-700 mt-0.5">{selectedNode.school_name}</p>
                  </div>
                )}

                {selectedNode.designation && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Designation</span>
                    <p className="text-slate-700 mt-0.5">{selectedNode.designation}</p>
                  </div>
                )}

                {selectedNode.category && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Theme Category</span>
                    <p className="text-slate-700 mt-0.5">{selectedNode.category}</p>
                  </div>
                )}

                {selectedNode.type === 'Researcher' && (
                  <button
                    onClick={() => navigate(`/collaborations?target_id=${selectedNode.entity_id}`)}
                    className="w-full mt-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Find Collaborations
                  </button>
                )}
              </div>
            ) : (
              <p className="text-slate-400 italic text-center py-6">
                Click any node on the graph to inspect metadata and connections.
              </p>
            )}
          </div>

          {/* Path Finder Between Two Researchers */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs space-y-3">
            <div className="font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Path Finder Between Faculty
            </div>
            <p className="text-[11px] text-slate-500">
              Traces shortest semantic hops (via themes, publications, shared labs) between two researchers.
            </p>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Researcher A</label>
              <select
                value={pathR1}
                onChange={(e) => setPathR1(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">Select Faculty 1...</option>
                {researcherNodes.map((r) => (
                  <option key={r.entity_id} value={r.entity_id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Researcher B</label>
              <select
                value={pathR2}
                onChange={(e) => setPathR2(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">Select Faculty 2...</option>
                {researcherNodes.map((r) => (
                  <option key={r.entity_id} value={r.entity_id}>{r.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleFindPath}
              disabled={pathFinding || !pathR1 || !pathR2}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5"
            >
              {pathFinding ? 'Calculating...' : 'Explore Paths'}
            </button>

            {pathResults.length > 0 && (
              <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
                <span className="font-semibold text-[11px] text-slate-800">
                  Found {pathResults.length} Connecting Paths:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {pathResults.map((p, idx) => (
                    <div key={idx} className="p-2 bg-indigo-50/60 border border-indigo-100 rounded text-[10px] space-y-0.5">
                      <div className="font-semibold text-indigo-900">Path #{idx + 1} ({p.length - 1} hops)</div>
                      <div className="text-slate-600 flex flex-wrap items-center gap-1">
                        {p.map((node: any, nIdx: number) => (
                          <React.Fragment key={node.id}>
                            <span className="font-medium text-slate-800">{node.name}</span>
                            {nIdx < p.length - 1 && <span className="text-indigo-400">&rarr;</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
