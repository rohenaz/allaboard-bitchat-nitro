import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import macrosPlugin from 'vite-plugin-babel-macros';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

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
              ssr: false
            }
          ]
        ]
      }
    }),
    macrosPlugin(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      stream: 'vite-compatible-readable-stream',
    },
  },
  define: {
    'process.env': {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development',
      NODE_VERSION: process.versions.node || '18.0.0'
    },
    global: 'globalThis',
    Buffer: ['buffer', 'Buffer']
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-redux',
      '@reduxjs/toolkit',
      '@mui/material',
      'styled-components',
      '@bsv/sdk',
      'bsv-bap',
      'buffer'
    ],
    esbuildOptions: {
      target: 'esnext',
      jsx: 'automatic',
      platform: 'browser'
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'react-redux',
            '@reduxjs/toolkit',
            '@mui/material',
            'styled-components',
            '@bsv/sdk',
            'bsv-bap'
          ]
        }
      }
    }
  }
}); 