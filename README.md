# NeuroGraph: Drug Interaction Predictor

## Overview
NeuroGraph is an AI-powered biomedical simulator that uses Graph Neural Networks (GNNs) logic to predict polypharmacy side effects.

## System Workflow
1.  **Input Selection**: User pairs two pharmaceutical compounds.
2.  **Knowledge Retrieval**: System identifies proteins, enzymes, and metabolic pathways associated with the drugs.
3.  **Graph Construction**: A knowledge subgraph is built, mapping drugs (sources) to proteins (targets).
4.  **GNN Inference**: The model simulates a Graph Neural Network to predict missing links (side effects) based on topology.
5.  **Risk Assessment**: The system outputs a probability score and a warning for potential adverse events.

## Installation & Deployment

This project uses **Vite** as a build tool. To run it locally or deploy it to GitHub Pages, follow these steps:

### 1. Install Dependencies
Make sure you have Node.js installed, then run:
```bash
npm install
```

### 2. Configure API Key
Create a `.env` file in the root directory (or set it in your environment variables):
```
API_KEY=your_gemini_api_key_here
```

### 3. Run Locally
To start the development server:
```bash
npm run dev
```

### 4. Build for GitHub Pages
1.  Run the build command:
    ```bash
    npm run build
    ```
2.  This will create a `dist` folder.
3.  Upload the contents of the `dist` folder to your GitHub repository (or use a `gh-pages` deployment action).

**Note for GitHub Pages**: If deploying to a subdirectory (e.g., `username.github.io/repo-name`), you may need to set the `base` property in `vite.config.ts`.

## How to Work With This App

### 1. Define Interaction
*   Locate the **Select Compounds** panel on the left.
*   Enter the name of the first drug (e.g., *Warfarin*) in the "Drug A" field.
*   Enter the name of the second drug (e.g., *Aspirin*) in the "Drug B" field.

### 2. Run Simulation
*   Click the **Run Prediction** button.
*   The system will use the Gemini API to generate a knowledge graph subgraph and predict potential side effects based on biological mechanisms.

### 3. Analyze Results
*   **Summary:** Read the scientific summary of how these drugs interact.
*   **Predictions:** Review the list of predicted side effects and their probability scores.
*   **Confidence:** Check the radial chart for the model's confidence levels.

### 4. Explore the Graph
*   **Zoom:** Use your mouse wheel or trackpad to zoom in and out of the network.
*   **Pan:** Click and drag the background to move around the graph.
*   **Details:** Click on any node (Drug, Protein, or Side Effect) to view its specific biological description in the overlay panel.
*   **Fullscreen:** Use the expand icon in the graph header to toggle fullscreen mode for a better view of the topology.

## Technical Details
This application simulates GNN link prediction by using a Large Language Model (Gemini 2.5) to construct the graph topology and infer relationships (edges) that would likely exist in a complete biomedical knowledge graph.