import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, NodeType } from "../types";

// Initialize Gemini
// Note: We use process.env.API_KEY as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const predictInteractions = async (drugA: string, drugB: string): Promise<AnalysisResult> => {
  const modelId = "gemini-2.5-flash";
  
  const prompt = `
    Act as a biomedical Knowledge Graph Neural Network (GNN) expert system. 
    Analyze the potential polypharmacy interactions between "${drugA}" and "${drugB}".
    
    1. Identify the biological mechanism of action for both drugs (primary protein targets).
    2. Predict potential side effects (edges in a knowledge graph) that arise specifically from the combination of these two drugs (polypharmacy).
    3. Generate a subgraph structure that a GNN would use to make this prediction. This subgraph should include:
       - The two drugs (Nodes)
       - Key target proteins or pathways (Nodes)
       - The predicted side effects (Nodes)
       - Relationships between them (Links: e.g., "targets", "synergizes_with", "causes")
    
    For every node, provide a concise scientific description (e.g., "A protein involved in blood coagulation" or "A common NSAID").
    Provide a confidence score (0.0 to 1.0) for the predicted side effects.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "A concise scientific summary of the interaction mechanism."
      },
      nodes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            label: { type: Type.STRING },
            type: { type: Type.STRING, enum: [NodeType.DRUG, NodeType.PROTEIN, NodeType.SIDE_EFFECT] },
            val: { type: Type.NUMBER, description: "Relative importance size, 1-10" },
            description: { type: Type.STRING, description: "Short scientific description of the entity." }
          },
          required: ["id", "label", "type", "description"]
        }
      },
      links: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            source: { type: Type.STRING },
            target: { type: Type.STRING },
            type: { type: Type.STRING, description: "Label for the edge, e.g., 'inhibits', 'targets'" }
          },
          required: ["source", "target", "type"]
        }
      },
      predictions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sideEffect: { type: Type.STRING },
            probability: { type: Type.NUMBER },
            description: { type: Type.STRING }
          },
          required: ["sideEffect", "probability", "description"]
        }
      }
    },
    required: ["summary", "nodes", "links", "predictions"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for more factual scientific retrieval
      }
    });

    const result = JSON.parse(response.text);
    return result as AnalysisResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze drug interactions. Please check your API key or try again.");
  }
};