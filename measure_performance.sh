#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to cleanup on exit
cleanup() {
    if [ ! -z "$SERVER_PID" ]; then
        echo -e "${BLUE}Cleaning up...${NC}"
        kill $SERVER_PID 2>/dev/null
    fi
}
trap cleanup EXIT

# Check required dependencies
if ! command_exists lighthouse; then
    echo -e "${RED}Error: lighthouse is not installed. Please run: npm install -g lighthouse${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Starting comprehensive performance measurement...${NC}"

# Create results directory
RESULTS_DIR="performance_results"
mkdir -p $RESULTS_DIR

# Kill any existing Vite processes
echo -e "${BLUE}Ensuring no other Vite servers are running...${NC}"
pkill -f "vite" || true
sleep 2

# Enable React profiling and development build
export REACT_PROFILER=true
export NODE_ENV=development

# Start the development server and capture its output
echo -e "${BLUE}🚀 Starting development server...${NC}"
bun dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready and detect port
echo "Waiting for server to start..."
while ! grep -q "Local:" server.log; do
    sleep 1
    if ! ps -p $SERVER_PID > /dev/null; then
        echo -e "${RED}Server failed to start${NC}"
        cat server.log
        exit 1
    fi
done

# Extract the port from the server log
VITE_PORT=$(grep "Local:" server.log | grep -o ":[0-9]\+" | grep -o "[0-9]\+")
APP_URL="http://localhost:$VITE_PORT"

echo -e "${BLUE}Testing server at $APP_URL${NC}"

# Wait for server to be fully ready
MAX_RETRIES=10
RETRY_COUNT=0
while ! curl --output /dev/null --silent --head --fail "$APP_URL"; do
    sleep 1
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo -e "${RED}Error: Server is not responding at $APP_URL${NC}"
        cat server.log
        exit 1
    fi
done

# Run initial bundle size analysis
echo -e "${BLUE}📦 Analyzing bundle size...${NC}"
if [ -d "dist" ]; then
    BUNDLE_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    echo -e "Bundle size: ${GREEN}$BUNDLE_SIZE${NC}"
else
    echo -e "${RED}Warning: dist directory not found. Running build first...${NC}"
    bun run build
    BUNDLE_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    echo -e "Bundle size: ${GREEN}$BUNDLE_SIZE${NC}"
fi

# Run Lighthouse CI for multiple metrics
echo -e "${BLUE}📊 Running Lighthouse analysis...${NC}"
lighthouse "$APP_URL" \
  --output json \
  --output html \
  --output-path ./$RESULTS_DIR/lighthouse-report \
  --chrome-flags="--headless" \
  --only-categories=performance,accessibility,best-practices,seo \
  --quiet

# Run React profiler measurements
echo -e "${BLUE}⚛️ Running React profiler analysis...${NC}"
curl -s "$APP_URL" > /dev/null
sleep 2

# Memory usage analysis
echo -e "${BLUE}💾 Analyzing memory usage...${NC}"
ps -o pid,rss,command | grep "bun" | grep -v grep > ./$RESULTS_DIR/memory_usage.txt

# Network requests analysis
echo -e "${BLUE}🌐 Analyzing network requests...${NC}"
curl -s -w "@curl-format.txt" -o /dev/null "$APP_URL" > ./$RESULTS_DIR/network_metrics.txt

# Parse Lighthouse scores
if [ -f "./$RESULTS_DIR/lighthouse-report.json" ]; then
    PERFORMANCE=$(jq '.categories.performance.score * 100' ./$RESULTS_DIR/lighthouse-report.json)
    ACCESSIBILITY=$(jq '.categories.accessibility.score * 100' ./$RESULTS_DIR/lighthouse-report.json)
    BEST_PRACTICES=$(jq '.categories["best-practices"].score * 100' ./$RESULTS_DIR/lighthouse-report.json)
    SEO=$(jq '.categories.seo.score * 100' ./$RESULTS_DIR/lighthouse-report.json)
fi

# Generate summary report
echo -e "${BLUE}📝 Generating summary report...${NC}"
cat << EOF > ./$RESULTS_DIR/summary.md
# Performance Test Results

## Bundle Size
- Size: $BUNDLE_SIZE

## Lighthouse Scores
- Performance: ${PERFORMANCE:-"N/A"}
- Accessibility: ${ACCESSIBILITY:-"N/A"}
- Best Practices: ${BEST_PRACTICES:-"N/A"}
- SEO: ${SEO:-"N/A"}

## Memory Usage
\`\`\`
$(cat ./$RESULTS_DIR/memory_usage.txt)
\`\`\`

## Network Metrics
\`\`\`
$(cat ./$RESULTS_DIR/network_metrics.txt)
\`\`\`

## Detailed Reports
- Full Lighthouse report: lighthouse-report.html
EOF

# Cleanup
rm -f server.log

echo -e "${GREEN}✨ Performance measurement complete!${NC}"
echo -e "${BLUE}📊 Results available in ./$RESULTS_DIR${NC}" 