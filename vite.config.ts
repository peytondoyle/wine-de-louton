import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { defineConfig as defineVitestConfig } from 'vitest/config'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(
  defineVitestConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'vendor-react': ['react', 'react-dom'],
            'vendor-radix': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip'],
            'vendor-icons': ['lucide-react'],
            'vendor-utils': ['date-fns', 'clsx'],
            
            // Feature chunks
            'feature-wines': [
              './src/features/wines/components/WineGrid.tsx',
              './src/features/wines/components/WineCard.tsx',
              './src/features/wines/data/wines.ts'
            ],
            'feature-cellar': [
              './src/features/cellar/components/PlacementEditor.tsx',
              './src/features/cellar/CellarPlacementPicker.tsx',
              './src/features/cellar/data/cellar.ts'
            ],
            'feature-enrichment': [
              './src/features/enrichment/components/EnrichmentReviewPanel.tsx',
              './src/features/enrichment/data/enrich.ts'
            ],
            
            // UI chunks
            'ui-components': [
              './src/components/ui/Dialog.tsx',
              './src/components/ui/Button.tsx',
              './src/components/ui/Input.tsx'
            ]
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
    },
  })
)
