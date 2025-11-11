#!/bin/bash

# Test script for Phase 1 endpoints
# Requires authentication

BASE_URL="http://localhost:8000"
COOKIE_FILE="test_cookies.txt"

echo "🧪 Testing Phase 1 Endpoints"
echo "=============================="
echo ""

# Step 1: Login
echo "1️⃣ Logging in..."
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
  echo "⚠️  Make sure you have a user with employee_id='ADMIN001' and password='password'"
  exit 1
fi

# Step 2: Test Expense Approval Stats
echo "2️⃣ Testing Expense Approval Stats..."
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/expense-approval/stats" \
  -b "$COOKIE_FILE" \
  -H "Accept: application/json" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$STATS_RESPONSE" | tail -n1)
BODY=$(echo "$STATS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Expense stats endpoint working"
  echo "Response: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Expense stats failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
echo ""

# Step 3: Test Expense Approval Pending
echo "3️⃣ Testing Expense Approval Pending..."
PENDING_RESPONSE=$(curl -s -X GET "$BASE_URL/api/expense-approval/pending?status=all" \
  -b "$COOKIE_FILE" \
  -H "Accept: application/json" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$PENDING_RESPONSE" | tail -n1)
BODY=$(echo "$PENDING_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Expense pending endpoint working"
  echo "Response: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Expense pending failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
echo ""

# Step 4: Test Gate Pass Approval Pending
echo "4️⃣ Testing Gate Pass Approval Pending..."
GATE_PENDING_RESPONSE=$(curl -s -X GET "$BASE_URL/api/gate-pass-approval/pending?status=all" \
  -b "$COOKIE_FILE" \
  -H "Accept: application/json" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$GATE_PENDING_RESPONSE" | tail -n1)
BODY=$(echo "$GATE_PENDING_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Gate pass pending endpoint working"
  echo "Response: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Gate pass pending failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
echo ""

# Step 5: Test Create Visitor Pass
echo "5️⃣ Testing Create Visitor Pass..."
VISITOR_PASS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/visitor-gate-passes" \
  -b "$COOKIE_FILE" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "visitor_name": "Test Visitor",
    "visitor_phone": "1234567890",
    "visitor_company": "Test Company",
    "purpose": "inspection",
    "valid_from": "2025-11-10 00:00:00",
    "valid_to": "2025-11-10 23:59:59",
    "notes": "Test pass for Phase 1"
  }' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$VISITOR_PASS_RESPONSE" | tail -n1)
BODY=$(echo "$VISITOR_PASS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Visitor pass creation working"
  echo "Response: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
  
  # Check if QR code is in response
  if echo "$BODY" | grep -q "qr_payload"; then
    echo "✅ QR code payload included in response"
  else
    echo "⚠️  QR code payload not found in response"
  fi
else
  echo "❌ Visitor pass creation failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
echo ""

# Step 6: Test Inspection Dashboard
echo "6️⃣ Testing Inspection Dashboard..."
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/inspection-dashboard" \
  -b "$COOKIE_FILE" \
  -H "Accept: application/json" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$DASHBOARD_RESPONSE" | tail -n1)
BODY=$(echo "$DASHBOARD_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Inspection dashboard endpoint working"
  echo "Response: $BODY" | jq '.stats' 2>/dev/null || echo "$BODY"
else
  echo "❌ Inspection dashboard failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
echo ""

# Cleanup
rm -f "$COOKIE_FILE"

echo "=============================="
echo "✅ Testing complete!"
echo ""
echo "Next steps:"
echo "1. Test from frontend (npm run dev)"
echo "2. Test approval workflows manually"
echo "3. Verify QR codes work correctly"

