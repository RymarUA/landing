#!/bin/bash
# scripts/test-checkout-integration.sh
#
# Integration tests for /api/checkout endpoint
# Tests order creation with different payment methods and validates responses

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
ENDPOINT="${API_URL}/api/checkout"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Checkout API Integration Tests"
echo "  Testing endpoint: ${ENDPOINT}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run test
run_test() {
  local test_name="$1"
  local payload="$2"
  local expected_status="$3"
  local should_have_payment_url="$4"
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  echo -e "${YELLOW}Test ${TESTS_RUN}: ${test_name}${NC}"
  
  # Make request
  response=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d "${payload}")
  
  # Extract status code and body
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  # Check status code
  if [ "$http_code" -eq "$expected_status" ]; then
    echo -e "  ✓ Status code: ${http_code}"
  else
    echo -e "  ${RED}✗ Expected status ${expected_status}, got ${http_code}${NC}"
    echo -e "  Response: ${body}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo ""
    return 1
  fi
  
  # Parse JSON response
  if command -v jq &> /dev/null; then
    echo "$body" | jq '.' 2>/dev/null || echo "  Response: ${body}"
    
    # Check for success field
    if [ "$expected_status" -eq 200 ]; then
      success=$(echo "$body" | jq -r '.success // false')
      if [ "$success" = "true" ]; then
        echo -e "  ✓ Success: true"
        
        # Check for orderId
        order_id=$(echo "$body" | jq -r '.orderId // null')
        if [ "$order_id" != "null" ]; then
          echo -e "  ✓ Order ID: ${order_id}"
        else
          echo -e "  ${RED}✗ Missing orderId${NC}"
          TESTS_FAILED=$((TESTS_FAILED + 1))
          echo ""
          return 1
        fi
        
        # Check for orderNumber
        order_number=$(echo "$body" | jq -r '.orderNumber // null')
        if [ "$order_number" != "null" ]; then
          echo -e "  ✓ Order Number: ${order_number}"
        else
          echo -e "  ${RED}✗ Missing orderNumber${NC}"
          TESTS_FAILED=$((TESTS_FAILED + 1))
          echo ""
          return 1
        fi
        
        # Check for paymentUrl if expected
        if [ "$should_have_payment_url" = "true" ]; then
          payment_url=$(echo "$body" | jq -r '.paymentUrl // null')
          if [ "$payment_url" != "null" ] && [ "$payment_url" != "" ]; then
            echo -e "  ✓ Payment URL: ${payment_url:0:50}..."
          else
            echo -e "  ${YELLOW}⚠ Missing paymentUrl (may be expected if WayForPay not configured)${NC}"
          fi
        fi
        
        TESTS_PASSED=$((TESTS_PASSED + 1))
      else
        echo -e "  ${RED}✗ Success is not true${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo ""
        return 1
      fi
    else
      # Error response
      error=$(echo "$body" | jq -r '.error // "Unknown error"')
      echo -e "  ✓ Error message: ${error}"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    fi
  else
    echo "  Response: ${body}"
    echo "  (Install jq for better JSON parsing)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  fi
  
  echo ""
  return 0
}

# Test 1: Valid COD order
run_test "Valid COD (Cash on Delivery) order" '{
  "name": "Тест Користувач",
  "phone": "0671234567",
  "city": "Київ",
  "department": "Відділення №1",
  "paymentMethod": "cod",
  "items": [
    {
      "id": 1001,
      "name": "Тестовий товар",
      "price": 500,
      "quantity": 1
    }
  ]
}' 200 false

# Test 2: Valid card payment order
run_test "Valid card payment order" '{
  "name": "Іван Петренко",
  "phone": "0501234567",
  "city": "Львів",
  "department": "Відділення №5",
  "paymentMethod": "card",
  "comment": "Доставити після 18:00",
  "items": [
    {
      "id": 1001,
      "name": "Товар 1",
      "price": 1000,
      "quantity": 2
    }
  ]
}' 200 true

# Test 3: Valid online payment order
run_test "Valid online payment order" '{
  "name": "Марія Коваленко",
  "phone": "0931234567",
  "city": "Одеса",
  "warehouse": "Поштомат №123",
  "paymentMethod": "online",
  "items": [
    {
      "id": 1001,
      "name": "Товар А",
      "price": 750,
      "quantity": 1
    },
    {
      "id": 1002,
      "name": "Товар Б",
      "price": 250,
      "quantity": 1
    }
  ]
}' 200 true

# Test 4: Order with discount
run_test "Order with discount amount" '{
  "name": "Олександр Шевченко",
  "phone": "0671234567",
  "city": "Харків",
  "department": "Відділення №10",
  "paymentMethod": "cod",
  "discountAmount": 100,
  "items": [
    {
      "id": 1001,
      "name": "Товар зі знижкою",
      "price": 1000,
      "quantity": 1
    }
  ]
}' 200 false

# Test 5: Multiple items order
run_test "Order with multiple items" '{
  "name": "Наталія Бондаренко",
  "phone": "0501234567",
  "city": "Дніпро",
  "department": "Відділення №3",
  "paymentMethod": "cod",
  "items": [
    {
      "id": 1001,
      "name": "Товар 1",
      "price": 500,
      "quantity": 2
    },
    {
      "id": 1002,
      "name": "Товар 2",
      "price": 300,
      "quantity": 1
    },
    {
      "id": 1003,
      "name": "Товар 3",
      "price": 200,
      "quantity": 3
    }
  ]
}' 200 false

# Test 6: Missing required field (name)
run_test "Invalid: Missing name" '{
  "phone": "0671234567",
  "city": "Київ",
  "department": "Відділення №1",
  "paymentMethod": "cod",
  "items": [
    {
      "id": 1001,
      "name": "Товар",
      "quantity": 1
    }
  ]
}' 400 false

# Test 7: Missing required field (phone)
run_test "Invalid: Missing phone" '{
  "name": "Тест Користувач",
  "city": "Київ",
  "department": "Відділення №1",
  "paymentMethod": "cod",
  "items": [
    {
      "id": 1001,
      "name": "Товар",
      "quantity": 1
    }
  ]
}' 400 false

# Test 8: Empty items array
run_test "Invalid: Empty items array" '{
  "name": "Тест Користувач",
  "phone": "0671234567",
  "city": "Київ",
  "department": "Відділення №1",
  "paymentMethod": "cod",
  "items": []
}' 400 false

# Test 9: Short name (less than 3 chars)
run_test "Invalid: Name too short" '{
  "name": "AB",
  "phone": "0671234567",
  "city": "Київ",
  "department": "Відділення №1",
  "paymentMethod": "cod",
  "items": [
    {
      "id": 1001,
      "name": "Товар",
      "quantity": 1
    }
  ]
}' 400 false

# Test 10: Short phone (less than 10 chars)
run_test "Invalid: Phone too short" '{
  "name": "Тест Користувач",
  "phone": "067123",
  "city": "Київ",
  "department": "Відділення №1",
  "paymentMethod": "cod",
  "items": [
    {
      "id": 1001,
      "name": "Товар",
      "quantity": 1
    }
  ]
}' 400 false

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  Total tests run:    ${TESTS_RUN}"
echo -e "  ${GREEN}Tests passed:       ${TESTS_PASSED}${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "  ${RED}Tests failed:       ${TESTS_FAILED}${NC}"
else
  echo -e "  Tests failed:       ${TESTS_FAILED}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $TESTS_FAILED -gt 0 ]; then
  exit 1
else
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
fi
