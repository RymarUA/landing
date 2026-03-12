# scripts/test-checkout-integration.ps1
#
# Integration tests for /api/checkout endpoint (PowerShell version for Windows)
# Tests order creation with different payment methods and validates responses

param(
    [string]$ApiUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

# Configuration
$Endpoint = "$ApiUrl/api/checkout"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Checkout API Integration Tests" -ForegroundColor Cyan
Write-Host "  Testing endpoint: $Endpoint" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Test counter
$TestsRun = 0
$TestsPassed = 0
$TestsFailed = 0

# Helper function to run test
function Run-Test {
    param(
        [string]$TestName,
        [string]$Payload,
        [int]$ExpectedStatus,
        [bool]$ShouldHavePaymentUrl
    )
    
    $script:TestsRun++
    
    Write-Host "Test ${script:TestsRun}: $TestName" -ForegroundColor Yellow
    
    try {
        # Make request
        $response = Invoke-WebRequest -Uri $Endpoint -Method POST `
            -ContentType "application/json" `
            -Body $Payload `
            -UseBasicParsing `
            -ErrorAction SilentlyContinue
        
        $statusCode = $response.StatusCode
        $body = $response.Content | ConvertFrom-Json
    }
    catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $body = $responseBody | ConvertFrom-Json
        }
        else {
            Write-Host "  ✗ Request failed: $($_.Exception.Message)" -ForegroundColor Red
            $script:TestsFailed++
            Write-Host ""
            return
        }
    }
    
    # Check status code
    if ($statusCode -eq $ExpectedStatus) {
        Write-Host "  ✓ Status code: $statusCode" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ Expected status $ExpectedStatus, got $statusCode" -ForegroundColor Red
        Write-Host "  Response: $($body | ConvertTo-Json -Compress)" -ForegroundColor Red
        $script:TestsFailed++
        Write-Host ""
        return
    }
    
    # Check response for success
    if ($ExpectedStatus -eq 200) {
        if ($body.success -eq $true) {
            Write-Host "  ✓ Success: true" -ForegroundColor Green
            
            # Check for orderId
            if ($body.orderId) {
                Write-Host "  ✓ Order ID: $($body.orderId)" -ForegroundColor Green
            }
            else {
                Write-Host "  ✗ Missing orderId" -ForegroundColor Red
                $script:TestsFailed++
                Write-Host ""
                return
            }
            
            # Check for orderNumber
            if ($body.orderNumber) {
                Write-Host "  ✓ Order Number: $($body.orderNumber)" -ForegroundColor Green
            }
            else {
                Write-Host "  ✗ Missing orderNumber" -ForegroundColor Red
                $script:TestsFailed++
                Write-Host ""
                return
            }
            
            # Check for paymentUrl if expected
            if ($ShouldHavePaymentUrl) {
                if ($body.paymentUrl) {
                    $urlPreview = $body.paymentUrl.Substring(0, [Math]::Min(50, $body.paymentUrl.Length))
                    Write-Host "  ✓ Payment URL: $urlPreview..." -ForegroundColor Green
                }
                else {
                    Write-Host "  ⚠ Missing paymentUrl (may be expected if WayForPay not configured)" -ForegroundColor Yellow
                }
            }
            
            $script:TestsPassed++
        }
        else {
            Write-Host "  ✗ Success is not true" -ForegroundColor Red
            $script:TestsFailed++
            Write-Host ""
            return
        }
    }
    else {
        # Error response
        if ($body.error) {
            Write-Host "  ✓ Error message: $($body.error)" -ForegroundColor Green
            $script:TestsPassed++
        }
        else {
            Write-Host "  ✗ Missing error message" -ForegroundColor Red
            $script:TestsFailed++
        }
    }
    
    Write-Host ""
}

# Test 1: Valid COD order
Run-Test -TestName "Valid COD (Cash on Delivery) order" -ExpectedStatus 200 -ShouldHavePaymentUrl $false -Payload @'
{
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
}
'@

# Test 2: Valid card payment order
Run-Test -TestName "Valid card payment order" -ExpectedStatus 200 -ShouldHavePaymentUrl $true -Payload @'
{
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
}
'@

# Test 3: Valid online payment order
Run-Test -TestName "Valid online payment order" -ExpectedStatus 200 -ShouldHavePaymentUrl $true -Payload @'
{
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
}
'@

# Test 4: Order with discount
Run-Test -TestName "Order with discount amount" -ExpectedStatus 200 -ShouldHavePaymentUrl $false -Payload @'
{
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
}
'@

# Test 5: Multiple items order
Run-Test -TestName "Order with multiple items" -ExpectedStatus 200 -ShouldHavePaymentUrl $false -Payload @'
{
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
}
'@

# Test 6: Missing required field (name)
Run-Test -TestName "Invalid: Missing name" -ExpectedStatus 400 -ShouldHavePaymentUrl $false -Payload @'
{
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
}
'@

# Test 7: Missing required field (phone)
Run-Test -TestName "Invalid: Missing phone" -ExpectedStatus 400 -ShouldHavePaymentUrl $false -Payload @'
{
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
}
'@

# Test 8: Empty items array
Run-Test -TestName "Invalid: Empty items array" -ExpectedStatus 400 -ShouldHavePaymentUrl $false -Payload @'
{
  "name": "Тест Користувач",
  "phone": "0671234567",
  "city": "Київ",
  "department": "Відділення №1",
  "paymentMethod": "cod",
  "items": []
}
'@

# Test 9: Short name (less than 3 chars)
Run-Test -TestName "Invalid: Name too short" -ExpectedStatus 400 -ShouldHavePaymentUrl $false -Payload @'
{
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
}
'@

# Test 10: Short phone (less than 10 chars)
Run-Test -TestName "Invalid: Phone too short" -ExpectedStatus 400 -ShouldHavePaymentUrl $false -Payload @'
{
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
}
'@

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Test Results" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Total tests run:    $TestsRun"
Write-Host "  Tests passed:       $TestsPassed" -ForegroundColor Green
if ($TestsFailed -gt 0) {
    Write-Host "  Tests failed:       $TestsFailed" -ForegroundColor Red
}
else {
    Write-Host "  Tests failed:       $TestsFailed"
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($TestsFailed -gt 0) {
    exit 1
}
else {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
}
