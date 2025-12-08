
export enum NodeType {
  DRUG = 'DRUG',
  PROTEIN = 'PROTEIN',
  SIDE_EFFECT = 'SIDE_EFFECT'
}

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  val?: number; // for visualization size
  description?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string; // e.g., "targets", "interacts_with", "causes"
  strength?: number;
}

export interface InteractionPrediction {
  sideEffect: string;
  probability: number;
  description: string;
}

export interface AnalysisResult {
  nodes: GraphNode[];
  links: GraphLink[];
  predictions: InteractionPrediction[];
  summary: string;
}

export interface DrugOption {
  value: string;
  label: string;
}

export interface AnalysisSession {
  id: string;
  drugs: string[]; // List of drugs in the analysis
  result: AnalysisResult;
  timestamp: number;
}
