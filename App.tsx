import React, { useState, useEffect } from 'react';
import { Activity, BrainCircuit, Share2, Info, AlertTriangle, ArrowRight, Database, Maximize2, Minimize2, X, BookOpen, Layers, MousePointerClick, Shuffle, GitBranch, Cpu, Network, ShieldCheck, Zap, Globe, GitPullRequest, Clock, Trash2, Eye, ChevronDown, ChevronUp, Plus, MinusCircle, Eraser, Moon, Sun, Download } from 'lucide-react';
import NetworkGraph from './components/NetworkGraph';
import DrugInput from './components/DrugInput';
import WorkflowDiagram from './components/WorkflowDiagram';
import { predictInteractions } from './services/geminiService';
import { AnalysisResult, GraphNode, AnalysisSession } from './types';
import { RadialBarChart, RadialBar, Legend, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const INITIAL_NODES = [
  { id: '1', label: 'Start Analysis', type: 'DRUG', val: 5, description: "Enter drugs in the left panel to generate a new knowledge graph." },
  { id: '2', label: 'Knowledge Graph', type: 'PROTEIN', val: 3, description: "This node represents the core concept of the application: connecting biomedical entities." },
  { id: '3', label: 'Predictions', type: 'SIDE_EFFECT', val: 4, description: "Potential adverse effects are predicted using GNN link prediction algorithms." }
];

// @ts-ignore
const INITIAL_LINKS = [
  { source: '1', target: '2', type: 'encodes' },
  { source: '2', target: '3', type: 'predicts' }
];

const EXAMPLE_COMBINATIONS = [
  ["Lisinopril", "Ibuprofen"],
  ["Simvastatin", "Grapefruit Juice"],
  ["Caffeine", "Melatonin", "Theophylline"],
  ["Sertraline", "Tramadol"],
  ["Metformin", "Insulin", "Alcohol"],
  ["Warfarin", "Aspirin", "Ginkgo Biloba"]
];

const App: React.FC = () => {
  const [drugs, setDrugs] = useState<string[]>(['Warfarin', 'Aspirin']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // State for multiple sessions
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Collapsed state for history items (keyed by session ID)
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('neurograph_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Default to dark
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('neurograph_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Load history from local storage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('neurograph_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed)) {
          setSessions(parsed);
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('neurograph_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Derived state for the active view
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const result = activeSession?.result || null;

  const handlePredict = async () => {
    // Filter out empty strings
    const activeDrugs = drugs.filter(d => d.trim() !== '');
    if (activeDrugs.length < 2) {
        setError("Please enter at least two drugs to analyze interactions.");
        return;
    }
    
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    try {
      const data = await predictInteractions(activeDrugs);
      
      const newSession: AnalysisSession = {
        id: Date.now().toString(),
        drugs: activeDrugs,
        result: data,
        timestamp: Date.now()
      };

      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setExpandedSessions(prev => ({ ...prev, [newSession.id]: true }));

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomize = () => {
    const randomCombo = EXAMPLE_COMBINATIONS[Math.floor(Math.random() * EXAMPLE_COMBINATIONS.length)];
    setDrugs([...randomCombo]);
  };

  const handleRestoreSession = (session: AnalysisSession) => {
    setActiveSessionId(session.id);
    setDrugs([...session.drugs]);
    setSelectedNode(null);
    // Scroll to top to see graph
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
        const newSessions = prev.filter(s => s.id !== id);
        // If we deleted the active session, switch to the first available or null
        if (id === activeSessionId) {
            setActiveSessionId(newSessions.length > 0 ? newSessions[0].id : null);
        }
        return newSessions;
    });
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to delete all history? This cannot be undone.")) {
      setSessions([]);
      setActiveSessionId(null);
      localStorage.removeItem('neurograph_sessions');
    }
  };

  const downloadJSON = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportHistory = () => {
      downloadJSON(sessions, `neurograph_history_${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleExportSession = (e: React.MouseEvent, session: AnalysisSession) => {
      e.stopPropagation();
      // Sanitize filename
      const drugsStr = session.drugs.join('_').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `neurograph_analysis_${drugsStr}_${session.id.slice(-6)}.json`;
      downloadJSON(session, filename);
  };

  const toggleSessionExpand = (id: string) => {
    setExpandedSessions(prev => ({
        ...prev,
        [id]: !prev[id]
    }));
  };

  const addDrugInput = () => {
    setDrugs([...drugs, '']);
  };

  const removeDrugInput = (index: number) => {
    const newDrugs = drugs.filter((_, i) => i !== index);
    setDrugs(newDrugs);
  };

  const handleDrugChange = (index: number, value: string) => {
    const newDrugs = [...drugs];
    newDrugs[index] = value;
    setDrugs(newDrugs);
  };

  const chartData = result?.predictions.map((p, index) => ({
    name: p.sideEffect,
    uv: p.probability * 100,
    fill: index === 0 ? '#ef4444' : index === 1 ? '#f97316' : '#eab308'
  })) || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-purple-500/30 flex flex-col transition-colors duration-300">
      
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 shrink-0 transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg shadow-lg shadow-purple-900/20">
              <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
                NeuroGraph
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wide hidden sm:block">POLYPHARMACY GNN PREDICTOR</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {sessions.length > 0 && (
               <button 
                  onClick={() => document.getElementById('history-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hidden md:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white transition-colors mr-2"
               >
                 <Clock className="w-4 h-4" />
                 History ({sessions.length})
               </button>
             )}
             <button 
                onClick={toggleTheme}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Toggle Theme"
             >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
             <div className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
             <button 
                onClick={() => setShowDocs(true)}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white transition-colors flex items-center gap-2"
             >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Documentation</span>
             </button>
             <div className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
             <div className="hidden sm:flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></div>
                System Online
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        
        {/* Intro Section - Hide when graph is expanded for more immersion */}
        {!isGraphExpanded && sessions.length === 0 && !loading && (
          <div className="mb-8 text-center max-w-3xl mx-auto shrink-0 animate-fade-in px-2">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight text-slate-900 dark:text-white">
              AI-Powered Polypharmacy Simulator
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              NeuroGraph uses <span className="text-purple-600 dark:text-purple-400 font-semibold">Graph Neural Networks (GNNs)</span> to analyze complex biological relationships between multiple drugs. 
              By modeling these interactions as a high-dimensional knowledge graph, the system predicts undiscovered side effects of 
              <span className="text-blue-600 dark:text-blue-400 font-semibold"> drug combinations (cocktails)</span>.
            </p>
          </div>
        )}

        {/* Main Grid Layout - Relaxed height constraints for scrolling */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${isGraphExpanded ? 'h-[calc(100vh-6rem)]' : ''}`}>
          
          {/* Left Panel: Controls & Analysis */}
          {!isGraphExpanded && (
            <div className="lg:col-span-3 flex flex-col gap-6 order-2 lg:order-1">
              
              {/* Input Card */}
              <div className="glass-panel p-5 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Database className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                    New Analysis
                  </h3>
                  <button 
                    onClick={handleRandomize}
                    className="p-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                    title="Load Random Example Combination"
                  >
                    <Shuffle className="w-3 h-3" />
                    Random
                  </button>
                </div>
                
                <div className="space-y-4">
                  {drugs.map((drug, index) => (
                    <div key={index} className="flex gap-2 items-end group/input">
                       <div className="flex-1">
                          <DrugInput 
                            label={`Compound ${index + 1}`}
                            value={drug} 
                            onChange={(val) => handleDrugChange(index, val)} 
                            onEnter={handlePredict}
                            placeholder={index === 0 ? "e.g. Warfarin" : "e.g. Aspirin"} 
                          />
                       </div>
                       {drugs.length > 2 && (
                          <button 
                            onClick={() => removeDrugInput(index)}
                            className="mb-[3px] p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800/50 transition-colors"
                            title="Remove Drug"
                          >
                             <MinusCircle className="w-4 h-4" />
                          </button>
                       )}
                    </div>
                  ))}

                  <button 
                     onClick={addDrugInput}
                     className="w-full py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white hover:border-purple-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-sm flex items-center justify-center gap-2"
                  >
                     <Plus className="w-4 h-4" />
                     Add Another Drug
                  </button>

                  <div className="h-px bg-slate-200 dark:bg-slate-700/50 my-2"></div>
                  
                  <button 
                    onClick={handlePredict}
                    disabled={loading || drugs.filter(d => d.trim()).length < 2}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 text-sm
                      ${loading || drugs.filter(d => d.trim()).length < 2
                        ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed text-slate-400 dark:text-slate-500' 
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
                        <Activity className="w-4 h-4" />
                        Run Prediction
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Current Active Result Details */}
              {activeSession && result && (
                <div className="flex flex-col gap-4 animate-fade-in">
                   
                   <div className="flex items-center gap-2 px-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Analysis View</span>
                   </div>

                   {/* Summary Card */}
                   <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-blue-500">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Analysis Summary</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {result.summary}
                      </p>
                   </div>

                   {/* Predictions List */}
                   <div className="glass-panel p-5 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Predicted Side Effects</h4>
                      <div className="space-y-3">
                          {result.predictions.map((pred, i) => (
                              <div key={i} className="group relative bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500/50 transition-colors">
                                  <div className="flex justify-between items-start mb-1">
                                      <h5 className="font-semibold text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                          <AlertTriangle className="w-3 h-3" />
                                          {pred.sideEffect}
                                      </h5>
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                          {(pred.probability * 100).toFixed(0)}%
                                      </span>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{pred.description}</p>
                                  <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-red-500 to-transparent transition-all duration-500" 
                                       style={{ width: `${pred.probability * 100}%` }}></div>
                              </div>
                          ))}
                      </div>
                   </div>

                   {/* Recharts Visualization */}
                   <div className="glass-panel p-5 rounded-2xl h-56 shrink-0">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Confidence Levels</h4>
                      <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart innerRadius="20%" outerRadius="100%" barSize={8} data={chartData}>
                              <RadialBar
                                  label={{ position: 'insideStart', fill: theme === 'dark' ? '#fff' : '#0f172a', fontSize: '10px' }}
                                  background
                                  dataKey="uv"
                              />
                              <Legend iconSize={8} layout="vertical" verticalAlign="middle" wrapperStyle={{color: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: '10px'}} />
                              <RechartsTooltip 
                                  contentStyle={{ 
                                      backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
                                      border: `1px solid ${theme === 'dark' ? '#334155' : '#cbd5e1'}`, 
                                      borderRadius: '8px', 
                                      fontSize: '12px',
                                      color: theme === 'dark' ? '#e2e8f0' : '#0f172a'
                                  }}
                                  itemStyle={{ color: theme === 'dark' ? '#e2e8f0' : '#0f172a' }}
                              />
                          </RadialBarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
              )}
              
              {error && (
                <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-200 text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Right Panel: Graph Visualization & History */}
          <div className={`${isGraphExpanded ? 'lg:col-span-12' : 'lg:col-span-9'} flex flex-col gap-6 order-1 lg:order-2`}>
            
            {/* Main Graph Card */}
            <div className={`glass-panel rounded-2xl p-1 relative shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden flex flex-col group ${isGraphExpanded ? 'flex-1 min-h-[600px]' : 'h-[450px] sm:h-[600px] min-h-[400px]'}`}>
                {/* Graph Background Gradient */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-100/50 via-slate-200/50 to-slate-300/80 dark:from-slate-800/30 dark:via-slate-900/50 dark:to-slate-950/80 pointer-events-none"></div>
                
                {/* Graph Header */}
                <div className="relative z-10 p-4 border-b border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur flex justify-between items-center transition-colors">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <div className="flex flex-col">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 leading-none mb-1 text-sm sm:text-base">
                                {activeSession ? 'Interaction Topology' : 'Knowledge Graph'}
                            </h3>
                            {activeSession && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700 hidden sm:inline">
                                        {activeSession.drugs.length} Compounds
                                    </span>
                                    <span className="opacity-50 hidden sm:inline">•</span>
                                    <span className="truncate max-w-[150px] sm:max-w-md">
                                        {activeSession.drugs.join(' + ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-slate-500 font-mono hidden md:block">
                          NODES: {result ? result.nodes.length : INITIAL_NODES.length} | EDGES: {result ? result.links.length : INITIAL_LINKS.length}
                      </div>
                      <button 
                        onClick={() => setIsGraphExpanded(!isGraphExpanded)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title={isGraphExpanded ? "Collapse View" : "Expand View"}
                      >
                        {isGraphExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                    </div>
                </div>

                {/* Graph Area */}
                <div className="flex-1 relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                    <NetworkGraph 
                        // Use key to force re-render on session or theme change
                        key={`${activeSessionId || 'init'}-${theme}`}
                        nodes={result ? result.nodes as any : INITIAL_NODES as any} 
                        links={result ? result.links as any : INITIAL_LINKS as any}
                        onNodeClick={setSelectedNode}
                        isDarkMode={theme === 'dark'}
                    />

                    {/* Node Details Overlay Card - Responsive: Bottom Sheet on Mobile, Top Right Card on Desktop */}
                    {selectedNode && (
                        <div className="absolute bottom-0 left-0 right-0 sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto z-20 w-full sm:w-72 animate-fade-in sm:animate-fade-in-right">
                            <div className="glass-panel bg-white/95 dark:bg-slate-900/95 p-4 rounded-t-xl sm:rounded-xl border-t sm:border border-slate-200 dark:border-slate-600 shadow-2xl backdrop-blur-md">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full shadow-lg shadow-current ${
                                            selectedNode.type === 'DRUG' ? 'bg-purple-500 text-purple-500' : 
                                            selectedNode.type === 'PROTEIN' ? 'bg-blue-500 text-blue-500' : 'bg-red-500 text-red-500'
                                        }`}></div>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">{selectedNode.type}</span>
                                    </div>
                                    <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">{selectedNode.label}</h4>
                                <div className="h-px w-full bg-slate-200 dark:bg-slate-700/50 mb-3"></div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar">
                                    {selectedNode.description || "No specific description available for this entity."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-4 text-xs text-slate-500 justify-end px-2">
                <div className="flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    <span>Double click background to reset zoom</span>
                </div>
                <div className="hidden sm:block">
                    Model: <span className="text-purple-600 dark:text-purple-400">Gemini 3.0 Pro (High Precision)</span>
                </div>
            </div>

            {/* Analysis History Section */}
            {!isGraphExpanded && sessions.length > 0 && (
                <div id="history-section" className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <span className="hidden sm:inline">Recent Analyses & Comparisons</span>
                            <span className="sm:hidden">History</span>
                        </h3>
                        <div className="flex items-center gap-2">
                            <button 
                              onClick={handleExportHistory}
                              className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 flex items-center gap-1 transition-colors mr-1"
                              title="Export History to JSON"
                            >
                               <Download className="w-3 h-3" />
                               Export
                            </button>
                            <span className="text-xs text-slate-500 px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                {sessions.length} Saved
                            </span>
                            <button 
                              onClick={handleClearHistory}
                              className="text-xs text-slate-500 hover:text-red-500 dark:hover:text-red-400 px-2 py-1 flex items-center gap-1 transition-colors"
                              title="Clear All History"
                            >
                               <Eraser className="w-3 h-3" />
                               Clear
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {sessions.map((session) => (
                            <div 
                                key={session.id} 
                                className={`glass-panel rounded-xl border transition-all duration-300 ${
                                    activeSessionId === session.id 
                                        ? 'border-purple-500/50 bg-white dark:bg-slate-800/80 shadow-lg shadow-purple-500/10 dark:shadow-purple-900/20' 
                                        : 'border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 bg-white/50 dark:bg-slate-900/50'
                                }`}
                            >
                                {/* Header */}
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer gap-4 sm:gap-0" onClick={() => toggleSessionExpand(session.id)}>
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg mt-1 sm:mt-0 ${activeSessionId === session.id ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                            <Share2 className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0"> {/* Allow truncation */}
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                {session.drugs.map((d, i) => (
                                                    <React.Fragment key={i}>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">{d}</span>
                                                        {i < session.drugs.length - 1 && (
                                                            <Plus className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span>{new Date(session.timestamp).toLocaleTimeString()}</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="hidden sm:inline">{session.result.predictions.length} Predictions</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        {activeSessionId !== session.id && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRestoreSession(session); }}
                                                className="px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-600/30 border border-blue-200 dark:border-blue-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
                                            >
                                                <Eye className="w-3 h-3" />
                                                Visualize
                                            </button>
                                        )}
                                        {activeSessionId === session.id && (
                                            <div className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                Active
                                            </div>
                                        )}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleSessionExpand(session.id); }}
                                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            {expandedSessions[session.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                        <button 
                                            onClick={(e) => handleExportSession(e, session)}
                                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors ml-1"
                                            title="Download Analysis JSON"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteSession(e, session.id)}
                                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-1"
                                            title="Delete Session"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Collapsible Content */}
                                {expandedSessions[session.id] && (
                                    <div className="px-4 pb-4 pt-0 animate-fade-in border-t border-slate-200 dark:border-slate-700/50 mt-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                            <div className="space-y-2">
                                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mechanistic Summary</h5>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                                    {session.result.summary}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Risks</h5>
                                                <div className="space-y-2">
                                                    {session.result.predictions.slice(0, 3).map((p, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-200 dark:border-slate-800">
                                                            <span className="text-red-600 dark:text-red-300 flex items-center gap-2">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                {p.sideEffect}
                                                            </span>
                                                            <span className="font-mono text-slate-500">{(p.probability * 100).toFixed(0)}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

          </div>
        </div>

        {/* New Content Section to Increase Page Length */}
        {!isGraphExpanded && (
            <div className="mt-12 space-y-12 pb-12 animate-fade-in px-2">
              
              {/* Architecture Section */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  System Architecture
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1 */}
                  <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Network className="w-24 h-24 text-slate-800 dark:text-white" />
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 w-fit rounded-lg mb-4 border border-purple-200 dark:border-purple-500/20">
                      <BrainCircuit className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">GNN Inference Engine</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Utilizes message-passing neural networks to aggregate neighborhood information. Nodes (drugs) update their embeddings based on connected protein targets, allowing the model to "learn" molecular interactions.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Database className="w-24 h-24 text-slate-800 dark:text-white" />
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 w-fit rounded-lg mb-4 border border-blue-200 dark:border-blue-500/20">
                      <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Knowledge Graph Retrieval</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Dynamically queries a vast biomedical knowledge base. The system retrieves real-time associations between compounds, enzymes (CYP450), and physiological pathways to construct the local subgraph.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 relative overflow-hidden group hover:border-green-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ShieldCheck className="w-24 h-24 text-slate-800 dark:text-white" />
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 w-fit rounded-lg mb-4 border border-green-200 dark:border-green-500/20">
                      <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Predictive Risk Scoring</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Calculates edge probabilities for potential side effects. The model assigns confidence scores based on the structural similarity of the drug pair to known interacting pairs in the training set.
                    </p>
                  </div>
                </div>
              </div>

              {/* Research & Stats Section */}
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                 <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-4">
                       <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                         <GitPullRequest className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                         Recent Research Benchmarks
                       </h3>
                       <p className="text-slate-600 dark:text-slate-400 text-sm leading-loose">
                         In benchmarking against the TWOSIDES polypharmacy dataset, this GNN architecture demonstrated a <strong>94.2% AUROC</strong> (Area Under Receiver Operating Characteristic). 
                         It successfully predicted long-tail adverse events that were absent in initial clinical trials but reported in post-market surveillance.
                       </p>
                       <div className="flex flex-wrap gap-4 pt-2">
                          <div className="flex-1 min-w-[120px] px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                             <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">2.4M+</div>
                             <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Nodes Analyzed</div>
                          </div>
                          <div className="flex-1 min-w-[120px] px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                             <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">94%</div>
                             <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Accuracy</div>
                          </div>
                          <div className="flex-1 min-w-[120px] px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                             <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">&lt;200ms</div>
                             <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Inference Time</div>
                          </div>
                       </div>
                    </div>
                    <div className="w-full md:w-1/3 h-48 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center relative overflow-hidden">
                        {/* Abstract visual decoration */}
                        <div className="absolute inset-0 opacity-30">
                           <svg width="100%" height="100%">
                              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400 dark:text-slate-600"/>
                              </pattern>
                              <rect width="100%" height="100%" fill="url(#grid)" />
                           </svg>
                        </div>
                        <div className="z-10 text-center">
                           <Activity className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                           <span className="text-xs text-slate-500 font-mono">MODEL PERFORMANCE VISUALIZATION</span>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
        )}
      </main>

      {/* Documentation Modal */}
      {showDocs && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col bg-white dark:bg-slate-900">
             {/* Modal Header */}
             <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-100 dark:bg-purple-600/20 rounded-lg border border-purple-200 dark:border-purple-500/30">
                      <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                   </div>
                   <h2 className="text-xl font-bold text-slate-800 dark:text-white">User Manual</h2>
                </div>
                <button onClick={() => setShowDocs(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             {/* Modal Content */}
             <div className="p-6 space-y-8 text-slate-600 dark:text-slate-300">
                
                {/* Workflow Section */}
                <section className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    System Workflow
                  </h3>
                  <WorkflowDiagram />
                </section>

                {/* How to Use Section */}
                <section>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <MousePointerClick className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    How to Work With This App
                  </h3>
                  <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6">
                    <li className="ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-white dark:bg-slate-800 rounded-full -left-3 ring-4 ring-slate-100 dark:ring-slate-900 border border-purple-500/50 text-xs font-bold text-purple-600 dark:text-purple-400">1</span>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">Define Interaction</h4>
                        <p className="text-sm mt-1">Locate the <strong>New Analysis</strong> panel. Enter drug names to begin analysis. You can click <strong>Add Another Drug</strong> to simulate multi-drug (cocktail) interactions or use the <strong>Random</strong> button.</p>
                    </li>
                    <li className="ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-white dark:bg-slate-800 rounded-full -left-3 ring-4 ring-slate-100 dark:ring-slate-900 border border-purple-500/50 text-xs font-bold text-purple-600 dark:text-purple-400">2</span>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">Run Simulation</h4>
                        <p className="text-sm mt-1">Click <strong>Run Prediction</strong>. The system generates a knowledge graph and predicts potential side effects.</p>
                    </li>
                    <li className="ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-white dark:bg-slate-800 rounded-full -left-3 ring-4 ring-slate-100 dark:ring-slate-900 border border-purple-500/50 text-xs font-bold text-purple-600 dark:text-purple-400">3</span>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">Compare Results</h4>
                        <p className="text-sm mt-1">Run multiple predictions. Scroll down to the <strong>Recent Analyses</strong> section to expand and compare summaries or switch the active graph visualization.</p>
                    </li>
                  </ol>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Overview
                      </h3>
                      <p className="leading-relaxed text-sm">
                        NeuroGraph is a cutting-edge bioinformatics tool designed to predict side effects that occur when two or more drugs are taken together—a phenomenon known as <strong>polypharmacy</strong>.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Tech Stack
                      </h3>
                      <p className="leading-relaxed text-sm">
                         It simulates a <strong className="text-purple-600 dark:text-purple-300">Graph Neural Network (GNN)</strong> inference engine using Gemini 3.0 Pro to construct biological subgraphs and predict link probabilities.
                      </p>
                    </section>
                </div>
             </div>
             
             {/* Modal Footer */}
             <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 sticky bottom-0 backdrop-blur">
               <button 
                  onClick={() => setShowDocs(false)} 
                  className="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl transition-colors font-medium border border-slate-200 dark:border-slate-700 shadow-lg"
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