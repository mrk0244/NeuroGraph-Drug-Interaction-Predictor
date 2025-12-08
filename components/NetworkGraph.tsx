import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink, NodeType } from '../types';

interface NetworkGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (node: GraphNode | null) => void;
  isDarkMode?: boolean;
}

// Workaround for d3 type definition issues
const d3Any = d3 as any;

const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, links, onNodeClick, isDarkMode = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<any>(null);
  const gRef = useRef<any>(null);

  // Initialize Graph
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    // Clear previous graph and tooltips
    d3Any.select(svgRef.current).selectAll("*").remove();
    d3Any.select(containerRef.current).selectAll(".graph-tooltip").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Create a copy of the data to avoid mutating props
    const nodesData = nodes.map(d => ({ ...d }));
    const linksData = links.map(d => ({ ...d }));

    const svg = d3Any.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");
      
    // Handle background click to deselect
    svg.on("click", (event: any) => {
        if (event.target.tagName === 'svg' && onNodeClick) {
            onNodeClick(null);
        }
    });

    // Create a container group for zooming
    const g = svg.append("g");
    gRef.current = g;

    // Create Tooltip - Enhanced styling
    const tooltip = d3Any.select(containerRef.current)
      .append("div")
      .attr("class", "graph-tooltip absolute z-[60] px-3 py-2.5 text-xs text-slate-800 dark:text-white bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 rounded-lg shadow-xl backdrop-blur-sm pointer-events-none opacity-0 transition-opacity duration-300 ease-out max-w-[240px] leading-relaxed")
      .style("top", "0px")
      .style("left", "0px");

    // Add Zoom behavior
    const zoom = d3Any.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event: any) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any)
       .on("dblclick.zoom", null);

    // Simulation setup
    const simulation = d3Any.forceSimulation(nodesData)
      .force("link", d3Any.forceLink(linksData).id((d: any) => d.id).distance(120))
      .force("charge", d3Any.forceManyBody().strength(-400))
      .force("center", d3Any.forceCenter(width / 2, height / 2))
      .force("collide", d3Any.forceCollide().radius(40));
    
    simulationRef.current = simulation;

    // Colors for graph elements based on theme
    const linkColor = isDarkMode ? "#64748b" : "#94a3b8";
    const textColor = isDarkMode ? "#e2e8f0" : "#1e293b";
    const arrowColor = isDarkMode ? "#64748b" : "#94a3b8";

    // Arrow markers
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .join("marker")
      .attr("id", (d: any) => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", arrowColor)
      .attr("d", "M0,-5L10,0L0,5");

    // Links
    const linkGroup = g.append("g")
      .attr("stroke", linkColor)
      .attr("stroke-opacity", 0); // Start invisible for fade-in
      
    const link = linkGroup
      .selectAll("line")
      .data(linksData)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow-end)");

    // Animate Links (Fade In)
    linkGroup.transition()
      .duration(1000)
      .delay(200)
      .attr("stroke-opacity", 0.4);

    // Link labels
    const linkLabel = g.append("g")
        .selectAll("text")
        .data(linksData)
        .enter()
        .append("text")
        .attr("class", "text-[10px] fill-slate-500 dark:fill-slate-400 opacity-0 transition-opacity duration-300 pointer-events-none")
        .text((d: any) => d.type);

    // Nodes
    const node = g.append("g")
      .attr("stroke", isDarkMode ? "#fff" : "#f8fafc")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodesData)
      .join("circle")
      .attr("r", 0) // Start at 0 for pop-in animation
      .attr("fill", (d: any) => {
        switch (d.type) {
          case NodeType.DRUG: return "#a855f7"; // Purple
          case NodeType.PROTEIN: return "#3b82f6"; // Blue
          case NodeType.SIDE_EFFECT: return "#ef4444"; // Red
          default: return "#94a3b8";
        }
      })
      .style("cursor", "grab")
      .call(drag(simulation) as any);

    // Animate Nodes (Pop In)
    node.transition()
      .duration(600)
      .delay((d: any, i: number) => Math.random() * 300)
      .ease(d3Any.easeBackOut.overshoot(1.7))
      .attr("r", (d: any) => d.val ? d.val * 3 + 8 : 10);

    // Labels
    const labelGroup = g.append("g")
      .attr("class", "labels")
      .attr("opacity", 0); // Start invisible

    const label = labelGroup
      .selectAll("text")
      .data(nodesData)
      .join("text")
      .attr("dx", 15)
      .attr("dy", ".35em")
      .text((d: any) => d.label)
      .attr("fill", textColor)
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("text-shadow", isDarkMode ? "0 1px 3px rgba(0,0,0,0.8)" : "0 1px 3px rgba(255,255,255,0.8)");

    // Animate Labels (Fade In)
    labelGroup.transition()
      .duration(800)
      .delay(400)
      .attr("opacity", 1);

    // Click interactions
    node.on("click", (event: any, d: any) => {
        event.stopPropagation(); // Stop click from reaching svg background
        if (onNodeClick) {
            // Find the original node object to pass back full data including description
            const originalNode = nodes.find(n => n.id === (d as any).id);
            if (originalNode) onNodeClick(originalNode);
        }
    });

    // Hover interactions
    node.on("mouseover", function(this: any, event: any, d: any) {
        // Node highlight
        d3Any.select(this)
          .transition().duration(200)
          .attr("r", (d: any) => (d.val ? d.val * 3 + 8 : 10) * 1.3)
          .attr("stroke", isDarkMode ? "#fff" : "#0f172a")
          .attr("stroke-width", 3);
          
        // Link highlight
        link.style("stroke", (l: any) => (l.source === d || l.target === d) ? (isDarkMode ? "#fff" : "#0f172a") : linkColor)
            .style("stroke-opacity", (l: any) => (l.source === d || l.target === d) ? 1 : 0.1)
            .style("stroke-width", (l: any) => (l.source === d || l.target === d) ? 2.5 : 1.5);
            
        linkLabel.style("opacity", (l: any) => (l.source === d || l.target === d) ? 1 : 0);

        // Tooltip show with dynamic content
        const typeColor = d.type === 'DRUG' ? '#a855f7' : d.type === 'PROTEIN' ? '#3b82f6' : '#ef4444';
        
        tooltip.transition().duration(200).ease(d3Any.easeCubicOut).style("opacity", 1);
        tooltip.html(`
            <div class="flex items-center gap-2 mb-1 border-b border-slate-200 dark:border-slate-700/50 pb-1">
                <div class="w-2 h-2 rounded-full shadow-[0_0_8px_${typeColor}]" style="background-color: ${typeColor}"></div>
                <div class="font-bold text-slate-900 dark:text-slate-100">${d.label}</div>
            </div>
            <div class="text-[11px] text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
              ${d.description || 'No description available for this entity.'}
            </div>
        `);
    })
    .on("mousemove", function(event: any) {
        // Tooltip move with improved offset
        const [x, y] = d3Any.pointer(event, containerRef.current);
        const containerWidth = containerRef.current?.clientWidth || 0;
        const containerHeight = containerRef.current?.clientHeight || 0;
        
        // Smart positioning to avoid clipping
        let left = x + 15;
        let top = y + 15;
        
        // If too close to right edge, flip to left
        if (left > containerWidth - 250) {
             left = x - 255;
        }

        // If too close to bottom edge, flip up
        if (top > containerHeight - 120) {
            top = y - 130;
        }

        tooltip
            .style("left", `${left}px`)
            .style("top", `${top}px`);
    })
    .on("mouseout", function(this: any, event: any, d: any) {
        // Reset node style
        d3Any.select(this)
          .transition().duration(200)
          .attr("r", (d: any) => d.val ? d.val * 3 + 8 : 10)
          .attr("stroke-width", 1.5);
          
        // Reset link style
        link.style("stroke", linkColor)
            .style("stroke-opacity", 0.4) // Reset to standard opacity
            .style("stroke-width", 1.5);
            
        linkLabel.style("opacity", 0);

        // Tooltip hide
        tooltip.transition().duration(200).ease(d3Any.easeCubicIn).style("opacity", 0);
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

    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
        d3Any.select(event.sourceEvent.target).style("cursor", "grabbing");
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        d3Any.select(event.sourceEvent.target).style("cursor", "grab");
      }

      return d3Any.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, onNodeClick, isDarkMode]);

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
        d3Any.select(svgRef.current).attr("viewBox", [0, 0, width, height]);
        
        // Update simulation center
        if (simulationRef.current) {
          simulationRef.current.force("center", d3Any.forceCenter(width / 2, height / 2));
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
    <div ref={containerRef} className="w-full h-full relative overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-inner group transition-colors duration-300">
      <div className="absolute top-4 left-4 z-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-60">
        <div className="flex flex-col gap-2 bg-white/80 dark:bg-slate-800/80 p-3 rounded-lg backdrop-blur-sm border border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">Drug</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">Target / Protein</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300">Side Effect</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden sm:block">
        <div className="bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 text-[10px] text-slate-500 dark:text-slate-400">
           Scroll to Zoom • Drag to Pan • Click Node for Details
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-move"></svg>
    </div>
  );
};

export default NetworkGraph;