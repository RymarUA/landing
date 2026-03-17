# 🔧 Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Authentication & Access

#### Problem: Admin dashboard shows "Unauthorized"
**Symptoms:** 
- Redirected to login page
- 403 errors in console
- AdminGuard component blocking access

**Solutions:**
```typescript
// 1. Check admin emails in app/api/auth/check-admin/route.ts
const adminEmails = ["your-admin@yourstore.com"];

// 2. Verify JWT token exists
console.log(document.cookie); // Look for auth-token

// 3. Test admin endpoint directly
curl -H "Cookie: auth-token=your_token" \
  https://yourstore.com/api/auth/check-admin
```

#### Problem: Customer analytics accessible to everyone
**Symptoms:**
- Non-admin users can see data
- No authentication prompt

**Solutions:**
```typescript
// Ensure AdminGuard wraps the component
export default function CustomerAnalyticsPage() {
  return (
    <AdminGuard>
      <CustomerAnalyticsContent />
    </AdminGuard>
  );
}
```

---

### Sitniks CRM Integration

#### Problem: "Sitniks API not configured" error
**Symptoms:**
- Console shows API configuration errors
- No data loading

**Solutions:**
```bash
# 1. Check environment variables
echo $SITNIKS_API_URL
echo $SITNIKS_API_KEY

# 2. Test API connection
curl -H "Authorization: Bearer YOUR_KEY" \
  https://crm.sitniks.com/open-api/clients/1

# 3. Verify API key format
# Should be: "Basic base64(email:password)" or Bearer token
```

#### Problem: Custom fields not saving
**Symptoms:**
- 400 Bad Request errors
- "custom_field_type_must_be_a_valid_enum"

**Solutions:**
```typescript
// Check custom fields structure in lib/sitniks-custom-fields.ts
const customFields = [{
  id: 1,
  type: "text", // Must be valid enum: text, number, boolean, datetime, select, multiselect
  code: "customer_activity",
  name: "Customer Activity",
  value: activityJson,
  isRequired: false,
  model: "clients", // Must be "clients" or "orders"
  ordering: 1
}];
```

#### Problem: Data not persisting in Sitniks
**Symptoms:**
- Data saves but disappears on refresh
- customFields always null

**Solutions:**
```typescript
// 1. Verify API response
console.log("[custom-fields] API response:", response);

// 2. Check if custom field exists in CRM
// Login to Sitniks CRM → Clients → Custom Fields

// 3. Ensure proper PUT request
const response = await sitniksRequest(`/open-api/clients/${customerId}`, {
  method: "PUT",
  body: JSON.stringify({
    fullname: currentClient.fullname,
    email: currentClient.email,
    phone: currentClient.phone,
    customFields: customFields, // Must be included
  }),
});
```

---

### Data & Analytics

#### Problem: No data showing in analytics
**Symptoms:**
- Empty arrays for wishlist/views
- "No data available" messages

**Solutions:**
```typescript
// 1. Check if customer has activity data
const activity = await getCustomerActivity(customerId);
console.log("[debug] Activity:", activity);

// 2. Verify custom fields are being read
if (!client.customFields || client.customFields.length === 0) {
  console.log("[debug] No custom fields found");
}

// 3. Check activity field exists
const activityField = client.customFields.find(field => field.code === "customer_activity");
if (!activityField) {
  console.log("[debug] Activity field not found");
}
```

#### Problem: Product view tracking not working
**Symptoms:**
- View count always 0
- No categories tracked

**Solutions:**
```typescript
// 1. Check if trackClick is called
const handleCardClick = () => {
  console.log("[debug] Tracking click:", product.id);
  trackClick({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
  });
};

// 2. Verify API endpoint works
curl -X POST http://localhost:3000/api/analytics/track-view \
  -H "Content-Type: application/json" \
  -d '{"productId":123,"productName":"Test","category":"Test","price":100}'

// 3. Check addProductView function
console.log("[debug] Adding product view:", productId, category, price);
```

---

### Performance Issues

#### Problem: Slow loading times
**Symptoms:**
- Dashboard takes > 5 seconds to load
- API timeouts

**Solutions:**
```typescript
// 1. Add caching to API responses
export async function getCustomerActivity(customerId: number) {
  const cacheKey = `customer-activity-${customerId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // ... fetch data
  await redis.setex(cacheKey, 300, JSON.stringify(activity)); // 5min cache
}

// 2. Optimize Sitniks requests
// Batch multiple customer requests
const customerIds = [1, 2, 3, 4, 5];
const promises = customerIds.map(id => getSitniksCustomer(id));
const customers = await Promise.all(promises);
```

#### Problem: Memory leaks
**Symptoms:**
- Memory usage increases over time
- Page becomes unresponsive

**Solutions:**
```typescript
// 1. Clean up useEffect hooks
useEffect(() => {
  const timer = setTimeout(() => {
    // ... cleanup
  }, 1000);
  
  return () => clearTimeout(timer); // Important!
}, []);

// 2. Remove event listeners
useEffect(() => {
  const handleScroll = () => {
    // ... handle scroll
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

### Email & Notifications

#### Problem: Email notifications not sending
**Symptoms:**
- No emails received
- 500 errors in notification API

**Solutions:**
```bash
# 1. Check Resend API key
echo $RESEND_API_KEY

# 2. Test Resend directly
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@yourstore.com",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'

# 3. Check email template validity
// Ensure HTML is properly escaped
```

---

### Export & Data Issues

#### Problem: CSV export malformed
**Symptoms:**
- CSV file corrupted
- Special characters broken

**Solutions:**
```typescript
// 1. Proper CSV escaping
const csvRows = customers.map((row: string[]) => 
  row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")
);

// 2. Set correct headers
return new NextResponse(csvContent, {
  headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="analytics.csv"`
  }
});
```

---

## 🔍 Debug Tools

### Console Logging
```typescript
// Enable debug mode
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log("[debug] Customer data:", customer);
  console.log("[debug] API response:", response);
}
```

### Network Monitoring
```bash
# Monitor API calls
curl -v https://yourstore.com/api/customer-activity?id=1

# Check response times
time curl https://yourstore.com/api/admin/analytics
```

### Database Checks
```sql
-- Check custom fields in Sitniks
SELECT * FROM custom_fields WHERE code = 'customer_activity';

-- Check customer activity
SELECT * FROM clients WHERE custom_fields IS NOT NULL;
```

---

## 📞 Getting Help

### Debug Information to Collect
```typescript
// When reporting issues, include:
1. Browser console errors
2. Network requests (status codes, response bodies)
3. Environment variables (sanitized)
4. Sitniks CRM configuration
5. Reproduction steps
6. Expected vs actual behavior
```

### Common Debug Commands
```bash
# Check system status
npm run build
npm run start

# Test individual components
curl http://localhost:3000/api/customer-activity?id=1
curl http://localhost:3000/api/admin/analytics

# Check logs
tail -f logs/production.log
```

---

## 🚀 Performance Optimization

### Database Optimization
```typescript
// 1. Implement caching
const cache = new Map();
const getCachedCustomer = async (id: number) => {
  if (cache.has(id)) return cache.get(id);
  const customer = await getSitniksCustomer(id);
  cache.set(id, customer);
  return customer;
};

// 2. Batch requests
const getBatchCustomers = async (ids: number[]) => {
  const promises = ids.map(id => getSitniksCustomer(id));
  return Promise.all(promises);
};
```

### Frontend Optimization
```typescript
// 1. Use React.memo for expensive components
const CustomerCard = React.memo(({ customer }: { customer: CustomerData }) => {
  return <div>{customer.name}</div>;
});

// 2. Implement virtual scrolling
import { FixedSizeList as List } from 'react-window';

// 3. Debounce search
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    setSearchQuery(query);
  }, 300),
  []
);
```

---

*Last updated: 17.03.2026*
*Version: 1.0.0*
