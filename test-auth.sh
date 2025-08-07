#!/bin/bash

echo "=== Prime SMS Authentication Test ==="
echo ""

# Test 1: Login and save cookies
echo "1. Testing login..."
LOGIN_RESPONSE=$(curl -s -c /tmp/test_cookie.txt -X POST https://primesms.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"primesms","password":"Primesms"}')

echo "Login response: $LOGIN_RESPONSE"
echo ""

# Test 2: Check if cookie was saved
echo "2. Checking saved cookies..."
if [ -f /tmp/test_cookie.txt ]; then
  echo "Cookie file contents:"
  cat /tmp/test_cookie.txt
  echo ""
else
  echo "No cookie file found!"
  exit 1
fi

# Test 3: Test auth/me with saved cookies
echo "3. Testing /api/auth/me with cookies..."
ME_RESPONSE=$(curl -s -b /tmp/test_cookie.txt https://primesms.app/api/auth/me)
echo "Auth/me response: $ME_RESPONSE"
echo ""

# Test 4: Test admin endpoint
echo "4. Testing admin endpoint..."
ADMIN_RESPONSE=$(curl -s -b /tmp/test_cookie.txt https://primesms.app/api/admin/stats)
echo "Admin response: $ADMIN_RESPONSE"
echo ""

# Cleanup
rm -f /tmp/test_cookie.txt

echo "=== Test Complete ==="