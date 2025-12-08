import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the Google GenAI SDK and API Key usage
      'process.env': {
        API_KEY: JSON.stringify(env.API_KEY || process.env.API_KEY || "AIzaSyCWtGPNEF4_FX9zmhXSTNUDbYhddMJlijI")
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    }
  };
});