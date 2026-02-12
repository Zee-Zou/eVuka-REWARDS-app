import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";

const conditionalPlugins: [string, Record<string, any>][] = [];

// https://vitejs.dev/config/
export default defineConfig({
  base:
    process.env.NODE_ENV === "development"
      ? "/"
      : process.env.VITE_BASE_PATH || "/",
  optimizeDeps: {
    entries: ["src/main.tsx", "src/tempobook/**/*"],
  },
  plugins: [
    react({
      plugins: conditionalPlugins,
    }),
    tempo(),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: process.env.TEMPO === "true" ? true : undefined,
  },
  build: {
    target: "ES2020",
    minify: "terser",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React dependencies
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor-react';
          }

          // Router - separate chunk for navigation
          if (id.includes('react-router')) {
            return 'vendor-router';
          }

          // Supabase - backend communication
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }

          // Socket.io - real-time features
          if (id.includes('socket.io')) {
            return 'vendor-socket';
          }

          // Radix UI components - lazy load
          if (id.includes('@radix-ui')) {
            return 'vendor-ui';
          }

          // Chart libraries - heavy, lazy load
          if (id.includes('@nivo') || id.includes('chart.js')) {
            return 'vendor-charts';
          }

          // OCR library - very heavy, lazy load
          if (id.includes('tesseract')) {
            return 'vendor-ocr';
          }

          // Image processing
          if (id.includes('browser-image-compression') || id.includes('canvas')) {
            return 'vendor-image';
          }

          // Icons
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }

          // Crypto libraries
          if (id.includes('@noble/hashes') || id.includes('dompurify')) {
            return 'vendor-crypto';
          }

          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor-other';
          }
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500, // 500 KB limit
  },
});