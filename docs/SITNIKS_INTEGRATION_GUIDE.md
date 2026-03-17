# 🔗 Інтеграція з Sitniks CRM

## 📋 Огляд

Повна інтеграція FamilyHub Market з Sitniks CRM для синхронізації клієнтів, замовлень та товарів в реальному часі.

## 🎯 Мета інтеграції

- ✅ **Синхронізація клієнтів** - автоматичне створення/оновлення в Sitniks
- ✅ **Замовлення** - передача замовлень в CRM для обробки
- ✅ **ТТН відстеження** - автоматичне оновлення статусів
- ✅ **Аналітика** - звіти та статистика з Sitniks
- ✅ **Реферальна програма** - відстеження запрошень через comment

## 🔧 Технічна реалізація

### Environment Variables
```env
# Sitniks CRM API
SITNIKS_API_URL=https://crm.sitniks.com
SITNIKS_API_KEY=your_bearer_token
SITNIKS_WEBHOOK_SECRET=webhook_secret

# Інтеграція Нової Пошти
SITNIKS_NP_INTEGRATION_ID=9
SITNIKS_SALES_CHANNEL_ID=9499
SITNIKS_NEW_STATUS_ID=24031
```

### API Endpoints
```
/open-api/clients              - Клієнти
/open-api/orders               - Замовлення
/api/v1/orders                 - Замовлення (старий API)
/api/v1/products               - Товари
/api/v1/customers              - Клієнти (старий API)
```

## 👥 Управління клієнтами

### Створення клієнта
```typescript
// lib/sitniks-customers.ts
export async function createSitniksCustomer(data: CreateCustomerDto): Promise<SitniksCustomer | null> {
  const customer = await sitniksRequest<SitniksCustomer>("/open-api/clients", {
    method: "POST",
    body: JSON.stringify({
      fullname: data.fullname || 'Клієнт',
      email: data.email,
      phone: data.phone || '+380000000000',
    }),
  });
  return customer;
}
```

### Пошук клієнта
```typescript
export async function searchSitniksCustomer(email?: string, phone?: string): Promise<SitniksCustomer | null> {
  let endpoint = "/open-api/clients";
  const params = new URLSearchParams();
  
  if (email) params.append("email", email);
  if (phone) params.append("phone", phone);
  params.append("limit", "10");
  
  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }
  
  const response = await sitniksRequest<any>(endpoint);
  if (response.clients && response.clients.length > 0) {
    return response.clients[0];
  }
  return null;
}
```

### Оновлення клієнта
```typescript
export async function updateSitniksCustomer(id: number, data: UpdateCustomerDto): Promise<SitniksCustomer | null> {
  const customer = await sitniksRequest<SitniksCustomer>(`/open-api/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return customer;
}
```

## 📦 Управління замовленнями

### Створення замовлення
```typescript
export async function createSitniksOrder(orderData: OrderData): Promise<SitniksOrder | null> {
  const order = await sitniksRequest<SitniksOrder>("/open-api/orders", {
    method: "POST",
    body: JSON.stringify({
      clientId: orderData.clientId,
      products: orderData.products,
      totalAmount: orderData.totalAmount,
      deliveryMethod: orderData.deliveryMethod,
      paymentMethod: orderData.paymentMethod,
      salesChannelId: process.env.SITNIKS_SALES_CHANNEL_ID,
    }),
  });
  return order;
}
```

### Оновлення статусу замовлення
```typescript
export async function updateOrderStatus(orderId: number, status: string): Promise<SitniksOrder | null> {
  const order = await sitniksRequest<SitniksOrder>(`/open-api/orders/${orderId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  return order;
}
```

## 🚚 Інтеграція з Новою Поштою

### Автоматичне створення ТТН
```typescript
export async function createNovaPoshtaShipment(orderData: ShipmentData): Promise<string> {
  const shipment = await sitniksRequest<any>("/open-api/nova-poshta/shipments", {
    method: "POST",
    body: JSON.stringify({
      orderId: orderData.orderId,
      integrationId: process.env.SITNIKS_NP_INTEGRATION_ID,
      recipient: {
        name: orderData.recipientName,
        phone: orderData.recipientPhone,
        city: orderData.city,
        address: orderData.address,
      },
      cargo: orderData.cargo,
    }),
  });
  return shipment.ttn;
}
```

## 🎯 Реферальна програма

### Генерація реферального коду
```typescript
export function generateReferralCode(customerId: number): string {
  const timestamp = Date.now().toString(36);
  const hash = Buffer.from(customerId.toString()).toString('base64').slice(0, 6).toUpperCase();
  return `REF_${hash}_${timestamp}`;
}
```

### Збереження реферального коду
```typescript
// Зберігаємо в comment клієнта
await updateSitniksCustomer(customerId, {
  comment: `Referral code: ${referralCode}`
});
```

### Пошук реферера
```typescript
export async function findCustomerByReferralCode(referralCode: string): Promise<SitniksCustomer | null> {
  const response = await sitniksRequest<any>(`/open-api/clients?limit=100`);
  
  if (response.clients && response.clients.length > 0) {
    const customer = response.clients.find((client: any) => 
      client.comment?.includes(referralCode) ||
      client.customFields?.some((field: any) => field.value === referralCode)
    );
    return customer || null;
  }
  return null;
}
```

## 🔄 Webhooks

### Обробка вебхуків від Sitniks
```typescript
// app/api/sitniks-webhook/route.ts
export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-sitniks-signature');
  const secret = process.env.SITNIKS_WEBHOOK_SECRET;
  
  // Перевірка підпису
  if (!verifyWebhookSignature(await req.text(), signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  
  const event = await req.json();
  
  switch (event.type) {
    case 'order.updated':
      await handleOrderUpdated(event.data);
      break;
    case 'customer.created':
      await handleCustomerCreated(event.data);
      break;
    case 'payment.completed':
      await handlePaymentCompleted(event.data);
      break;
  }
  
  return NextResponse.json({ success: true });
}
```

## 📊 Аналітика та звіти

### Отримання статистики
```typescript
export async function getOrderStats(period: 'day' | 'week' | 'month'): Promise<OrderStats> {
  const stats = await sitniksRequest<OrderStats>(`/api/v1/stats/orders?period=${period}`);
  return stats;
}

export async function getCustomerStats(): Promise<CustomerStats> {
  const stats = await sitniksRequest<CustomerStats>('/api/v1/stats/customers');
  return stats;
}
```

### Експорт звітів
```typescript
export async function exportOrdersReport(filters: ReportFilters): Promise<Blob> {
  const response = await fetch(`${process.env.SITNIKS_API_URL}/api/v1/reports/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SITNIKS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters),
  });
  
  return response.blob();
}
```

## 🛡️ Обробка помилок

### Retry логіка
```typescript
export async function sitniksRequestWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await sitniksRequest<T>(endpoint, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### Логування помилок
```typescript
export async function logSitniksError(error: Error, context: any) {
  console.error('[Sitniks API Error]', {
    message: error.message,
    context,
    timestamp: new Date().toISOString(),
  });
  
  // Відправка в систему моніторингу
  await sendToMonitoring({
    service: 'sitniks-integration',
    error: error.message,
    context,
  });
}
```

## 🧪 Тестування інтеграції

### Unit тести
```typescript
// __tests__/sitniks-customers.test.ts
describe('Sitniks Customers', () => {
  test('should create customer', async () => {
    const customer = await createSitniksCustomer({
      fullname: 'Test User',
      email: 'test@example.com',
      phone: '+380501234567',
    });
    
    expect(customer).toBeDefined();
    expect(customer.email).toBe('test@example.com');
  });
  
  test('should find customer by email', async () => {
    const customer = await searchSitniksCustomer('test@example.com');
    expect(customer).toBeDefined();
  });
});
```

### Інтеграційні тести
```typescript
// __tests__/integration/sitniks.test.ts
describe('Sitniks Integration', () => {
  test('full order flow', async () => {
    // 1. Створення клієнта
    const customer = await createSitniksCustomer(mockCustomer);
    
    // 2. Створення замовлення
    const order = await createSitniksOrder({
      clientId: customer.id,
      ...mockOrderData,
    });
    
    // 3. Оновлення статусу
    const updatedOrder = await updateOrderStatus(order.id, 'processing');
    
    expect(updatedOrder.status).toBe('processing');
  });
});
```

## 📈 Моніторинг

### Метрики
```typescript
// Відстеження API викликів
export const sitniksMetrics = {
  requests: 0,
  errors: 0,
  responseTime: [],
  
  track(duration: number, success: boolean) {
    this.requests++;
    this.responseTime.push(duration);
    if (!success) this.errors++;
  },
  
  getAverageResponseTime() {
    return this.responseTime.reduce((a, b) => a + b, 0) / this.responseTime.length;
  },
};
```

### Health check
```typescript
export async function checkSitniksHealth(): Promise<boolean> {
  try {
    await sitniksRequest('/api/v1/health');
    return true;
  } catch (error) {
    console.error('[Sitniks] Health check failed:', error);
    return false;
  }
}
```

## 🔄 Cron jobs

### Синхронізація даних
```typescript
// scripts/sync-sitniks.ts
export async function syncCustomers() {
  const lastSync = getLastSyncTimestamp();
  const customers = await getCustomersUpdatedSince(lastSync);
  
  for (const customer of customers) {
    await updateLocalCustomer(customer);
  }
  
  updateLastSyncTimestamp();
}

export async function syncOrders() {
  const lastSync = getLastSyncTimestamp();
  const orders = await getOrdersUpdatedSince(lastSync);
  
  for (const order of orders) {
    await updateLocalOrder(order);
  }
  
  updateLastSyncTimestamp();
}
```

## ✅ Перевірки

- [x] Базова інтеграція з клієнтами
- [x] Створення замовлень
- [x] Реферальна програма
- [x] Обробка помилок
- [x] Логування
- [ ] Real-time синхронізація
- [ ] Автоматична синхронізація товарів
- [ ] Повна аналітика

## 🎉 Результат

Повна інтеграція з Sitniks CRM дозволяє автоматизувати всі бізнес-процеси та мати єдину систему управління клієнтами та замовленнями.
