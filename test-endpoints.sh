#!/bin/bash

# Test Report Branding Endpoints
echo "=== Testing Report Branding Endpoints ==="
echo ""

# Get branding (should return defaults if none set)
echo "1. GET /api/v1/settings/report-branding"
curl -s -X GET "http://localhost:8000/api/v1/settings/report-branding" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.' || echo "Note: Requires authentication token"
echo ""

# Test Component Custody Events
echo "2. GET /api/v1/components/custody-events"
curl -s -X GET "http://localhost:8000/api/v1/components/custody-events?page=1&per_page=10" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.' || echo "Note: Requires authentication token"
echo ""

echo "=== Endpoint Tests Complete ==="
echo "Note: Full testing requires valid authentication tokens"
