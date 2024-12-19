#!/bin/bash

echo "🔍 Starting performance measurement..."

# Enable React profiling
export REACT_PROFILER=true

# Start the development server in the background
echo "🚀 Starting development server..."
bun dev &
SERVER_PID=$!

# Wait for server to be ready
sleep 5

# Run Lighthouse CI
echo "📊 Running Lighthouse analysis..."
lighthouse http://localhost:3000 \
  --output json \
  --output html \
  --output-path ./lighthouse-report \
  --chrome-flags="--headless" \
  --only-categories=performance,accessibility,best-practices

# Kill the development server
kill $SERVER_PID

echo "✨ Performance measurement complete!"
echo "📝 Check lighthouse-report.html for detailed results" 