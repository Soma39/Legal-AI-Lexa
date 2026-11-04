import React, { useState, useEffect } from 'react';
import { 
  Share2, Search, Filter, ExternalLink, Info, BookOpen, 
  Layers, ArrowRight, ShieldCheck, RefreshCw, ZoomIn, ZoomOut
} from 'lucide-react';
import api from '../services/api';
import { KnowledgeNode, KnowledgeEdge, KnowledgeGraphData } from '../types';

export const KnowledgeGraphPage: React.FC = () => {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    fetchGraphData();
  }, [filterType]);

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      const url = filterType === 'ALL' ? '/graph' : `/graph?entity_type=${filterType}`;
      const res = await api.get<KnowledgeGraphData>(url);
      setNodes(res.data.nodes);
      setEdges(res.data.edges);
      if (res.data.nodes.length > 0 && !selectedNode) {
        setSelectedNode(res.data.nodes[0]);
      }
    } catch (err) {
      console.error('Error fetching knowledge graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNodes = nodes.filter((n) =>
    n.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute connected edges for selected node
  const connectedEdges = edges.filter(
    (e) => e.source_node_id === selectedNode?.id || e.target_node_id === selectedNode?.id
  );

  const getNodeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'act':
        return 'bg-navy-800 text-gold-400 border-navy-700';
      case 'section':
        return 'bg-gold-50 dark:bg-gold-950/60 text-gold-700 dark:text-gold-300 border-gold-300 dark:border-gold-600';
      case 'topic':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600';
      default:
        return 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-navy-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-semibold mb-2">
            <Share2 className="w-3.5 h-3.5" />
            <span>Traceable Statutory Relationships</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white">
            Indian Legal Knowledge Graph
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore verified legislative connections among Acts, Sections, Repeals (BNS 2023 vs IPC 1860), and remedies.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter legal entities..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white outline-none focus:border-gold-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-navy-900 p-1 rounded-lg">
            {(['ALL', 'Act', 'Section'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  filterType === t
                    ? 'bg-white dark:bg-navy-800 text-navy-900 dark:text-gold-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={fetchGraphData}
            className="p-2 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            title="Refresh Graph"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-4 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-400">Loading statutory relationships...</span>
          </div>
        </div>
      ) : nodes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-2">
          <Share2 className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Graph Entities Found</h3>
          <p className="text-xs text-slate-500">Legal knowledge graph data will appear once statutes are indexed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interactive Graph Canvas Area */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm p-6 flex flex-col justify-between min-h-[540px] relative overflow-hidden">
            {/* Legend & Zoom */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800 text-xs">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-navy-800 dark:bg-gold-500"></span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Statute / Act</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold-400"></span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Specific Section</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-slate-400">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual Node Grid Explorer */}
            <div
              className="py-6 flex-1 flex flex-wrap content-start gap-3 overflow-y-auto transition-transform"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
            >
              {filteredNodes.map((n) => {
                const isSelected = selectedNode?.id === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNode(n)}
                    className={`px-4 py-3 rounded-xl border text-left transition shadow-sm hover:scale-105 ${getNodeColor(
                      n.entity_type
                    )} ${
                      isSelected
                        ? 'ring-2 ring-gold-500 dark:ring-gold-400 shadow-md font-bold'
                        : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1 text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-80">
                      <span>{n.entity_type}</span>
                      {n.section_number && <span>• Sec {n.section_number}</span>}
                    </div>
                    <span className="text-xs font-bold block">{n.entity_name}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom provenance badge */}
            <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-500" />
                <span>100% Traceable to India Code Official Gazette Notifications</span>
              </span>
              <span>Showing {filteredNodes.length} verified entities</span>
            </div>
          </div>

          {/* Node Inspector Drawer */}
          <div className="space-y-4">
            {selectedNode ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400 block mb-1">
                    {selectedNode.entity_type} Details
                  </span>
                  <h3 className="font-extrabold text-lg text-navy-900 dark:text-white leading-snug">
                    {selectedNode.entity_name}
                  </h3>
                  {selectedNode.statute_name && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                      Statute: <strong>{selectedNode.statute_name}</strong>
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedNode.description}
                </div>

                {/* Relationships */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Statutory Relationships ({connectedEdges.length}):
                  </h4>
                  {connectedEdges.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No direct links indexed.</p>
                  ) : (
                    <div className="space-y-2">
                      {connectedEdges.map((e) => {
                        const isSource = e.source_node_id === selectedNode.id;
                        const otherNodeId = isSource ? e.target_node_id : e.source_node_id;
                        const otherNode = nodes.find((n) => n.id === otherNodeId);

                        return (
                          <div
                            key={e.id}
                            className="p-2.5 rounded-lg border border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950 text-xs space-y-1"
                          >
                            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-gold-600 dark:text-gold-400">
                              <span>{isSource ? 'OUTGOING' : 'INCOMING'}:</span>
                              <span className="px-1.5 py-0.5 rounded bg-gold-100 dark:bg-navy-800 text-navy-900 dark:text-gold-300 font-bold uppercase text-[10px]">
                                {e.relationship_type}
                              </span>
                            </div>
                            <span className="font-medium text-navy-900 dark:text-slate-200 block">
                              {otherNode?.entity_name || 'Connected Entity'}
                            </span>
                            {e.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {e.description}
                              </p>
                            )}
                            <span className="text-[10px] text-slate-400 block pt-0.5">
                              Source: {e.verified_source}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Official Source Link */}
                {selectedNode.source_url && (
                  <div className="pt-3 border-t border-slate-100 dark:border-navy-800">
                    <a
                      href={selectedNode.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 px-3 rounded-lg bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow transition"
                    >
                      <span>Verify on India Code</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs text-slate-400">
                Select an entity in the graph to inspect relationships and statutory details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
