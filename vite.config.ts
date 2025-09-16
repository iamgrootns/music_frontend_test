import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/model-y': {
        target: 'https://api.runpod.ai/v2/6jx8w05r889z4o/run',
        changeOrigin: true,
        rewrite: (path) => '',
        headers: {
          'Authorization': `Bearer ${process.env.VITE_RUNPOD_API_KEY}`,
          'Content-Type': 'application/json'
        }
      },
      '/api/model-x': {
        target: 'https://api.runpod.ai/v2/z26fexmzkqeb3n/run',
        changeOrigin: true,
        rewrite: (path) => '',
        headers: {
          'Authorization': `Bearer ${process.env.VITE_RUNPOD_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
