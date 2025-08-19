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
          // Vendor chunks optimisés
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            if (id.includes('react-router')) {
              return 'react-router';
            }
            if (id.includes('react-query') || id.includes('@tanstack')) {
              return 'react-query';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'maps';
            }
            if (id.includes('date-fns')) {
              return 'date-utils';
            }
            if (id.includes('supabase')) {
              return 'supabase';
            }
            if (id.includes('react-dropzone') || id.includes('react-helmet')) {
              return 'ui-libs';
            }
            return 'vendor';
          }
          
          // Feature chunks optimisés
          if (id.includes('MessageSystem') || id.includes('messageService') || id.includes('NotificationCenter')) {
            return 'messaging';
          }
          if (id.includes('MediaGallery') || id.includes('VideoUpload') || id.includes('videoService')) {
            return 'media';
          }
          if (id.includes('Dashboard') || id.includes('revenueService') || id.includes('analytics')) {
            return 'dashboard';
          }
          if (id.includes('PWA') || id.includes('pushNotification') || id.includes('serviceWorker')) {
            return 'pwa';
          }
          if (id.includes('SEO') || id.includes('sitemap') || id.includes('performance')) {
            return 'seo-performance';
          }
          if (id.includes('Accessibility') || id.includes('useAccessibility')) {
            return 'accessibility';
          }
          if (id.includes('Map') || id.includes('geocoding') || id.includes('AddressAutocomplete')) {
            return 'geolocation';
          }
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
