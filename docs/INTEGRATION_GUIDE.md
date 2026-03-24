# 🔗 Повна інструкція з інтеграції: Sitniks CRM + WayForPay + Нова Пошта

## 📋 Огляд

Ця документація описує повний процес інтеграції FamilyHub Market з трьома ключовими сервісами:
- **Sitniks CRM** - система управління клієнтами та замовленнями
- **WayForPay** - платіжна система для прийому платежів карткою
- **Нова Пошта** - логістична служба доставки

## 🎯 Мета інтеграції

- ✅ **Автоматична синхронізація** клієнтів та замовлень з Sitniks
- ✅ **Прийом онлайн платежів** через WayForPay з автоматичним оновленням статусів
- ✅ **Автоматичне створення ТТН** через Нову Пошту
- ✅ **Відстеження статусів** замовлень в реальному часі
- ✅ **Єдина система аналітики** по всіх продажах

---

## 🏢 Частина 1: Інтеграція з Sitniks CRM

### 1.1 Реєстрація та налаштування

1. **Створіть акаунт** на [sitniks.com](https://sitniks.com)
2. **Налаштуйте компанію** в панелі керування
3. **Отримайте API доступ**:
   - Перейдіть в `Налаштування` → `API`
   - Скопіюйте `API URL` та `Bearer Token`

### 1.2 Environment Variables

Додайте в `.env.local`:

```bash
# Sitniks CRM Configuration
SITNIKS_API_URL=https://your-store.sitniks.com/api/v1
SITNIKS_API_KEY=your_bearer_token_here
SITNIKS_WEBHOOK_SECRET=your_webhook_secret

# Інтеграція Нової Пошти в Sitniks
SITNIKS_NP_INTEGRATION_ID=12345
SITNIKS_SALES_CHANNEL_ID=67890
SITNIKS_NEW_STATUS_ID=11111
SITNIKS_PENDING_PAYMENT_STATUS_ID=22222
SITNIKS_PAID_STATUS_ID=33333
```

### 1.3 Налаштування ID в Sitniks

**Знайдіть необхідні ID в Sitniks:**

1. **Інтеграція Нової Пошти**:
   - `Налаштування` → `Інтеграції` → `Нова Пошта`
   - ID відображається в URL або таблиці

2. **Канал продажів "Сайт"**:
   - `Налаштування` → `Канали продажів`
   - Знайдіть або створіть канал "Сайт"

3. **Статуси замовлень**:
   - `Налаштування` → `Статуси замовлень`
   - Запишіть ID для статусів:
     - "Новий" (для наложеного платежу)
     - "Очікує оплати" (для онлайн оплати)
     - "Оплачено" (після успішної оплати)

### 1.4 Webhook налаштування

1. **Налаштуйте webhook** в Sitniks:
   - `Налаштування` → `Webhooks`
   - URL: `https://your-site.com/api/sitniks-webhook`
   - Secret: той самий що в `SITNIKS_WEBHOOK_SECRET`

2. **Вебхук обробляє**:
   - Оновлення статусів замовлень
   - Зміни в статусах ТТН
   - Оновлення даних клієнтів

---

## 💳 Частина 2: Інтеграція з WayForPay

### 2.1 Реєстрація та налаштування

1. **Зареєструйте мерчант** на [wayforpay.com](https://wayforpay.com)
2. **Пройдіть верифікацію** компанії
3. **Налаштуйте магазин** в мерчант кабінеті

### 2.2 Отримання API ключів

1. **Увійдіть** в мерчант кабінет WayForPay
2. **Перейдіть** в `Settings` → `API keys`
3. **Скопіюйте**:
   - `Merchant Account` (назва мерчанта)
   - `Merchant Domain` (домен магазину)
   - `Secret Key` (HMAC-MD5 ключ)

### 2.3 Environment Variables

Додайте в `.env.local`:

```bash
# WayForPay Configuration
WAYFORPAY_MERCHANT_ACCOUNT=FamilyHubMarket_UA
WAYFORPAY_MERCHANT_DOMAIN=familyhubmarket.com
WAYFORPAY_SECRET_KEY=your_hmac_md5_secret_key

# URLs для callback (автоматично генеруються)
# NEXT_PUBLIC_SITE_URL=http://localhost:3000 (для розробки)
# NEXT_PUBLIC_SITE_URL=https://your-store.com (для продакшена)
```

### 2.4 Налаштування URL в WayForPay

1. **В мерчант кабінеті** налаштуйте:
   - **Success URL**: `https://your-store.com/checkout/success`
   - **Failure URL**: `https://your-store.com/checkout/failure`
   - **Callback URL**: `https://your-store.com/api/webhooks/wayforpay`

2. **Перевірка** налаштувань:
   - Test transactions через WayForPay тестові карти
   - Перевірка callback URL на доступність

### 2.5 Підтримувані валюти

- **UAH** - основна валюта
- **USD/EUR** - за потреби (додаткове налаштування)

---

## 📦 Частина 3: Інтеграція з Новою Поштою

### 3.1 API доступ до Нової Пошти

1. **Зареєструйте API ключ** на [novaposhta.ua](https://novaposhta.ua)
2. **Отримайте**:
   - `API Key` (2.0 ключ)
   - `Sender City Ref`
   - `Sender Warehouse Ref`
   - `Sender Counterparty Ref`
   - `Sender Contact Ref`

### 3.2 Environment Variables

Додайте в `.env.local`:

```bash
# Nova Poshta Configuration
NOVAPOSHTA_API_KEY=your_api_key_here
NOVAPOSHTA_SENDER_CITY_REF=db5c88d0-391c-11dd-90d9-001a92567626
NOVAPOSHTA_SENDER_WAREHOUSE_REF=ed25ae13-9bfd-11e4-acce-0050568013cf
NOVAPOSHTA_SENDER_COUNTERPARTY_REF=45ccd769-1efd-11ee-a60f-48df37b921db
NOVAPOSHTA_SENDER_CONTACT_REF=45d084df-1efd-11ee-a60f-48df37b921db
NOVAPOSHTA_SENDER_PHONE=380936174140
```

### 3.3 Відправник в Новій Пошті

**Стандартні відправники (м. Одеса):**
```bash
# Місто відправлення
NOVAPOSHTA_SENDER_CITY_REF=db5c88d0-391c-11dd-90d9-001a92567626

# Склад №52: вул. Розкидайлівська, 18
NOVAPOSHTA_SENDER_WAREHOUSE_REF=ed25ae13-9bfd-11e4-acce-0050568013cf

# Контактна особа відправника
NOVAPOSHTA_SENDER_CONTACT_REF=45d084df-1efd-11ee-a60f-48df37b921db
NOVAPOSHTA_SENDER_PHONE=380936174140
```

### 3.4 Інтеграція через Sitniks

**Рекомендований підхід** - використовувати Sitniks як посередника:

1. **Налаштуйте інтеграцію** в Sitniks:
   - `Налаштування` → `Інтеграції` → `Нова Пошта`
   - Додайте ваш API ключ Нової Пошти
   - Виберіть відправника за замовчуванням

2. **Використовуйте** Sitniks ID замість прямих викликів:
   ```bash
   SITNIKS_NP_INTEGRATION_ID=12345
   ```

---

## 🔄 Частина 4: Процес інтеграції (крок за кроком)

### Крок 1: Базове налаштування

```bash
# 1. Скопіюйте .env.local.example в .env.local
cp .env.local.example .env.local

# 2. Відредагуйте .env.local з вашими ключами
# Додайте всі API ключі та ID з попередніх розділів

# 3. Запустіть проєкт для перевірки
npm run dev
```

### Крок 2: Тестування Sitniks інтеграції

```bash
# Тест API підключення
curl -H "Authorization: Bearer YOUR_SITNIKS_KEY" \
     YOUR_SITNIKS_API_URL/open-api/clients

# Перевірка вебхук endpoint
curl -X POST https://your-site.com/api/sitniks-webhook \
     -H "Content-Type: application/json"
```

### Крок 3: Тестування WayForPay

1. **Створіть тестове замовлення** в системі
2. **Перейдіть** до оплати
3. **Використовуйте тестову карту**:
   - Карта: `4444555511112222`
   - CVV: `123`
   - Термін: будь-який майбутній

### Крок 4: Тестування Нової Пошти

1. **Створіть замовлення** з доставкою Новою Поштою
2. **Перевірте** автоматичне створення ТТН
3. **Відстежте** статус в адмінпанелі

---

## 🧪 Частина 5: Тестування та валідація

### 5.1 Unit тести

```bash
# Запустіть тести інтеграції
npm run test:integration

# Windows
npm run test:integration:windows
```

### 5.2 Перевірка функціональності

**Sitniks тест:**
- ✅ Створення клієнта
- ✅ Створення замовлення
- ✅ Оновлення статусу
- ✅ Вебхук обробка

**WayForPay тест:**
- ✅ Створення платежу
- ✅ Callback обробка
- ✅ Статус оновлення
- ✅ Redirect після оплати

**Нова Пошта тест:**
- ✅ Розрахунок вартості
- ✅ Створення ТТН
- ✅ Відстеження статусу
- ✅ Список відділень

### 5.3 Моніторинг

**Логування важливих подій:**
```typescript
// Приклад логування в API routes
console.log('🔗 Sitniks API call:', { endpoint, method, status });
console.log('💳 WayForPay transaction:', { orderId, status, amount });
console.log('📦 Nova Poshta TTN:', { ttn, status, warehouse });
```

---

## 🚨 Частина 6: Поширені проблеми та рішення

### 6.1 Sitniks проблеми

**Проблема:** `401 Unauthorized`
**Рішення:** Перевірте `SITNIKS_API_KEY` та URL

**Проблема:** `Webhook not working`
**Рішення:** 
- Перевірте `SITNIKS_WEBHOOK_SECRET`
- Переконайтесь що webhook endpoint доступний
- Перевірте CORS налаштування

### 6.2 WayForPay проблеми

**Проблема:** `Invalid signature`
**Рішення:** Перевірте `WAYFORPAY_SECRET_KEY`

**Проблема:** `Callback not received`
**Рішення:**
- Перевірте callback URL в мерчант кабінеті
- Переконайтесь що сервер доступний з інтернету
- Перевірте SSL сертифікат

### 6.3 Нова Пошта проблеми

**Проблема:** `Invalid sender data`
**Рішення:** Перевірте всі sender REF значення

**Проблема:** `Warehouse not found`
**Рішення:** Використовуйте актуальні REF значення відділень

---

## 📊 Частина 7: Моніторинг та аналітика

### 7.1 Ключові метрики

**Платежі:**
- Кількість успішних транзакцій
- Конверсія в оплату
- Середній чек
- Помилки оплати

**Доставка:**
- Кількість створених ТТН
- Середній час доставки
- Вартість доставки
- Проблемні доставки

**CRM:**
- Кількість нових клієнтів
- Повторні покупки
- Середній LTV
- Відтік клієнтів

### 7.2 Dashboard

Використовуйте вбудовану аналітику:
- `/admin` - головна панель
- `/admin/analytics` - детальна аналітика
- `/admin/orders` - управління замовленнями
- `/admin/customers` - управління клієнтами

---

## 🔧 Частина 8: Обслуговування та оновлення

### 8.1 Регулярні перевірки

**Щомісяця:**
- Перевірка API ключів
- Моніторинг лімітів
- Оновлення тарифів
- Аудит транзакцій

**Щокварталу:**
- Оновлення документації
- Тестування бекап систем
- Перевірка інтеграцій
- Оптимізація процесів

### 8.2 Оновлення систем

**Sitniks:**
- Слідкуйте за оновленнями API
- Перевіряйте зміни в вебхук форматах
- Оновлюйте ID при змінах в налаштуваннях

**WayForPay:**
- Моніторьте зміни в мерчант кабінеті
- Оновлюйте callback URLs при зміні домену
- Перевіряйте нові методи оплати

**Нова Пошта:**
- Оновлюйте REF значення відділень
- Слідкуйте за змінами в тарифах
- Перевіряйте нові сервіси

---

## 📞 Частина 9: Підтримка та контакти

### 9.1 Технічна підтримка

**Sitniks:**
- Email: support@sitniks.com
- Документація: [docs.sitniks.com](https://docs.sitniks.com)

**WayForPay:**
- Email: support@wayforpay.com
- Документація: [docs.wayforpay.com](https://docs.wayforpay.com)

**Нова Пошта:**
- Email: api@novaposhta.ua
- Документація: [dev.novaposhta.ua](https://dev.novaposhta.ua)

### 9.2 Внутрішня підтримка

**Для розробників:**
- Технічна документація: `/docs/`
- API Reference: `/docs/API_REFERENCE.md`
- Troubleshooting: `/docs/TROUBLESHOOTING_GUIDE.md`

**Для бізнесу:**
- Admin Panel Guide: `/docs/ADMIN_PANEL_GUIDE.md`
- Analytics Guide: `/docs/SITNIKS_ANALYTICS_COMPLETE_GUIDE.md`

---

## ✅ Частина 10: Чек-лист інтеграції

### Перед початком:
- [ ] Зареєстровані акаунти в усіх сервісах
- [ ] Отримані API ключі та доступи
- [ ] Налаштовані домени та SSL
- [ ] Підготовлені тестові дані

### Налаштування:
- [ ] Додані всі environment variables
- [ ] Налаштовані webhook URLs
- [ ] Перевірені ID в Sitniks
- [ ] Налаштована мерчант інформація в WayForPay

### Тестування:
- [ ] Пройдено unit тести
- [ ] Перевірено API підключення
- [ ] Протестовано платежі
- [ ] Перевірено створення ТТН

### Продакшен:
- [ ] Налаштовано моніторинг
- [ ] Налаштовано логування
- [ ] Перевірено безпеку
- [ ] Проведено фінальне тестування

---

**🎉 Після завершення інтеграції ви отримаєте повнофункціональну e-commerce платформу з автоматизованими процесами управління замовленнями, платежами та доставкою!**

---

*Ця документація оновлюється разом з розвитком платформи. Періодично перевіряйте актуальність інформації.*
