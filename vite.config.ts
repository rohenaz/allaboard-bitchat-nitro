import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import macrosPlugin from 'vite-plugin-babel-macros';
import path from 'path';

export default defineConfig({
  plugins: [
    macrosPlugin(),
    react({
      include: '**/*.{jsx,tsx}',
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: [
          [
            'babel-plugin-styled-components',
            {
              displayName: true,
              fileName: false
            }
          ],
          'babel-plugin-macros',
          '@emotion/babel-plugin'
        ],
        parserOpts: {
          sourceType: 'module'
        }
      }
    }),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'process', 'util'],
      globals: {
        Buffer: true,
        process: true,
      },
      protocolImports: true,
      overrides: {
        fs: 'memfs',
        stream: 'stream-browserify'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'stream': 'stream-browserify',
      'crypto': 'crypto-browserify',
      'util': 'util',
      'process': 'process/browser',
      'buffer': 'buffer'
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
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
      'buffer',
      '@emotion/react',
      '@emotion/styled'
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
            'bsv-bap',
            '@emotion/react',
            '@emotion/styled'
          ]
        }
      }
    }
  }
}); 