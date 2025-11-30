import React, { useState } from 'react';
import { Activity, BrainCircuit, Share2, Info, AlertTriangle, ArrowRight, Database, Maximize2, Minimize2, X, BookOpen, Layers, Microscope, MousePointerClick, ZoomIn, Shuffle } from 'lucide-react';
import NetworkGraph from './components/NetworkGraph';
import DrugInput from './components/DrugInput';
import { predictInteractions } from './services/geminiService';
import { AnalysisResult, GraphNode } from './types';
import { RadialBarChart, RadialBar, Legend, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const INITIAL_NODES = [
  { id: '1', label: 'Start Analysis', type: 'DRUG', val: 5, description: "Enter two drugs in the left panel to generate a new knowledge graph." },
  { id: '2', label: 'Knowledge Graph', type: 'PROTEIN', val: 3, description: "This node represents the core concept of the application: connecting biomedical entities." },
  { id: '3', label: 'Predictions', type: 'SIDE_EFFECT', val: 4, description: "Potential adverse effects are predicted using GNN link prediction algorithms." }
];

// @ts-ignore
const INITIAL_LINKS = [
  { source: '1', target: '2', type: 'encodes' },
  { source: '2', target: '3', type: 'predicts' }
];

const EXAMPLE_PAIRS = [
  { a: "Lisinopril", b: "Ibuprofen" },
  { a: "Simvastatin", b: "Grapefruit Juice" },
  { a: "Caffeine", b: "Melatonin" },
  { a: "Sertraline", b: "Tramadol" },
  { a: "Metformin", b: "Insulin" },
  { a: "Alcohol", b: "Acetaminophen" }
];

const App: React.FC = () => {
  const [drugA, setDrugA] = useState('Warfarin');
  const [drugB, setDrugB] = useState('Aspirin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const handlePredict = async () => {
    if (!drugA || !drugB) return;
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    try {
      const data = await predictInteractions(drugA, drugB);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomize = () => {
    const randomPair = EXAMPLE_PAIRS[Math.floor(Math.random() * EXAMPLE_PAIRS.length)];
    setDrugA(randomPair.a);
    setDrugB(randomPair.b);
  };

  const chartData = result?.predictions.map((p, index) => ({
    name: p.sideEffect,
    uv: p.probability * 100,
    fill: index === 0 ? '#ef4444' : index === 1 ? '#f97316' : '#eab308'
  })) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500/30 flex flex-col">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg shadow-lg shadow-purple-900/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                NeuroGraph
              </h1>
              <p className="text-xs text-slate-400 font-mono tracking-wide">POLYPHARMACY GNN PREDICTOR</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setShowDocs(true)}
                className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
             >
                <BookOpen className="w-4 h-4" />
                Documentation
             </button>
             <div className="h-4 w-px bg-slate-700"></div>
             <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 px-3 py-1 rounded-full border border-green-800">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                System Online
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        
        {/* Intro Section - Hide when graph is expanded for more immersion */}
        {!isGraphExpanded && !result && !loading && (
          <div className="mb-8 text-center max-w-3xl mx-auto shrink-0 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 tracking-tight text-white">
              AI-Powered Drug Interaction Simulator
            </h2>
            <p className="text-base text-slate-400 mb-6 leading-relaxed">
              NeuroGraph uses <span className="text-purple-400 font-semibold">Graph Neural Networks (GNNs)</span> to analyze complex biological relationships between drugs and proteins. 
              By modeling these interactions as a high-dimensional knowledge graph, the system predicts undiscovered side effects of 
              <span className="text-blue-400 font-semibold"> polypharmacy</span> (drug combinations) that traditional clinical trials might miss.
            </p>
          </div>
        )}

        {/* Main Grid Layout - Removed CSS transitions for instant graph resizing */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${isGraphExpanded ? 'h-[calc(100vh-6rem)]' : 'h-[calc(100vh-14rem)] min-h-[700px]'}`}>
          
          {/* Left Panel: Controls & Analysis */}
          {!isGraphExpanded && (
            <div className="lg:col-span-3 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
              
              {/* Input Card */}
              <div className="glass-panel p-5 rounded-2xl shadow-xl shadow-black/20 shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    Select Compounds
                  </h3>
                  <button 
                    onClick={handleRandomize}
                    className="p-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
                    title="Load Random Example Pair"
                  >
                    <Shuffle className="w-3 h-3" />
                    Random
                  </button>
                </div>
                
                <div className="space-y-3">
                  <DrugInput 
                    label="Drug A (Source)" 
                    value={drugA} 
                    onChange={setDrugA} 
                    placeholder="e.g. Warfarin" 
                  />
                  
                  <div className="flex justify-center -my-2 relative z-10">
                      <div className="bg-slate-800 p-1 rounded-full border border-slate-700">
                          <Share2 className="w-3 h-3 text-slate-400" />
                      </div>
                  </div>

                  <DrugInput 
                    label="Drug B (Target)" 
                    value={drugB} 
                    onChange={setDrugB} 
                    placeholder="e.g. Aspirin" 
                  />
                  
                  <button 
                    onClick={handlePredict}
                    disabled={loading || !drugA || !drugB}
                    className={`w-full py-3 mt-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 text-sm
                      ${loading 
                        ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Run Prediction
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Results Section */}
              {result && (
                <div className="flex flex-col gap-4 animate-fade-in">
                   {/* Summary Card */}
                   <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-blue-500">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Analysis Summary</h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                          {result.summary}
                      </p>
                   </div>

                   {/* Predictions List */}
                   <div className="glass-panel p-5 rounded-2xl flex-1 min-h-[200px]">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Predicted Side Effects</h4>
                      <div className="space-y-3">
                          {result.predictions.map((pred, i) => (
                              <div key={i} className="group relative bg-slate-800/50 p-3 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-colors">
                                  <div className="flex justify-between items-start mb-1">
                                      <h5 className="font-semibold text-red-400 text-sm flex items-center gap-2">
                                          <AlertTriangle className="w-3 h-3" />
                                          {pred.sideEffect}
                                      </h5>
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 rounded text-slate-400 border border-slate-700">
                                          {(pred.probability * 100).toFixed(0)}%
                                      </span>
                                  </div>
                                  <p className="text-xs text-slate-400 line-clamp-2">{pred.description}</p>
                                  <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-500 to-transparent transition-all duration-500" 
                                       style={{ width: `${pred.probability * 100}%` }}></div>
                              </div>
                          ))}
                      </div>
                   </div>

                   {/* Recharts Visualization */}
                   <div className="glass-panel p-5 rounded-2xl h-56 shrink-0">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confidence Levels</h4>
                      <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart innerRadius="20%" outerRadius="100%" barSize={8} data={chartData}>
                              <RadialBar
                                  label={{ position: 'insideStart', fill: '#fff', fontSize: '10px' }}
                                  background
                                  dataKey="uv"
                              />
                              <Legend iconSize={8} layout="vertical" verticalAlign="middle" wrapperStyle={{color: '#94a3b8', fontSize: '10px'}} />
                              <RechartsTooltip 
                                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                                  itemStyle={{ color: '#e2e8f0' }}
                              />
                          </RadialBarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
              )}
              
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-200 text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Right Panel: Graph Visualization */}
          <div className={`${isGraphExpanded ? 'lg:col-span-12' : 'lg:col-span-9'} h-full flex flex-col`}>
            <div className="glass-panel flex-1 rounded-2xl p-1 relative shadow-2xl shadow-black/50 overflow-hidden flex flex-col group">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/30 via-slate-900/50 to-slate-950/80 pointer-events-none"></div>
                
                {/* Graph Header */}
                <div className="relative z-10 p-4 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-slate-200">Knowledge Graph Topology</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-slate-500 font-mono hidden sm:block">
                          NODES: {result ? result.nodes.length : INITIAL_NODES.length} | EDGES: {result ? result.links.length : INITIAL_LINKS.length}
                      </div>
                      <button 
                        onClick={() => setIsGraphExpanded(!isGraphExpanded)}
                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title={isGraphExpanded ? "Collapse View" : "Expand View"}
                      >
                        {isGraphExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                    </div>
                </div>

                {/* Graph Area */}
                <div className="flex-1 relative bg-slate-950">
                    <NetworkGraph 
                        nodes={result ? result.nodes as any : INITIAL_NODES as any} 
                        links={result ? result.links as any : INITIAL_LINKS as any}
                        onNodeClick={setSelectedNode} 
                    />

                    {/* Node Details Overlay Card */}
                    {selectedNode && (
                        <div className="absolute top-4 right-4 z-20 w-72 animate-fade-in-right">
                            <div className="glass-panel bg-slate-900/90 p-4 rounded-xl border border-slate-600 shadow-2xl backdrop-blur-md">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full shadow-lg shadow-current ${
                                            selectedNode.type === 'DRUG' ? 'bg-purple-500 text-purple-500' : 
                                            selectedNode.type === 'PROTEIN' ? 'bg-blue-500 text-blue-500' : 'bg-red-500 text-red-500'
                                        }`}></div>
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{selectedNode.type}</span>
                                    </div>
                                    <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2 leading-tight">{selectedNode.label}</h4>
                                <div className="h-px w-full bg-slate-700/50 mb-3"></div>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {selectedNode.description || "No specific description available for this entity."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-4 flex gap-4 text-xs text-slate-500 justify-end px-2">
                <div className="flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    <span>Double click background to reset zoom</span>
                </div>
                <div>
                    Model: <span className="text-purple-400">Gemini 2.5 Flash (Simulating GNN)</span>
                </div>
            </div>
          </div>

        </div>
      </main>

      {/* Documentation Modal */}
      {showDocs && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col bg-slate-900">
             {/* Modal Header */}
             <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-600/20 rounded-lg border border-purple-500/30">
                      <BookOpen className="w-5 h-5 text-purple-400" />
                   </div>
                   <h2 className="text-xl font-bold text-white">User Manual & Documentation</h2>
                </div>
                <button onClick={() => setShowDocs(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             {/* Modal Content */}
             <div className="p-6 space-y-8 text-slate-300">
                
                {/* How to Use Section */}
                <section className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MousePointerClick className="w-5 h-5 text-purple-400" />
                    How to Work With This App
                  </h3>
                  <ol className="relative border-l border-slate-700 ml-3 space-y-6">
                    <li className="ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-800 rounded-full -left-3 ring-4 ring-slate-900 border border-purple-500/50 text-xs font-bold text-purple-400">1</span>
                        <h4 className="font-semibold text-slate-200">Define Interaction</h4>
                        <p className="text-sm mt-1">Locate the <strong>Select Compounds</strong> panel on the left. Enter any two drug names (e.g., "Warfarin" and "Aspirin") to begin analysis. You can also click the <strong>Random</strong> button to try examples.</p>
                    </li>
                    <li className="ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-800 rounded-full -left-3 ring-4 ring-slate-900 border border-purple-500/50 text-xs font-bold text-purple-400">2</span>
                        <h4 className="font-semibold text-slate-200">Run Simulation</h4>
                        <p className="text-sm mt-1">Click <strong>Run Prediction</strong>. The system generates a knowledge graph and predicts potential side effects.</p>
                    </li>
                    <li className="ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-slate-800 rounded-full -left-3 ring-4 ring-slate-900 border border-purple-500/50 text-xs font-bold text-purple-400">3</span>
                        <h4 className="font-semibold text-slate-200">Explore & Analyze</h4>
                        <p className="text-sm mt-1">Use your mouse to <strong>Zoom</strong> and <strong>Pan</strong> the graph. Click on any node to view its specific biological description.</p>
                    </li>
                  </ol>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-400" />
                        Overview
                      </h3>
                      <p className="leading-relaxed text-sm">
                        NeuroGraph is a cutting-edge bioinformatics tool designed to predict side effects that occur when two or more drugs are taken together—a phenomenon known as <strong>polypharmacy</strong>.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-purple-400" />
                        Tech Stack
                      </h3>
                      <p className="leading-relaxed text-sm">
                         It simulates a <strong className="text-purple-300">Graph Neural Network (GNN)</strong> inference engine using Gemini 2.5 Flash to construct biological subgraphs and predict link probabilities.
                      </p>
                    </section>
                </div>

                <section>
                   <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                     <Activity className="w-5 h-5 text-green-400" />
                     Graph Legend
                   </h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <div className="w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                        <span className="text-sm font-medium">Drug Node</span>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        <span className="text-sm font-medium">Protein Target</span>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        <span className="text-sm font-medium">Side Effect</span>
                      </div>
                   </div>
                </section>
             </div>
             
             {/* Modal Footer */}
             <div className="p-6 border-t border-slate-800 bg-slate-900/50 sticky bottom-0 backdrop-blur">
               <button 
                  onClick={() => setShowDocs(false)} 
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium border border-slate-700 shadow-lg"
               >
                 Close Documentation
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;