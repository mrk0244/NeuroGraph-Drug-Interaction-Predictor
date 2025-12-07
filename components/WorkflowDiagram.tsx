import React from 'react';
import { Database, Search, Share2, BrainCircuit, FileText, ArrowRight } from 'lucide-react';

const WorkflowDiagram: React.FC = () => {
  const steps = [
    { 
      icon: Database, 
      title: "Input Selection", 
      desc: "User pairs two pharmaceutical compounds",
      color: "bg-slate-700 text-slate-300" 
    },
    { 
      icon: Search, 
      title: "Knowledge Retrieval", 
      desc: "System identifies proteins & pathways",
      color: "bg-blue-900/40 text-blue-400 border-blue-800" 
    },
    { 
      icon: Share2, 
      title: "Graph Construction", 
      desc: "Nodes and edges form a subgraph",
      color: "bg-purple-900/40 text-purple-400 border-purple-800" 
    },
    { 
      icon: BrainCircuit, 
      title: "GNN Inference", 
      desc: "Model predicts unobserved side effects",
      color: "bg-purple-600 text-white shadow-lg shadow-purple-900/50" 
    },
    { 
      icon: FileText, 
      title: "Risk Assessment", 
      desc: "Probabilities & warnings generated",
      color: "bg-slate-700 text-slate-300" 
    },
  ];

  return (
    <div className="w-full py-6 overflow-x-auto custom-scrollbar">
      <div className="flex items-start min-w-[700px] justify-between px-2">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center text-center gap-3 w-32 group relative">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-slate-600/50 transition-all duration-300 ${step.color} group-hover:scale-110`}>
                <step.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-1">{step.title}</h4>
                <p className="text-[10px] text-slate-400 leading-tight">{step.desc}</p>
              </div>
              
              {/* Step Number Badge */}
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                {index + 1}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className="flex-1 flex items-center justify-center pt-5 text-slate-600">
                <ArrowRight className="w-5 h-5 animate-pulse" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WorkflowDiagram;