import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react') || id.includes('react-dropzone')) {
              return 'ui-vendor';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'map-vendor';
            }
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            return 'vendor';
          }
          
          // Feature chunks
          if (id.includes('MessageSystem') || id.includes('messageService')) {
            return 'messaging';
          }
          if (id.includes('MediaGallery') || id.includes('VideoUpload') || id.includes('videoService')) {
            return 'media';
          }
          if (id.includes('Dashboard') || id.includes('revenueService')) {
            return 'dashboard';
          }
        }
      }
    },
    chunkSizeWarningLimit: 300,
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  }
});
