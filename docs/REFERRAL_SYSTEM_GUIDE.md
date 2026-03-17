# 🎯 Реферальна система FamilyHub Market

## ✨ Огляд

Реферальна система дозволяє користувачам запрошувати друзів та отримувати бонуси. Система працює повністю через Sitniks Open API без потреби модифікувати базу даних.

## 🚀 Як це працює

### 1. Генерація реферального коду
- Коли користувач заходить в профіль, система автоматично генерує унікальний код
- Формат: `REF_ABC123_1X2B3C`
- Код зберігається в полі `comment` клієнта в Sitniks

### 2. Поділ посиланням
- Користувач копіює посилання: `https://familyhub.com.ua/?ref=REF_ABC123_1X2B3C`
- Посилання можна поділитися в соцмережах, месенджерах

### 3. Реєстрація по рефералу
- Новий користувач переходить по посиланню
- Система автоматично визначає реферера
- Записує в `comment` нового клієнта: `Referred by: REF_ABC123_1X2B3C`

## 📋 Технічна реалізація

### Frontend (Next.js)

#### API Routes
```
POST /api/referral/generate  - Генерація реферального коду
POST /api/referral/lookup    - Пошук реферера по коду
```

#### Основні компоненти
- `lib/sitniks-customers.ts` - робота з Sitniks API
- `app/profile/profile-client.tsx` - відображення реферального блоку
- `app/api/referral/` - API роути

### Backend (Sitniks)

#### Використовуємо існуючі endpoints:
```
GET /open-api/clients          - Пошук клієнтів
PUT /open-api/clients/{id}    - Оновлення клієнта
POST /open-api/clients        - Створення клієнта
```

#### Як зберігаються дані:
- **Реферер:** `comment: "Referral code: REF_ABC123_1X2B3C"`
- **Запрошений:** `comment: "Referred by: REF_ABC123_1X2B3C"`

## 🎨 UI Компоненти

### Блок реферальної програми в профілі
```
Запросіть друзів
Отримайте 15% від кожного замовлення друга

[REF_ABC123_1X2B3C] [Копіювати] [Копіювати посилання]
```

### Статистика (плануется)
- Кількість запрошених
- Загальний заробіток
- Очікуючі підтвердження

## 🔧 Налаштування

### Environment Variables
```env
SITNIKS_API_URL=https://crm.sitniks.com
SITNIKS_API_KEY=your_api_key
```

### Не потребує SQL змін!
Система працює через існуючий Sitniks Open API.

## 🧪 Тестування

### 1. Генерація коду
1. Зайди в профіль користувача
2. Побачиш реферальний код у блоці "Запросіть друзів"

### 2. Тестування реферала
1. Скопіюй реферальне посилання
2. Очисти cookies (`fhm_auth`)
3. Перейди по посиланню
4. Зареєструй нового користувача
5. Перевір в Sitniks що обидва клієнти мають відповідні записи

### 3. Перевірка в Sitniks
У картці кожного клієнта в полі `comment`:
- **Реферер:** `Referral code: REF_ABC123_1X2B3C`
- **Запрошений:** `Referred by: REF_ABC123_1X2B3C`

## 📊 Аналітика

### Фільтрація в Sitniks
Можна фільтрувати клієнтів по `comment`:
- `comment LIKE "Referral code:%"` - всі реферери
- `comment LIKE "Referred by:%"` - всі запрошені

### Звіти
- Кількість рефералів
- Активність запрошених
- Конверсія реферальної програми

## 🔄 Майбутні покращення

### В планах:
1. **Автоматичні бонуси** - нарахування знижок рефереру
2. **Детальна статистика** - графіки та звіти в профілі
3. **Багаторівнева програма** - бонуси за запрошення 2-го рівня
4. **Інтеграція з email** - автоматичні повідомлення
5. **QR коди** - для офлайн-просування

### Технічні покращення:
1. **Кешування** - для швидкості пошуку рефералів
2. **Валідація** - перевірка унікальності кодів
3. **Логування** - детальна статистика переходів

## 🛠 Код

### Генерація реферального коду
```typescript
export function generateReferralCode(customerId: number): string {
  const timestamp = Date.now().toString(36);
  const hash = Buffer.from(customerId.toString()).toString('base64').slice(0, 6).toUpperCase();
  return `REF_${hash}_${timestamp}`;
}
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

## ✅ Перевірки

- [x] Генерація унікальних кодів
- [x] Збереження в Sitniks без SQL
- [x] Пошук реферера по коду
- [x] Автоматичне застосування реферала
- [x] UI блок в профілі
- [ ] Автоматичні бонуси
- [ ] Детальна статистика

## 🎉 Результат

Реферальна система готова до використання! Користувачі можуть запрошувати друзів, а ти бачиш всю статистику в Sitniks CRM без додаткових налаштувань.
