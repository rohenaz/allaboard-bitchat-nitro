import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import macrosPlugin from 'vite-plugin-babel-macros';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          'babel-plugin-macros',
          [
            'babel-plugin-styled-components',
            {
              displayName: true,
              ssr: false,
            },
          ],
        ],
      },
    }),
    macrosPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    sourcemap: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core dependencies
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/')
          ) {
            return 'react-core';
          }

          // Routing
          if (
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/history/')
          ) {
            return 'routing';
          }

          // State management
          if (
            id.includes('node_modules/react-redux') ||
            id.includes('node_modules/@reduxjs/toolkit')
          ) {
            return 'redux';
          }

          // UI and styling
          if (id.includes('node_modules/styled-components')) {
            return 'styling';
          }

          // Bitcoin/BSV related
          if (
            id.includes('node_modules/@bsv/') ||
            id.includes('node_modules/bsv-bap/')
          ) {
            return 'bitcoin';
          }

          // Utils and polyfills
          if (
            id.includes('node_modules/buffer/') ||
            id.includes('node_modules/node-polyfills/')
          ) {
            return 'utils';
          }
        },
        // Optimize chunk distribution
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
  },
});
