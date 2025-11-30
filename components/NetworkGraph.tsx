import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink, NodeType } from '../types';

interface NetworkGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (node: GraphNode | null) => void;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, links, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  // Initialize Graph
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Create a copy of the data to avoid mutating props
    const nodesData = nodes.map(d => ({ ...d }));
    const linksData = links.map(d => ({ ...d }));

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");
      
    // Handle background click to deselect
    svg.on("click", (event) => {
        if (event.target.tagName === 'svg' && onNodeClick) {
            onNodeClick(null);
        }
    });

    // Create a container group for zooming
    const g = svg.append("g");
    gRef.current = g;

    // Add Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any)
       .on("dblclick.zoom", null);

    // Simulation setup
    const simulation = d3.forceSimulation(nodesData as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(linksData).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));
    
    simulationRef.current = simulation;

    // Arrow markers
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .join("marker")
      .attr("id", d => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#64748b")
      .attr("d", "M0,-5L10,0L0,5");

    // Links
    const link = g.append("g")
      .attr("stroke", "#64748b")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(linksData)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow-end)");

    // Link labels
    const linkLabel = g.append("g")
        .selectAll("text")
        .data(linksData)
        .enter()
        .append("text")
        .attr("class", "text-[10px] fill-slate-400 opacity-0 transition-opacity duration-300 pointer-events-none")
        .text((d: any) => d.type);

    // Nodes
    const node = g.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodesData)
      .join("circle")
      .attr("r", (d: any) => d.val ? d.val * 3 + 8 : 10)
      .attr("fill", (d: any) => {
        switch (d.type) {
          case NodeType.DRUG: return "#a855f7";
          case NodeType.PROTEIN: return "#3b82f6";
          case NodeType.SIDE_EFFECT: return "#ef4444";
          default: return "#94a3b8";
        }
      })
      .style("cursor", "grab")
      .call(drag(simulation) as any);

    // Labels
    const label = g.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodesData)
      .join("text")
      .attr("dx", 15)
      .attr("dy", ".35em")
      .text((d: any) => d.label)
      .attr("fill", "#e2e8f0")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.8)");

    // Click interactions
    node.on("click", (event, d) => {
        event.stopPropagation(); // Stop click from reaching svg background
        if (onNodeClick) {
            // Find the original node object to pass back full data including description
            const originalNode = nodes.find(n => n.id === (d as any).id);
            if (originalNode) onNodeClick(originalNode);
        }
    });

    // Hover interactions
    node.on("mouseover", function(event, d) {
        d3.select(this)
          .transition().duration(200)
          .attr("r", (d: any) => (d.val ? d.val * 3 + 8 : 10) * 1.3)
          .attr("stroke", "#fff")
          .attr("stroke-width", 3);
          
        link.style("stroke", (l: any) => (l.source === d || l.target === d) ? "#fff" : "#64748b")
            .style("stroke-opacity", (l: any) => (l.source === d || l.target === d) ? 1 : 0.1)
            .style("stroke-width", (l: any) => (l.source === d || l.target === d) ? 2.5 : 1.5);
            
        linkLabel.style("opacity", (l: any) => (l.source === d || l.target === d) ? 1 : 0);
    })
    .on("mouseout", function(event, d) {
        d3.select(this)
          .transition().duration(200)
          .attr("r", (d: any) => d.val ? d.val * 3 + 8 : 10)
          .attr("stroke-width", 1.5);
          
        link.style("stroke", "#64748b")
            .style("stroke-opacity", 0.4)
            .style("stroke-width", 1.5);
            
        linkLabel.style("opacity", 0);
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
        d3.select(event.sourceEvent.target).style("cursor", "grabbing");
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
        d3.select(event.sourceEvent.target).style("cursor", "grab");
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, onNodeClick]);

  // Handle Resize with requestAnimationFrame to prevent ResizeObserver loop error
  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    let animationFrameId: number;

    const resizeObserver = new ResizeObserver((entries) => {
      // Clear any pending animation frame
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      // Wrap updates in requestAnimationFrame
      animationFrameId = requestAnimationFrame(() => {
        if (!entries[0] || !svgRef.current) return;
        
        const { width, height } = entries[0].contentRect;
        
        // Update SVG dimensions
        d3.select(svgRef.current).attr("viewBox", [0, 0, width, height]);
        
        // Update simulation center
        if (simulationRef.current) {
          simulationRef.current.force("center", d3.forceCenter(width / 2, height / 2));
          simulationRef.current.alpha(0.3).restart();
        }
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden rounded-xl bg-slate-900 border border-slate-700 shadow-inner group">
      <div className="absolute top-4 left-4 z-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-60">
        <div className="flex flex-col gap-2 bg-slate-800/80 p-3 rounded-lg backdrop-blur-sm border border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs text-slate-300">Drug</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-slate-300">Target / Protein</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-300">Side Effect</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
        <div className="bg-slate-800/80 px-3 py-1.5 rounded-full backdrop-blur-sm border border-slate-700/50 text-[10px] text-slate-400">
           Scroll to Zoom • Drag to Pan • Click Node for Details
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-move"></svg>
    </div>
  );
};

export default NetworkGraph;