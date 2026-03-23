/**
 * lib/novaposhta-create-ttn.ts
 * 
 * Створення ТТН (експрес-накладної) через API Нової Пошти
 * Документація: https://developers.novaposhta.ua/view/model/a90d323c-8512-11ec-8ced-005056b2dbe1/method/a965630e-8512-11ec-8ced-005056b2dbe1
 */

const NP_API_URL = 'https://api.novaposhta.ua/v2.0/json/';

interface CreateTTNParams {
  // Відправник
  senderCityRef: string;          // Ref міста відправника
  senderWarehouseRef: string;     // Ref відділення відправника (SenderAddress)
  senderCounterpartyRef: string;  // Ref контрагента-відправника (Sender)
  senderContactRef: string;       // Ref контактної особи відправника (ContactSender)
  senderPhone: string;            // Телефон відправника

  // Отримувач
  recipientCityRef: string;       // Ref міста отримувача
  recipientWarehouseRef: string;  // Ref відділення отримувача
  recipientName: string;          // ПІБ отримувача (Прізвище Ім'я По-батькові)
  recipientPhone: string;         // Телефон отримувача

  // Посилка
  description: string;            // Опис вмісту
  weight: number;                 // Вага в кг (min 0.1)
  cost: number;                   // Оціночна вартість (ціле число)
  seatsAmount: number;            // Кількість місць

  // Оплата
  paymentMethod: 'Cash' | 'NonCash';
  payerType: 'Sender' | 'Recipient';
  backwardDeliveryMoney?: number; // Сума накладеного платежу
}

async function npRequest(body: object): Promise<any> {
  const response = await fetch(NP_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`НП API HTTP помилка: ${response.status}`);
  return response.json();
}

/**
 * Крок 1: Створення контрагента-отримувача (PrivatePerson)
 * Повертає { counterpartyRef, contactRef }
 */
async function createRecipientCounterparty(
  apiKey: string,
  recipientName: string,
  recipientPhone: string,
  cityRef: string,
): Promise<{ counterpartyRef: string; contactRef: string }> {
  // Розбиваємо ПІБ на частини
  const parts = recipientName.trim().split(/\s+/);
  const lastName  = parts[0] ?? '';
  const firstName = parts[1] ?? parts[0] ?? '';
  const middleName = parts[2] ?? '';

  const result = await npRequest({
    apiKey,
    modelName: 'Counterparty',
    calledMethod: 'save',
    methodProperties: {
      FirstName: firstName,
      MiddleName: middleName,
      LastName: lastName,
      Phone: recipientPhone,
      Email: '',
      CounterpartyType: 'PrivatePerson',
      CounterpartyProperty: 'Recipient',
    },
  });

  console.log('[novaposhta-ttn] Counterparty response:', JSON.stringify(result, null, 2));

  if (!result.success || !result.data?.[0]) {
    throw new Error(`Не вдалося створити контрагента: ${result.errors?.join(', ')}`);
  }

  const data = result.data[0];
  const counterpartyRef = data.Ref;
  // ContactPersons повертається масивом вкладеним у data
  const contactRef = data.ContactPerson?.data?.[0]?.Ref ?? data.Ref;

  return { counterpartyRef, contactRef };
}

/**
 * Крок 2: Створення ТТН (InternetDocumentGeneral)
 */
export async function createNovaPoshtaTTN(params: CreateTTNParams): Promise<{
  success: boolean;
  ttn?: string;
  ref?: string;
  cost?: number;
  error?: string;
}> {
  try {
    const apiKey = process.env.NOVAPOSHTA_API_KEY;
    if (!apiKey) throw new Error('NOVAPOSHTA_API_KEY не налаштований');

    // Дата у форматі дд.мм.рррр
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}.${mm}.${yyyy}`;

    // Створюємо контрагента-отримувача
    const { counterpartyRef: recipientRef, contactRef: contactRecipientRef } =
      await createRecipientCounterparty(apiKey, params.recipientName, params.recipientPhone, params.recipientCityRef);

    const methodProperties: Record<string, any> = {
      DateTime: dateStr,

      // Відправник
      CitySender:     params.senderCityRef,
      Sender:         params.senderCounterpartyRef,
      SenderAddress:  params.senderWarehouseRef,
      ContactSender:  params.senderContactRef,
      SendersPhone:   params.senderPhone,

      // Отримувач
      CityRecipient:     params.recipientCityRef,
      Recipient:         recipientRef,
      RecipientAddress:  params.recipientWarehouseRef,
      ContactRecipient:  contactRecipientRef,
      RecipientsPhone:   params.recipientPhone,

      // Посилка
      Description: params.description,
      Weight:       String(Math.max(params.weight, 0.1)),
      SeatsAmount:  String(params.seatsAmount),
      Cost:         String(Math.round(params.cost)),

      // Тип
      ServiceType: 'WarehouseWarehouse',
      CargoType:   'Parcel',

      // Оплата
      PaymentMethod: params.paymentMethod,
      PayerType:     params.payerType,
    };

    // Зворотна доставка (накладений платіж)
    if (params.backwardDeliveryMoney) {
      methodProperties.BackwardDeliveryData = [{
        PayerType: 'Recipient',
        CargoType: 'Money',
        RedeliveryString: String(Math.round(params.backwardDeliveryMoney)),
      }];
    }

    const requestBody = {
      apiKey,
      modelName: 'InternetDocumentGeneral',
      calledMethod: 'save',
      methodProperties,
    };

    console.log('[novaposhta-ttn] Створення ТТН:', JSON.stringify(requestBody, null, 2));

    const result = await npRequest(requestBody);

    console.log('[novaposhta-ttn] Відповідь API:', JSON.stringify(result, null, 2));

    if (!result.success) {
      const errorMessage = result.errors?.join(', ') || 'Невідома помилка';
      console.error('[novaposhta-ttn] Помилка:', errorMessage);
      return { success: false, error: errorMessage };
    }

    if (result.warnings?.length) {
      console.warn('[novaposhta-ttn] Попередження:', result.warnings.join(', '));
    }

    if (!result.data?.[0]) {
      return { success: false, error: 'API не повернув дані ТТН' };
    }

    const ttnData = result.data[0];
    console.log('[novaposhta-ttn] ✓ ТТН створено:', ttnData.IntDocNumber);

    return {
      success: true,
      ttn: ttnData.IntDocNumber,
      ref: ttnData.Ref,
      cost: ttnData.CostOnSite,
    };

  } catch (error) {
    console.error('[novaposhta-ttn] Помилка:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Невідома помилка',
    };
  }
}

/**
 * Видаляє ТТН (якщо потрібно скасувати)
 */
export async function deleteNovaPoshtaTTN(ttnRef: string): Promise<boolean> {
  try {
    const apiKey = process.env.NOVAPOSHTA_API_KEY;
    if (!apiKey) {
      throw new Error('NOVAPOSHTA_API_KEY не налаштований');
    }

    const requestBody = {
      apiKey: apiKey,
      modelName: 'InternetDocument',
      calledMethod: 'delete',
      methodProperties: {
        DocumentRefs: ttnRef
      }
    };

    const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    return result.success === true;

  } catch (error) {
    console.error('[novaposhta-ttn] Помилка видалення ТТН:', error);
    return false;
  }
}
