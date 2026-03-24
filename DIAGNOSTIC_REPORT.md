# 🔍 Диагностический отчёт: Почему не создаётся заказ в Sitniks после оплаты WayForPay и не формируется ТТН

## Дата анализа: 2026-03-24

---

## 📋 Общий flow оплаты (как должно работать)

```
1. Пользователь оформляет заказ → POST /api/checkout
2. Для online-оплаты:
   a. Создаётся pending order (файл в data/pending-orders/{orderRef}.json)
   b. Формируются параметры для WayForPay формы
   c. Клиент перенаправляется на WayForPay для оплаты
3. После оплаты WayForPay вызывает:
   a. serviceUrl (webhook): POST /api/webhooks/wayforpay  ← серверный callback
   b. returnUrl: POST /api/payment/return → redirect → /checkout/success  ← клиентский redirect
4. Страница /checkout/success вызывает POST /api/payment/verify (fallback)
5. Webhook или verify создают заказ в Sitniks + формируют ТТН
```

---

## 🔴 НАЙДЕННЫЕ ПРОБЛЕМЫ

### ПРОБЛЕМА #1 (КРИТИЧЕСКАЯ): Pending order удаляется ДО того, как webhook/verify его обработают

**Файл:** `app/api/webhooks/wayforpay/route.ts` и `app/api/payment/verify/route.ts`

**Что видно в логах:**
```
11:20:51 [pending-store] Saving orderRef=op_763ea10f-... 
11:20:51 [pending-store] Saved pending order: op_763ea10f-...
11:21:37 [pending-store] Reading orderRef=op_763ea10f-...
11:21:37 [pending-store] Read pending order: op_763ea10f-...
11:21:37 [pending-store] Deleting orderRef=op_763ea10f-...
11:21:37 [pending-store] Deleted pending order: op_763ea10f-...
```

**Проблема:** Pending order **читается и удаляется** в 11:21:37 (через ~46 секунд после создания). Но в логах **нет записей** о:
- `[wfp-webhook]` — webhook не сработал
- `[payment-verify]` — verify не создал заказ
- `[sitniks]` — заказ в CRM не создавался

**Кто удаляет?** Судя по логам, это `payment/verify` endpoint, вызванный со страницы `/checkout/success`. Но **между чтением и удалением НЕТ лога о создании заказа в Sitniks**!

**Вероятная причина:** Verify вызывает `checkWayForPayStatus()`, получает статус (возможно НЕ "Approved" — платёж ещё в обработке, InProcessing), и далее в коде:

```typescript
// Строки 9608-9613 в payment/verify/route.ts:
const pending = await getPendingOrder(orderReference);
if (pending && (statusInfo.transactionStatus === "Declined" || statusInfo.transactionStatus === "Expired")) {
  await deletePendingOrder(orderReference);  // <-- УДАЛЯЕТ!
}
```

**НО!** Если `transactionStatus === "InProcessing"` (платёж ещё в обработке), verify endpoint:
1. **НЕ** создаёт заказ (потому что статус не Approved)
2. **НЕ** удаляет pending order (потому что статус не Declined/Expired)

...а потом приходит webhook с `Approved`, но **pending order уже мог быть удалён по другой причине** или webhook может не дойти вовсе.

### ⚠️ Но из логов видно удаление — значит кто-то его удалил. Это может быть verify при `Approved` статусе, но тогда **должен быть лог создания заказа в Sitniks**, которого нет!

---

### ПРОБЛЕМА #2 (КРИТИЧЕСКАЯ): Race condition между verify и webhook + тихие ошибки

**В `payment/verify/route.ts`** (строка 9506-9509):
```typescript
const lockAcquired = await acquireOrderLock(orderReference);
if (!lockAcquired) {
  console.log(`Order ${orderReference} already being processed or completed`);
  return NextResponse.json({
    success: true,   // <-- Возвращает success: true!
    updated: false,
    message: "Order already processed"
  });
}
```

Если lock не получен (кто-то другой обрабатывает), verify возвращает `success: true, updated: false` — и **клиент думает, что всё хорошо**, но заказ может и не быть создан.

**В webhook** (строка 10317-10319):
```typescript
const lockAcquired = await acquireOrderLock(orderReference);
if (!lockAcquired) {
  console.log(`Order ${orderReference} already being processed or completed`);
  return buildAcceptanceResponse(orderReference, secret);  // <-- Отвечает WayForPay "ок"
}
```

WayForPay получает "accept" и **больше не ретраит**. Но если lock был занят verify, а verify не смог создать заказ, то **оба считают что другой сделал работу**.

---

### ПРОБЛЕМА #3 (КРИТИЧЕСКАЯ): KV Store (order-processing-lock) — НЕ атомарная проверка

**Файл:** `lib/order-processing-lock.ts`, строки 26046-26055:
```typescript
// Check if order was already processed
const alreadyProcessed = await kv.exists(processedKey);
if (alreadyProcessed) return false;

// Try to acquire lock
const lockExists = await kv.exists(lockKey);
if (lockExists) return false;

// Set lock with TTL
await kv.set(lockKey, Date.now(), LOCK_TTL_SECONDS);
return true;
```

**Проблема:** Между `kv.exists(lockKey)` и `kv.set(lockKey, ...)` есть **race condition**! Два процесса (webhook + verify) могут одновременно проверить exists → оба получат false → оба установят lock → **оба попытаются создать заказ**.

Правильно было бы использовать Redis `SETNX` (set if not exists) — одна атомарная операция.

---

### ПРОБЛЕМА #4 (ВЫСОКАЯ): Sitniks API таймауты блокируют весь процесс

**Из логов:**
```
[getCatalogProductById] Timed out after 9000ms for id=21903869
[getCatalogProductById] Timed out after 9000ms for id=21910779
...множество таймаутов...
```

**В `checkout/route.ts`** товары получаются **последовательно** в цикле `for`:
```typescript
for (const item of body.items) {
  let catalogProduct = await getCatalogProductById(Number(productId));  // 9 сек таймаут!
  ...
}
```

При 8 товарах = до 72 секунд ожидания! Это вызывает **fallback на данные из запроса** (item.price), но:
- Вес товара берётся дефолтный (0.5 кг) — может быть неверным для ТТН
- Процесс чекаута сильно замедляется

Хотя checkout всё же формирует pending order (видно из логов), таймауты Sitniks API могут мешать webhook/verify при создании заказа.

---

### ПРОБЛЕМА #5 (СРЕДНЯЯ): Два дублирующих обработчика вебхука WayForPay

Существуют **два** endpoint-а для вебхука WayForPay:
1. `app/api/webhooks/wayforpay/route.ts` — **новый**, с pending orders flow
2. `app/api/checkout/callback/route.ts` — **старый**, только обновляет существующий заказ

**serviceUrl** в WayForPay указан как: `${wfpConfig.siteUrl}/api/webhooks/wayforpay`

Старый callback на `/api/checkout/callback` **не используется** для новых заказов, но:
- Он вызывает `updateSitniksOrder(orderReference, "paid")` — ищет заказ по orderReference
- Для `op_UUID` формата **заказ в Sitniks ещё не существует** → update fail → заказ остаётся необработанным

Если по какой-то причине WayForPay шлёт на `/api/checkout/callback` вместо `/api/webhooks/wayforpay`, заказ будет потерян.

---

### ПРОБЛЕМА #6 (СРЕДНЯЯ): Webhook может не доходить из-за SSL/сетевых проблем

В `sitniks-consolidated.ts`:
```typescript
} else if (error.message.includes('SSL') || error.message.includes('packet length')) {
  console.error("[sitniks] SSL/Connection error...");
}
```

Если сервер имеет нестабильное SSL соединение, WayForPay webhook может:
- Получить 5xx ответ → ретраить
- Получить timeout → ретраить
- НО если `buildAcceptanceResponse` возвращается до реальной обработки, WayForPay получит "accept" и перестанет ретраить

---

### ПРОБЛЕМА #7 (СРЕДНЯЯ): ТТН НЕ создаётся для онлайн-платежей из-за отсутствия `backwardDeliveryMoney`

**В webhook** (`app/api/webhooks/wayforpay/route.ts`, строка 10364):
```typescript
backwardDeliveryMoney: undefined,  // <-- Всегда undefined для online!
```

**В verify** (`app/api/payment/verify/route.ts`, строка 9558):
```typescript
backwardDeliveryMoney: undefined,  // <-- Тоже undefined
```

Это **корректно** для онлайн-оплаты (наложенный платёж не нужен). Однако ТТН может не создаваться, если API Новой Почты требует это поле или есть другая ошибка.

Ключевая проверка — **нет логов об ошибке ТТН** в предоставленных логах, что значит **процесс даже не доходит до создания ТТН** (не создаётся заказ в Sitniks → не вызывается createNovaPoshtaTTN).

---

## 🔍 КОРНЕВАЯ ПРИЧИНА (Root Cause Analysis)

Анализируя логи по хронологии:

```
11:20:51 → Pending order сохранён: op_763ea10f-...
11:20:51 → Online payment pending, amount=845.5
11:21:37 → Pending order прочитан и УДАЛЁН
```

**Между 11:20:51 и 11:21:37 (46 секунд)** кто-то прочитал и удалил pending order. Но в логах нет:
- `[wfp-webhook]` записей — **webhook НЕ был вызван**
- `[payment-verify]` записей — **verify endpoint НЕ вызывался**
- `[sitniks]` записей о создании заказа

**Но файл удалён!** Единственный код который читает + удаляет pending orders:
1. `webhook` — строка 10333: `await deletePendingOrder(orderReference)` (после создания заказа в Sitniks)
2. `verify` — строки 9575: `await deletePendingOrder(orderReference)` (после создания заказа в Sitniks)
3. `verify` — строка 9612: `await deletePendingOrder(orderReference)` (если Declined/Expired)

Если заказ НЕ был создан в Sitniks, но pending order удалён, значит **verify определил статус как Declined/Expired** и удалил pending order. Или это вызвано **другим процессом/рестартом**.

### 🎯 Наиболее вероятный сценарий:

1. Клиент оплачивает → WayForPay обрабатывает
2. Клиент возвращается на `/checkout/success` 
3. Success страница вызывает `/api/payment/verify`
4. **verify** вызывает `checkWayForPayStatus()` → WayForPay возвращает статус
5. **Если статус ещё "InProcessing"** (WayForPay ещё не подтвердила) → verify НЕ создаёт заказ, НЕ удаляет pending
6. Потом приходит **webhook от WayForPay** с Approved
7. Webhook читает pending order → создаёт в Sitniks → удаляет pending → создаёт ТТН

**НО если webhook не доходит** (блокируется middleware rate limiter, сетевая проблема, SSL), то:
- Verify не создал (статус был InProcessing)
- Webhook не дошёл
- **Заказ потерян!**

---

## ✅ РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ

### 1. 🔴 КРИТИЧЕСКОЕ: Retry механизм в verify endpoint

В `/api/payment/verify/route.ts` добавить retry для `InProcessing` статуса:

```typescript
if (statusInfo.transactionStatus === "InProcessing") {
  // Оплата ещё обрабатывается — НЕ удалять pending order
  // Клиент должен подождать и попробовать снова
  return NextResponse.json({
    success: true,
    updated: false,
    orderNumber,
    status: "InProcessing",
    retryAfter: 10, // секунд
    message: "Оплата обрабатывается, попробуйте через 10 секунд"
  });
}
```

И на фронте (`checkout/success/page.tsx`) добавить retry:

```typescript
// Retry verify if status is InProcessing
if (data.status === "InProcessing" && retryCount < 5) {
  setTimeout(() => verifyPayment(retryCount + 1), 10000);
}
```

### 2. 🔴 КРИТИЧЕСКОЕ: Атомарный lock в order-processing-lock.ts

Заменить три отдельных вызова на один атомарный:

```typescript
export async function acquireOrderLock(orderReference: string): Promise<boolean> {
  const kv = getKVStore();
  const lockKey = `${LOCK_PREFIX}${orderReference}`;
  const processedKey = `${PROCESSED_PREFIX}${orderReference}`;

  try {
    const alreadyProcessed = await kv.exists(processedKey);
    if (alreadyProcessed) return false;

    // Атомарный SETNX: если ключ уже существует — вернёт false
    const acquired = await kv.setNX(lockKey, Date.now(), LOCK_TTL_SECONDS);
    return acquired;
  } catch (error) {
    console.error(`[order-lock] Error:`, error);
    return false;
  }
}
```

Если ваш KV store не поддерживает `setNX`, используйте файловый lock с `O_EXCL` флагом.

### 3. 🔴 КРИТИЧЕСКОЕ: Не удалять pending order при Declined/Expired в verify

Клиент может повторить оплату! В `payment/verify/route.ts`:

```typescript
// УБРАТЬ это:
if (pending && (statusInfo.transactionStatus === "Declined" || statusInfo.transactionStatus === "Expired")) {
  await deletePendingOrder(orderReference);  // <-- НЕ удалять!
}

// Вместо этого — удалять только через 24 часа через cron job
```

### 4. 🟡 ВАЖНОЕ: Параллельный fetch товаров при checkout

В `checkout/route.ts` заменить последовательный цикл на `Promise.all`:

```typescript
const productPromises = body.items.map(item => {
  const productId = item.productId ?? item.id;
  return getCatalogProductById(Number(productId));
});
const catalogProducts = await Promise.all(productPromises);
```

### 5. 🟡 ВАЖНОЕ: Добавить explicit logging при неудаче

В webhook и verify добавить чёткие логи для каждого шага:

```typescript
console.error(`[wfp-webhook] CRITICAL: Order creation FAILED for ${orderReference}. 
  Pending order exists: ${!!pending}
  Lock acquired: ${lockAcquired}
  Sitniks result: ${JSON.stringify(sitniksOrder)}`);
```

### 6. 🟡 ВАЖНОЕ: Cron job для "зависших" pending orders

Создать эндпоинт или cron job, который:
1. Сканирует `data/pending-orders/` на файлы старше 5 минут
2. Для каждого вызывает `checkWayForPayStatus()`
3. Если Approved — создаёт заказ в Sitniks + ТТН
4. Если Expired (>24ч) — удаляет

### 7. 🟢 МЕЛКОЕ: Удалить старый `/api/checkout/callback`

Или перенаправить его на `/api/webhooks/wayforpay`, чтобы избежать путаницы.

### 8. 🟢 МЕЛКОЕ: Проверить env переменные НП на сервере

Убедиться что все переменные заданы:
```
NOVAPOSHTA_API_KEY
NOVAPOSHTA_SENDER_CITY_REF
NOVAPOSHTA_SENDER_WAREHOUSE_REF
NOVAPOSHTA_SENDER_COUNTERPARTY_REF
NOVAPOSHTA_SENDER_CONTACT_REF
NOVAPOSHTA_SENDER_PHONE
```

---

## 📊 Сводная таблица проблем

| # | Проблема | Критичность | Файл | Строка |
|---|---------|-------------|------|--------|
| 1 | Pending order удаляется без создания заказа | 🔴 Критическая | verify/route.ts | 9610-9613 |
| 2 | Race condition: verify + webhook не координированы | 🔴 Критическая | order-processing-lock.ts | 26046-26055 |
| 3 | Lock не атомарный (exists → set вместо SETNX) | 🔴 Критическая | order-processing-lock.ts | 26046-26055 |
| 4 | Нет retry для InProcessing в verify | 🔴 Критическая | verify/route.ts | 9499 |
| 5 | Sitniks API таймауты (9-12 сек) | 🟡 Важная | checkout/route.ts | 7615 |
| 6 | Два дублирующих webhook handler-а | 🟡 Важная | callback/route.ts | все |
| 7 | Нет cron для зависших pending orders | 🟡 Важная | — | — |
| 8 | Webhook может не дойти (нет fallback) | 🟡 Важная | webhooks/wayforpay/route.ts | — |

---

## 🔧 Быстрый fix (минимальные изменения)

**Самое быстрое решение** — добавить retry на фронте и не удалять pending при Declined:

### Файл: `app/api/payment/verify/route.ts`

```diff
-  // Payment not approved – clean up pending order if exists
-  const pending = await getPendingOrder(orderReference);
-  if (pending && (statusInfo.transactionStatus === "Declined" || statusInfo.transactionStatus === "Expired")) {
-    await deletePendingOrder(orderReference);
-    console.log(`[payment-verify] Deleted pending order (${statusInfo.transactionStatus})`);
-  }
+  // Payment not approved — keep pending order for retry (customer may retry payment)
+  // Pending orders will be cleaned up by cron job after 24 hours
+  console.log(`[payment-verify] Status is ${statusInfo.transactionStatus}, keeping pending order for potential retry`);
```

### Файл: `app/checkout/success/page.tsx` — добавить retry

```typescript
const MAX_VERIFY_RETRIES = 6;
const VERIFY_RETRY_DELAY = 5000; // 5 сек

function verifyPayment(orderReference: string, attempt: number = 0) {
  fetch("/api/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderReference }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "Approved" && data.updated) {
        // Успех!
        setRealOrderNumber(String(data.orderNumber));
        clearCart();
      } else if (data.status === "InProcessing" && attempt < MAX_VERIFY_RETRIES) {
        // Ещё обрабатывается — retry
        setTimeout(() => verifyPayment(orderReference, attempt + 1), VERIFY_RETRY_DELAY);
      }
      // Declined/Expired — показать ошибку
    });
}
```
