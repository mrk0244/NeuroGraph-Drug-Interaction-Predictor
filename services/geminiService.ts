import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, NodeType } from "../types";

// Initialize Gemini
// Note: We use process.env.API_KEY as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const predictInteractions = async (drugs: string[]): Promise<AnalysisResult> => {
  // Upgraded to gemini-3-pro-preview for higher accuracy on complex reasoning tasks
  const modelId = "gemini-3-pro-preview";
  
  const drugsList = drugs.join('", "');

  const prompt = `
    Act as a senior Clinical Toxicologist and Biomedical Knowledge Graph expert. 
    Perform a high-precision analysis of the potential polypharmacy interactions between the following list of drugs: "${drugsList}".
    
    Execute the following cognitive analysis steps to ensure accuracy:
    1. **Pharmacokinetic (PK) Analysis**: Evaluate if these drugs compete for the same metabolic enzymes (specifically CYP450 isozymes like CYP3A4, CYP2D6, CYP2C9). Is one drug an inhibitor or inducer of the others' metabolism? Check for P-glycoprotein (P-gp) transporter interactions.
    2. **Pharmacodynamic (PD) Analysis**: Evaluate if the drugs act on the same receptors or physiological pathways (e.g., additive CNS depression, QT prolongation, serotonin syndrome risk, or bleeding risk). Consider cumulative effects of multiple drugs.
    3. **Graph Construction**: Construct a causal subgraph that explains *why* the interactions occur.
    
    The subgraph should include:
       - **Drug Nodes**: The input drugs.
       - **Mechanism Nodes**: Specific enzymes (e.g., "CYP3A4"), receptors (e.g., "5-HT Receptor"), or pathways involved.
       - **Outcome Nodes**: The predicted clinical side effects.
       - **Links**: Scientifically accurate edge labels (e.g., "inhibits", "substrate_of", "prolongs", "synergizes_with").
    
    For every node, provide a concise, high-quality scientific description.
    Provide a confidence score (0.0 to 1.0) for the predicted side effects based on established medical literature.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "A detailed clinical summary explaining the mechanism of the interaction (PK/PD) among the combination."
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
            description: { type: Type.STRING, description: "Scientific description of the entity." }
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
            type: { type: Type.STRING, description: "Scientific edge label, e.g., 'inhibits', 'metabolized_by'" }
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
        temperature: 0.1, // Lower temperature for maximum factual accuracy and consistency
      }
    });

    const result = JSON.parse(response.text);
    return result as AnalysisResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze drug interactions. Please check your API key or try again.");
  }
};