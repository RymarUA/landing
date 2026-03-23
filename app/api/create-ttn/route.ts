/**
 * app/api/create-ttn/route.ts
 * 
 * API endpoint для створення ТТН Нової Пошти після оформлення замовлення
 */

import { NextRequest, NextResponse } from 'next/server';
import { createNovaPoshtaTTN } from '@/lib/novaposhta-create-ttn';

interface CreateTTNRequest {
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientCityRef: string;
  recipientWarehouseRef: string;
  description: string;
  weight: number;
  cost: number;
  paymentMethod: 'Cash' | 'NonCash';
  backwardDeliveryMoney?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateTTNRequest = await req.json();

    // Перевірка обов'язкових полів
    if (!body.recipientName || !body.recipientPhone || !body.recipientCityRef || !body.recipientWarehouseRef) {
      return NextResponse.json(
        { error: 'Не вказані обов\'язкові поля отримувача' },
        { status: 400 }
      );
    }

    // Перевірка налаштувань відправника
    const senderCityRef = process.env.NOVAPOSHTA_SENDER_CITY_REF;
    const senderWarehouseRef = process.env.NOVAPOSHTA_SENDER_WAREHOUSE_REF;
    const senderCounterpartyRef = process.env.NOVAPOSHTA_SENDER_COUNTERPARTY_REF;
    const senderContactRef = process.env.NOVAPOSHTA_SENDER_CONTACT_REF;
    const senderPhone = process.env.NOVAPOSHTA_SENDER_PHONE;

    if (!senderCityRef || !senderWarehouseRef || !senderCounterpartyRef || !senderContactRef || !senderPhone) {
      console.error('[create-ttn] Налаштування відправника не заповнені в .env.local');
      return NextResponse.json(
        { 
          error: 'Налаштування відправника не заповнені. Зверніться до адміністратора.',
          missingFields: {
            senderCityRef: !senderCityRef,
            senderWarehouseRef: !senderWarehouseRef,
            senderCounterpartyRef: !senderCounterpartyRef,
            senderContactRef: !senderContactRef,
            senderPhone: !senderPhone
          }
        },
        { status: 500 }
      );
    }

    console.log(`[create-ttn] Створення ТТН для замовлення ${body.orderNumber}`);

    // Створюємо ТТН
    const result = await createNovaPoshtaTTN({
      senderCityRef,
      senderWarehouseRef,
      senderCounterpartyRef,
      senderContactRef,
      senderPhone,
      recipientCityRef: body.recipientCityRef,
      recipientWarehouseRef: body.recipientWarehouseRef,
      recipientName: body.recipientName,
      recipientPhone: body.recipientPhone,
      description: body.description,
      weight: body.weight,
      cost: body.cost,
      seatsAmount: 1,
      paymentMethod: body.paymentMethod,
      payerType: 'Recipient', // Отримувач платить за доставку
      backwardDeliveryMoney: body.backwardDeliveryMoney
    });

    if (!result.success) {
      console.error('[create-ttn] Помилка створення ТТН:', result.error);
      return NextResponse.json(
        { error: result.error || 'Не вдалося створити ТТН' },
        { status: 500 }
      );
    }

    console.log(`[create-ttn] ✓ ТТН створено: ${result.ttn}`);

    return NextResponse.json({
      success: true,
      ttn: result.ttn,
      ref: result.ref,
      cost: result.cost
    });

  } catch (error) {
    console.error('[create-ttn] Помилка:', error);
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    );
  }
}
