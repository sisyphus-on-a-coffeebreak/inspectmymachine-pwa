#!/bin/bash

# VOMS PWA - Full Audit Script
# 
# Runs all audit phases and generates comprehensive reports

set -e

echo "🔍 VOMS PWA - Full Audit Suite"
echo "================================"
echo ""

# Ensure audit directory exists
mkdir -p audit

# Check if dev server is needed
if [ -z "$TEST_BASE_URL" ]; then
  echo "📦 Starting development server..."
  npm run dev &
  DEV_PID=$!
  
  # Wait for server to start
  echo "⏳ Waiting for dev server..."
  sleep 10
  
  # Verify server is running
  if ! curl -s http://localhost:5173 > /dev/null; then
    echo "⚠️  Dev server failed to start, continuing anyway..."
  else
    echo "✅ Dev server running on http://localhost:5173"
  fi
fi

echo ""
echo "🧪 Running Playwright Tests..."
echo "================================"

# Run tests with detailed output
npx playwright test --reporter=list,json 2>&1 | tee audit/test-output.log || true

echo ""
echo "📊 Generating Failure Matrix..."
echo "================================"

# Generate failure matrix
npx ts-node e2e/generate-failure-matrix.ts 2>&1 || echo "⚠️  Matrix generation had issues"

echo ""
echo "📋 Audit Complete!"
echo "==================="
echo ""
echo "Generated reports:"
echo "  - audit/routes.audit.json"
echo "  - audit/features.audit.json"
echo "  - audit/runtime-safety.audit.json"
echo "  - audit/test-results.json"
echo "  - audit/js-error-audit.json"
echo "  - audit/failure-matrix.json"
echo "  - audit/playwright-report/index.html"
echo ""

# Cleanup dev server if we started it
if [ ! -z "$DEV_PID" ]; then
  echo "🛑 Stopping dev server..."
  kill $DEV_PID 2>/dev/null || true
fi

echo "✅ Done!"









