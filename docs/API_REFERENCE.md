# 📡 API Reference

## Overview
Complete API documentation for Sitniks CRM Analytics Integration.

## Base URL
```
Production: https://yourstore.com
Development: http://localhost:3000
```

## Authentication
All admin endpoints require JWT authentication:
```http
Cookie: auth-token=your_jwt_token
```

---

## 📊 Customer Analytics API

### GET /api/customer-activity
Get customer activity data.

**Endpoint:** `GET /api/customer-activity?id={customerId}`

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | number | Yes | Customer ID |

**Response (200 OK):**
```json
{
  "wishlist": [21903869, 21910779],
  "lastViewed": [21910779],
  "viewCount": 1,
  "categories": ["Бандажі"],
  "priceRange": "0-10000",
  "notifications": [],
  "lastActivity": "2026-03-17T13:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Missing customer ID
- `404 Not Found`: Customer not found
- `500 Internal Server Error`: API error

---

### POST /api/analytics/track-view
Track product view event.

**Endpoint:** `POST /api/analytics/track-view`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "productId": 123,
  "productName": "Наколенник ортопедичний",
  "category": "Наколенники",
  "price": 890,
  "source": "click"
}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| productId | number | Yes | Product ID |
| productName | string | Yes | Product name |
| category | string | Yes | Product category |
| price | number | Yes | Product price |
| source | string | No | Source of view (click, view, etc.) |

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Tracking failed

---

## 🔐 Admin Authentication API

### GET /api/auth/check-admin
Check if user has admin privileges.

**Endpoint:** `GET /api/auth/check-admin`

**Headers:**
```
Cookie: auth-token=your_jwt_token
```

**Response (200 OK):**
```json
{
  "role": "admin",
  "email": "admin@yourstore.com",
  "userId": "4769814"
}
```

**Error Responses:**
- `401 Unauthorized`: No token or invalid token
- `403 Forbidden`: Not an admin user

---

## 📈 Admin Analytics API

### GET /api/admin/analytics
Get aggregated analytics data (admin only).

**Endpoint:** `GET /api/admin/analytics`

**Query Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| start | string | No | Start date (YYYY-MM-DD) |
| end | string | No | End date (YYYY-MM-DD) |

**Response (200 OK):**
```json
{
  "totalCustomers": 150,
  "activeCustomers": 89,
  "totalWishlistItems": 234,
  "totalViews": 1250,
  "topCategories": [
    {
      "name": "Бандажі",
      "count": 45
    },
    {
      "name": "Наколенники",
      "count": 32
    }
  ],
  "averagePriceRange": "0-10000",
  "recentActivity": [
    {
      "customer": "John Doe",
      "action": "Просмотрел 5 товаров, wishlist: 2",
      "timestamp": "17.03.2026, 14:30:00"
    }
  ],
  "period": {
    "start": "2026-03-01",
    "end": "2026-03-17"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin
- `500 Internal Server Error`: Data processing error

---

## 📤 Export API

### GET /api/admin/export
Export analytics data (admin only).

**Endpoint:** `GET /api/admin/export?format={csv|pdf}`

**Query Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| format | string | Yes | Export format: csv or pdf |

**Response (CSV):**
```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="customer-analytics-2026-03-17.csv"

Customer ID,Name,Email,Phone,Wishlist Items,View Count,Categories,Price Range,Last Activity
4769814,John Doe,john@example.com,+380501234567,2,5,"Бандажі,Наколенники","0-10000","2026-03-17 14:30:00"
```

**Response (PDF/HTML):**
```http
Content-Type: text/html
Content-Disposition: attachment; filename="customer-analytics-2026-03-17.html"

<!DOCTYPE html>
<html>
<head><title>Customer Analytics Report</title></head>
<body>
  <h1>Customer Analytics Report</h1>
  <table>
    <!-- Report content -->
  </table>
</body>
</html>
```

**Error Responses:**
- `400 Bad Request`: Invalid format
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin
- `500 Internal Server Error`: Export failed

---

## 📧 Notifications API

### POST /api/notifications/wishlist-alerts
Send wishlist price drop notification (admin only).

**Endpoint:** `POST /api/notifications/wishlist-alerts`

**Headers:**
```
Content-Type: application/json
Cookie: auth-token=your_jwt_token
```

**Body:**
```json
{
  "customerId": 4769814,
  "productId": 123,
  "productName": "Наколенник ортопедичний",
  "price": 890,
  "customerEmail": "customer@example.com"
}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| customerId | number | Yes | Customer ID |
| productId | number | Yes | Product ID |
| productName | string | Yes | Product name |
| price | number | Yes | Current price |
| customerEmail | string | Yes | Customer email |

**Response (200 OK):**
```json
{
  "success": true,
  "messageId": "msg_123456789"
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin
- `500 Internal Server Error`: Email sending failed

---

## 🔧 Health Check API

### GET /api/health
System health check.

**Endpoint:** `GET /api/health`

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-17T14:30:00.000Z",
  "services": {
    "sitniks": "connected",
    "database": "connected",
    "cache": "connected"
  }
}
```

---

## 📝 Error Response Format

All errors follow consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-03-17T14:30:00.000Z"
}
```

### Common Error Codes:
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `MISSING_FIELDS` | 400 | Required fields missing |
| `INVALID_TOKEN` | 401 | JWT token invalid |
| `UNAUTHORIZED` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `SITNIKS_ERROR` | 500 | Sitniks API error |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 🚀 Rate Limiting

Admin endpoints have rate limiting:
- **Analytics**: 100 requests/minute
- **Export**: 10 requests/minute
- **Notifications**: 20 requests/minute

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1647570000
```

---

## 📋 Examples

### JavaScript/TypeScript
```typescript
// Get customer activity
const response = await fetch('/api/customer-activity?id=4769814');
const activity = await response.json();

// Track product view
await fetch('/api/analytics/track-view', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 123,
    productName: 'Наколенник ортопедичний',
    category: 'Наколенники',
    price: 890,
    source: 'click'
  })
});

// Get admin analytics
const analytics = await fetch('/api/admin/analytics?start=2026-03-01&end=2026-03-17');
const data = await analytics.json();
```

### cURL
```bash
# Get customer activity
curl "https://yourstore.com/api/customer-activity?id=4769814"

# Track product view
curl -X POST https://yourstore.com/api/analytics/track-view \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 123,
    "productName": "Наколенник ортопедичний",
    "category": "Наколенники",
    "price": 890,
    "source": "click"
  }'

# Export CSV
curl -H "Cookie: auth-token=your_token" \
  "https://yourstore.com/api/admin/export?format=csv" \
  --output analytics.csv
```

### Python
```python
import requests

# Get customer activity
response = requests.get(
    'https://yourstore.com/api/customer-activity',
    params={'id': 4769814}
)
activity = response.json()

# Track product view
requests.post('https://yourstore.com/api/analytics/track-view', json={
    'productId': 123,
    'productName': 'Наколенник ортопедичний',
    'category': 'Наколенники',
    'price': 890,
    'source': 'click'
})
```

---

## 🔄 SDK/Client Libraries

### React Hook
```typescript
function useCustomerAnalytics(customerId: number) {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/customer-activity?id=${customerId}`)
      .then(res => res.json())
      .then(setActivity)
      .finally(() => setLoading(false));
  }, [customerId]);
  
  return { activity, loading };
}
```

### Node.js Client
```typescript
class SitniksAnalytics {
  constructor(private baseUrl: string, private token: string) {}
  
  async getCustomerActivity(customerId: number) {
    const response = await fetch(
      `${this.baseUrl}/api/customer-activity?id=${customerId}`,
      { headers: { 'Cookie': `auth-token=${this.token}` } }
    );
    return response.json();
  }
  
  async trackView(data: TrackViewData) {
    return fetch(`${this.baseUrl}/api/analytics/track-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}
```

---

*Last updated: 17.03.2026*
*Version: 1.0.0*
