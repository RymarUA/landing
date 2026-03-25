# ACID Transactions Implementation

## Overview

Реализован ACID-подобный механизм транзакций через **Compensating Transactions** для обеспечения целостности данных при работе с внешними API.

## Архитектура

### 1. Transaction Manager (`lib/transaction-manager.ts`)

**Core Concept:**
```typescript
export interface TransactionStep {
  name: string;
  execute: () => Promise<any>;
  compensate?: (result: any) => Promise<void>; // Rollback action
  critical?: boolean; // Failure triggers full rollback
}
```

**Transaction Flow:**
1. **Execute** все шаги последовательно
2. **On Error** - выполнить компенсации в обратном порядке
3. **Critical Steps** - ошибка вызывает полный откат
4. **Non-Critical** - ошибка логируется, но транзакция продолжается

### 2. Compensating Actions Pattern

**Вместо ROLLBACK → Manual Compensation:**

```typescript
// Step 1: Create Order
{
  name: "create_sitniks_order",
  execute: () => createSitniksOrder(orderDto),
  compensate: (result) => updateSitniksOrder(result.orderNumber, "cancelled")
}

// Step 2: Create TTN  
{
  name: "create_ttn", 
  execute: () => createNovaPoshtaTTN(ttnData),
  compensate: (result) => console.log("TTN cleanup required") // Manual cleanup
}

// Step 3: Send Notification
{
  name: "send_notification",
  execute: () => sendTelegramNotification(msg),
  compensate: () => console.log("No compensation needed") // Notifications don't rollback
}
```

### 3. Transaction Types

#### **Create Order Transaction**
```typescript
const result = await createOrderTransaction(
  orderDto, customerName, customerPhone, amount, cardMask, npDelivery
);

if (result.success) {
  console.log("✅ All steps completed:", result.completedSteps);
} else {
  console.log("❌ Failed at:", result.failedStep);
  console.log("🔄 Compensations executed:", result.compensationsExecuted);
}
```

#### **Outbox Transaction**
```typescript
const result = await addOrderToOutboxTransaction(
  orderDto, customerName, customerPhone, amount, cardMask, npDelivery
);
```

## ACID Properties Implementation

### **A - Atomicity**
```typescript
// Все шаги выполняются как единая операция
// При ошибке → компенсации всех выполненных шагов
if (step.critical !== false) {
  // Execute compensations in reverse order
  for (const stepName of [...completedSteps].reverse()) {
    await step.compensate(stepResults[stepName]);
  }
}
```

### **C - Consistency**
```typescript
// Валидация перед каждым шагом
const validationError = validateCreateOrderDto(normalizedDto);
if (validationError) {
  throw new Error("Invalid data - transaction aborted");
}
```

### **I - Isolation**
```typescript
// Distributed locks предотвращают race conditions
const lockAcquired = await acquireOrderLock(orderReference);
if (!lockAcquired) {
  throw new Error("Order already being processed");
}
```

### **D - Durability**
```typescript
// Outbox обеспечивает персистентность
await addToOutbox({
  type: "create_order",
  data: { orderDto, customerName, ... }
});
```

## Error Handling & Recovery

### **Critical vs Non-Critical Steps**
```typescript
{
  name: "create_sitniks_order",
  critical: true,  // Failure → full rollback
}
{
  name: "create_ttn", 
  critical: false, // Failure → log only, continue
}
```

### **Compensation Strategies**
1. **Automatic Compensation** - Cancel Sitniks order
2. **Manual Compensation** - TTN cleanup required
3. **No Compensation** - Notifications sent

### **Dead Letter Queue**
```typescript
// После MAX_RETRY_ATTEMPTS → dead letter
await moveToDeadLetter(id, item, errorMessage);
```

## Flow Examples

### **Success Scenario:**
```
1. Create Sitniks Order ✅
2. Create TTN ✅  
3. Send Notification ✅
→ Transaction COMMITTED
```

### **Failure Scenario (TTN):**
```
1. Create Sitniks Order ✅
2. Create TTN ❌ (API error)
3. Compensation: Cancel Sitniks Order
→ Transaction ROLLED BACK
```

### **Failure Scenario (Notification):**
```
1. Create Sitniks Order ✅
2. Create TTN ✅
3. Send Notification ❌ (Telegram down)
→ Transaction COMMITTED (notification is non-critical)
```

## Integration with Outbox

**Outbox использует Transaction Manager:**
```typescript
// lib/transactional-outbox.ts
const result = await createOrderTransaction(
  orderDto, customerName, customerPhone, amount, cardMask, npDelivery
);

if (result.success) {
  await updateOutboxItem(id, { status: "completed" });
} else {
  // Retry logic with exponential backoff
  await updateOutboxItem(id, { 
    status: "pending", 
    attempts: newAttempts,
    error: result.error 
  });
}
```

## Monitoring & Observability

### **Transaction Logging**
```typescript
console.log(`[transaction] Starting transaction with ${steps.length} steps`);
console.log(`[transaction] ✅ Step completed: ${step.name}`);
console.log(`[transaction] ❌ Step failed: ${step.name}`);
console.log(`[transaction] 🔄 Compensating step: ${stepName}`);
```

### **Error Tracking**
```typescript
return {
  success: false,
  completedSteps,
  failedStep: step.name,
  error: error.message,
  compensationsExecuted,
};
```

## Benefits

### **1. Data Consistency**
- Никаких "частично созданных" заказов
- Все или ничего - атомарные операции

### **2. Error Recovery**
- Автоматическая компенсация при сбоях
- Retry логика для временных проблем

### **3. Observability**
- Полный лог каждого шага транзакции
- Детальная информация о компенсациях

### **4. Flexibility**
- Critical vs non-critical steps
- Настраиваемые стратегии компенсации

## Limitations

### **1. Not True ACID**
- Compensating transactions ≠ real ROLLBACK
- Manual cleanup может потребоваться

### **2. External Dependencies**
- Sitniks API не поддерживает транзакции
- Nova Poshta API отдельная система

### **3. Eventual Consistency**
- Компенсации могут занять время
- Возможны кратковременные несоответствия

## Production Considerations

### **1. Compensation Testing**
Регулярное тестирование механизма компенсации

### **2. Dead Letter Monitoring**
Мониторинг очереди мертвых писем

### **3. Manual Recovery Procedures**
Процедуры ручного восстановления при сбое компенсаций

### **4. Alerting**
Уведомления о сбоях транзакций

**Результат:** ACID-подобное поведение с compensating transactions pattern для обеспечения целостности данных в распределенной системе.
