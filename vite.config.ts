import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  // Configuration pour GitHub Pages
  base: process.env.NODE_ENV === 'production' ? '/lokali-platform/' : '/',
  plugins: [
    react(),
    // Analyse du bundle
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Compression gzip
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Compression brotli
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Simplification pour éviter les cycles entre chunks (vendor/react-core)
          // Tous les modules node_modules vont dans 'vendor'
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    },
    chunkSizeWarningLimit: 250, // Réduit pour forcer l'optimisation
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    // Optimisations supplémentaires
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: true,
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'lucide-react',
      '@tanstack/react-query',
      'date-fns',
    ],
    exclude: ['@supabase/supabase-js'] // Lazy load Supabase
  },
  // Configuration du serveur de développement
  server: {
    port: 8082,
    host: true,
  },
  // Préchargement des modules critiques
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { runtime: `window.__assetsPath(${JSON.stringify(filename)})` }
      }
    }
  }
});
