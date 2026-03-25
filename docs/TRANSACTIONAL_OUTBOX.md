# Transactional Outbox Implementation

## Overview

Реализован паттерн Transactional Outbox для надежной интеграции с Sitniks CRM. Теперь заказы не теряются даже если CRM временно недоступна.

## Архитектура

### 1. Outbox Storage (`lib/transactional-outbox.ts`)
- **Хранение**: Файловая система в `data/outbox/`
- **Статусы**: `pending` → `processing` → `completed` / `failed` / `dead_letter`
- **Retry логика**: Exponential backoff (1 мин → 2 мин → 4 мин → 8 мин → 16 мин → 24 час)
- **Dead Letter Queue**: `data/dead-letter/` для проваленных заказов

### 2. Background Worker (`app/api/outbox/worker/route.ts`)
- **Endpoint**: `GET /api/outbox/worker`
- **Rate limiting**: Минимум 30 секунд между запусками
- **Алерты**: Telegram уведомления при >10 failed items
- **Статистика**: Возвращает детальную статистику системы

### 3. Webhook Integration (`app/api/webhooks/wayforpay/route.ts`)
- **Новый поток**: Оплата → Outbox → Background Worker → Sitniks
- **Надежность**: Заказ добавляется в outbox даже если CRM недоступна
- **Мгновенное уведомление**: "Оплата отримана! Обробка..."

### 4. Admin Monitoring (`app/api/admin/outbox/route.ts`)
- **Статистика**: `GET /api/admin/outbox`
- **Pending items**: `GET /api/admin/outbox?pending=true`
- **Dead letter**: `GET /api/admin/outbox?dead-letter=true`
- **Retry**: `POST /api/admin/outbox` с action "retry-dead-letter"

## Конфигурация

### Cron Job (Linux/Mac)
```bash
# Сделать скрипт исполняемым
chmod +x scripts/outbox-cron.sh

# Добавить в crontab (каждые 5 минут)
*/5 * * * * /path/to/project/scripts/outbox-cron.sh
```

### Environment Variables
```bash
# Для алертов (опционально)
ADMIN_WEBHOOK_URL="https://hooks.slack.com/..."
```

## API Endpoints

### Worker
```bash
# Запустить обработку
GET /api/outbox/worker

# Получить статистику
GET /api/outbox/worker?stats=true

# Принудительный запуск (admin)
POST /api/outbox/worker
{"force": true}
```

### Admin
```bash
# Общая статистика
GET /api/admin/outbox

# Детальная информация
GET /api/admin/outbox?pending=true&dead-letter=true

# Retry dead letter item
POST /api/admin/outbox
{"action": "retry-dead-letter", "itemId": "outbox_123"}
```

## Flow Diagram

```
Платеж подтвержден
        ↓
   Webhook вызывается
        ↓
Добавить в Outbox (надежно)
        ↓
Очистить pending order
        ↓
Отправить уведомление "Обробка..."
        ↓
Background Worker (cron)
        ↓
Обработать outbox items
        ↓
Создать заказ в Sitniks
        ↓
Создать ТТН (если нужно)
        ↓
Отправить финальное уведомление
        ↓
Пометить как completed
```

## Retry Strategy

| Attempt | Delay    | Max Total |
|---------|----------|-----------|
| 1       | 1 мин    | 1 мин     |
| 2       | 2 мин    | 3 мин     |
| 3       | 4 мин    | 7 мин     |
| 4       | 8 мин    | 15 мин    |
| 5       | 16 мин   | 31 мин    |
| 6+      | 24 час   | ∞         |

## Monitoring

### Статистика
- `pending`: Ожидают обработки
- `processing`: В обработке сейчас  
- `completed`: Успешно обработаны
- `failed`: Провалены (будут retry)
- `deadLetter`: Провалены навсегда

### Алерты
- >10 failed items → Telegram alert
- Worker error → Telegram alert
- High dead letter count → Telegram alert

## Преимущества

1. **Надежность**: Заказы не теряются при недоступности CRM
2. **Отслеживаемость**: Полный статус каждого заказа
3. **Автоматическое восстановление**: Retry при временных сбоях
4. **Мониторинг**: Алерты и статистика в реальном времени
5. **Ручное управление**: Admin interface для manual retry

## Production Deployment

1. **Настроить cron job** для автоматической обработки
2. **Настроить алерты** для мониторинга
3. **Проверить логи** в `logs/outbox-cron.log`
4. **Мониторить dead letter queue** регулярно

Система готова к production использованию с гарантией доставки заказов в Sitniks CRM.
