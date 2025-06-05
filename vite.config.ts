import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
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
              ssr: false,
            },
          ],
        ],
      },
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
      '@': path.resolve(__dirname, './src'),
      'bigblocks/nextjs': 'bigblocks',
      'bigblocks/express': 'bigblocks',
      'bigblocks/astro': 'bigblocks',
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  define: {
    'process.env': {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development',
      NODE_VERSION: process.versions.node || '18.0.0',
    },
    global: 'globalThis',
    Buffer: ['buffer', 'Buffer'],
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
    ],
    exclude: [
      'bigblocks',
      'bigblocks/nextjs',
      'bigblocks/express',
      'bigblocks/astro',
      'next',
      'next/server',
      'express',
    ],
    esbuildOptions: {
      target: 'esnext',
      jsx: 'automatic',
      platform: 'browser',
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    sourcemap: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      external: ['next', 'next/server', 'next/request', 'express'],
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
