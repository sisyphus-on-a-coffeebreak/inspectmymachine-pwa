#!/bin/bash

# Test script for new endpoints (Report Branding & Component Custody Events)
# Uses cookie-based authentication

BASE_URL="http://localhost:8000"
COOKIE_FILE="test_cookies.txt"

echo "🧪 Testing New Endpoints"
echo "========================"
echo ""

# Step 1: Login
echo "1️⃣ Logging in as ADMIN001..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"employee_id":"ADMIN001","password":"password"}' \
  -c "$COOKIE_FILE" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Login successful"
  echo ""
else
  echo "❌ Login failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
  echo ""
  exit 1
fi

# Step 2: Test Report Branding GET
echo "2️⃣ Testing GET /api/v1/settings/report-branding..."
BRANDING_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/settings/report-branding" \
  -b "$COOKIE_FILE" \
  -H "Accept: application/json" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$BRANDING_RESPONSE" | tail -n1)
BODY=$(echo "$BRANDING_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Report branding GET endpoint working"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Report branding GET failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
echo ""

# Step 3: Test Component Custody Events
echo "3️⃣ Testing GET /api/v1/components/custody-events..."
CUSTODY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/components/custody-events?page=1&per_page=10" \
  -b "$COOKIE_FILE" \
  -H "Accept: application/json" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$CUSTODY_RESPONSE" | tail -n1)
BODY=$(echo "$CUSTODY_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Component custody events endpoint working"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Component custody events failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
echo ""

# Cleanup
rm -f "$COOKIE_FILE"

echo "✅ Endpoint testing complete!"








