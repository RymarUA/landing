/**
 * lib/novaposhta-create-ttn.ts
 * 
 * Створення ТТН (експрес-накладної) через API Нової Пошти
 * Документація: https://developers.novaposhta.ua/view/model/a90d323c-8512-11ec-8ced-005056b2dbe1/method/a965630e-8512-11ec-8ced-005056b2dbe1
 */

import { fetchNPWarehouses, NPWarehouse } from './novaposhta-api';

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

function transliterateToUkrainian(value: string): string {
  const digraphs: Array<[string, string]> = [
    ['shch', 'щ'],
    ['zh', 'ж'],
    ['kh', 'х'],
    ['ts', 'ц'],
    ['ch', 'ч'],
    ['sh', 'ш'],
    ['yu', 'ю'],
    ['ya', 'я'],
    ['yi', 'ї'],
    ['ye', 'є'],
    ['yo', 'йо'],
  ];

  const singles: Record<string, string> = {
    a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'і',
    j: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'к', r: 'р',
    s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'кс', y: 'и', z: 'з',
  };

  let result = value.trim().toLowerCase();
  for (const [from, to] of digraphs) {
    result = result.replaceAll(from, to);
  }

  result = result.replace(/[a-z]/g, (char) => singles[char] ?? char);
  result = result.replace(/[^\p{Script=Cyrillic}'’\-\s]/gu, ' ');
  result = result.replace(/\s+/g, ' ').trim();

  return result.replace(/(^|\s|['’\-])(\p{Script=Cyrillic})/gu, (_, prefix: string, char: string) => `${prefix}${char.toUpperCase()}`);
}

function normalizeRecipientName(recipientName: string): { firstName: string; lastName: string; middleName: string } {
  const normalized = transliterateToUkrainian(recipientName);
  // Final cleanup: strip non-Cyrillic chars (keep only Cyrillic, spaces, apostrophes, hyphens)
  const cleaned = normalized.replace(/[^\u0400-\u04FF\u0027\s\-]/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: 'Клієнт', lastName: 'Клієнт', middleName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Клієнт', middleName: '' };
  }

  return {
    lastName: parts[0],
    firstName: parts[1],
    middleName: parts.slice(2).join(' '),
  };
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
  _cityRef: string,
): Promise<{ counterpartyRef: string; contactRef: string }> {
  // Спочатку перевіряємо, чи існує контрагент з таким телефоном
  console.log('[novaposhta-ttn] Пошук існуючого контрагента за телефоном:', recipientPhone);
  
  const existingResult = await npRequest({
    apiKey,
    modelName: 'Counterparty',
    calledMethod: 'getCounterparties',
    methodProperties: {
      FindByString: recipientPhone,
      CounterpartyProperty: 'Recipient',
    },
  });

  console.log('[novaposhta-ttn] Результат пошуку контрагента:', JSON.stringify(existingResult, null, 2));

  // Якщо контрагент вже існує, використовуємо його
  if (existingResult.success && existingResult.data?.length > 0) {
    const existingCounterparty = existingResult.data[0];
    console.log('[novaposhta-ttn] Знайдено існуючого контрагента:', existingCounterparty.Ref);
    
    // Отримуємо контактну особу для існуючого контрагента
    const contactResult = await npRequest({
      apiKey,
      modelName: 'Counterparty',
      calledMethod: 'getCounterpartyContactPersons',
      methodProperties: {
        Ref: existingCounterparty.Ref,
      },
    });

    let contactRef = existingCounterparty.Ref; // fallback до Ref контрагента
    if (contactResult.success && contactResult.data?.length > 0) {
      contactRef = contactResult.data[0].Ref;
      console.log('[novaposhta-ttn] Знайдено контактну особу:', contactRef);
    }

    return {
      counterpartyRef: existingCounterparty.Ref,
      contactRef: contactRef,
    };
  }

  // Якщо контрагент не знайдений, створюємо нового
  console.log('[novaposhta-ttn] Створення нового контрагента...');
  
  // Розбиваємо ПІБ на частини
  const { firstName, lastName, middleName } = normalizeRecipientName(recipientName);

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

  console.log('[novaposhta-ttn] Результат створення контрагента:', JSON.stringify(result, null, 2));

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

    // According to Nova Poshta API documentation:
// - SenderAddress/RecipientAddress: Ref склада (UUID)
// - SenderWarehouseIndex/RecipientWarehouseIndex: Цифровой адрес склада (Number)
    
    // Helper function to get warehouse Number (digital address)
    const getWarehouseNumber = async (warehouseRef: string, cityRef: string): Promise<string> => {
      // CRITICAL: Force hardcoded fallback for known sender warehouse due to API issues
      const hardcodedWarehouses: Record<string, { number: string; districtCode: string }> = {
        // Sender warehouse (known from testing)
        'ed25ae13-9bfd-11e4-acce-0050568002cf': { number: '52', districtCode: '55' },
      };
      
      const senderFallback = hardcodedWarehouses[warehouseRef];
      if (senderFallback) {
        console.log(`[novaposhta-ttn] Using hardcoded fallback for sender warehouse ${warehouseRef}: Number=${senderFallback.number}, DistrictCode=${senderFallback.districtCode}`);
        return senderFallback.number;
      }
      
      try {
        const warehouses = await fetchNPWarehouses(cityRef);
        const warehouse = warehouses.find(w => w.Ref === warehouseRef);
        
        if (warehouse?.Number) {
          return warehouse.Number;
        }
        
        console.warn(`[novaposhta-ttn] No warehouse found for ${warehouseRef}, using Ref as fallback`);
        return warehouseRef; // Last resort fallback
      } catch (error) {
        console.error(`[novaposhta-ttn] Failed to get warehouse Number for ${warehouseRef}:`, error);
        return warehouseRef; // Last resort fallback
      }
    };

    // Helper function to get warehouse DistrictCode for proper WarehouseIndex format
    const getWarehouseDistrictCode = async (warehouseRef: string, cityRef: string): Promise<string> => {
      // CRITICAL: Force hardcoded fallback for known sender warehouse due to API issues
      const hardcodedWarehouses: Record<string, { number: string; districtCode: string }> = {
        // Sender warehouse (known from testing)
        'ed25ae13-9bfd-11e4-acce-0050568002cf': { number: '52', districtCode: '55' },
      };
      
      const senderFallback = hardcodedWarehouses[warehouseRef];
      if (senderFallback) {
        console.log(`[novaposhta-ttn] Using hardcoded fallback for sender warehouse ${warehouseRef}: DistrictCode=${senderFallback.districtCode}`);
        return senderFallback.districtCode;
      }
      
      try {
        const warehouses = await fetchNPWarehouses(cityRef);
        const warehouse = warehouses.find(w => w.Ref === warehouseRef);
        
        if (warehouse?.DistrictCode) {
          return warehouse.DistrictCode;
        }
        
        console.warn(`[novaposhta-ttn] No DistrictCode found for warehouse ${warehouseRef}, using empty string`);
        return ''; // Last resort fallback
      } catch (error) {
        console.error(`[novaposhta-ttn] Failed to get warehouse DistrictCode for ${warehouseRef}:`, error);
        return ''; // Last resort fallback
      }
    };

    // Get digital addresses and district codes for both sender and recipient
    const senderWarehouseNumber = await getWarehouseNumber(params.senderWarehouseRef, params.senderCityRef);
    const recipientWarehouseNumber = await getWarehouseNumber(params.recipientWarehouseRef, params.recipientCityRef);
    const senderDistrictCode = await getWarehouseDistrictCode(params.senderWarehouseRef, params.senderCityRef);
    const recipientDistrictCode = await getWarehouseDistrictCode(params.recipientWarehouseRef, params.recipientCityRef);

    // CRITICAL: According to successful API test, SenderWarehouseIndex/RecipientWarehouseIndex 
    // need format "DistrictCode/Number" (e.g., "55/52") not just "Number/1" (e.g., "52/1")
    const senderWarehouseIndex = senderDistrictCode ? `${senderDistrictCode}/${senderWarehouseNumber}` : `${senderWarehouseNumber}/1`;
    const recipientWarehouseIndex = recipientDistrictCode ? `${recipientDistrictCode}/${recipientWarehouseNumber}` : `${recipientWarehouseNumber}/1`;

    // Determine payment method based on payment type
    // CRITICAL: Nova Poshta payment logic:
    // - Online payments (pre-paid): PayerType="Sender", PaymentMethod="Cash" 
    // - COD (наложенный платеж): PayerType="Recipient", PaymentMethod="Cash"
    const effectivePaymentMethod = 'Cash'; // Cash means "paid" in Nova Poshta API
    const effectivePayerType = params.payerType === 'Sender' ? 'Sender' : 'Recipient'; // Use original payer type logic

    console.log(`[novaposhta-ttn] Payment configuration: PaymentMethod=${effectivePaymentMethod}, PayerType=${effectivePayerType}, OriginalPayerType=${params.payerType}`);
    console.log(`[novaposhta-ttn] Sender: CityRef=${params.senderCityRef}, WarehouseRef=${params.senderWarehouseRef}, DistrictCode=${senderDistrictCode}, Number=${senderWarehouseNumber}, WarehouseIndex=${senderWarehouseIndex}`);
    console.log(`[novaposhta-ttn] Recipient: CityRef=${params.recipientCityRef}, WarehouseRef=${params.recipientWarehouseRef}, DistrictCode=${recipientDistrictCode}, Number=${recipientWarehouseNumber}, WarehouseIndex=${recipientWarehouseIndex}`);
    console.log(`[novaposhta-ttn] Sender: CounterpartyRef=${params.senderCounterpartyRef}, ContactRef=${params.senderContactRef}`);
    console.log(`[novaposhta-ttn] Recipient: Name=${params.recipientName}, Phone=${params.recipientPhone}`);

    const methodProperties: Record<string, any> = {
      DateTime: dateStr,

      // Відправник - правильная структура согласно документации
      CitySender:     params.senderCityRef,
      Sender:         params.senderCounterpartyRef,
      SenderAddress:  params.senderWarehouseRef,        // ← Ref склада (UUID)
      SenderWarehouseIndex: senderWarehouseIndex,        // ← Формат "DistrictCode/Number" (e.g., "55/52")
      ContactSender:  params.senderContactRef,
      SendersPhone:   params.senderPhone,

      // Отримувач - правильная структура согласно документации
      CityRecipient:     params.recipientCityRef,
      Recipient:         recipientRef,
      RecipientAddress:  params.recipientWarehouseRef,     // ← Ref склада (UUID)
      RecipientWarehouseIndex: recipientWarehouseIndex,   // ← Формат "DistrictCode/Number" (e.g., "55/52")
      ContactRecipient:  contactRecipientRef,
      RecipientsPhone:   params.recipientPhone,

      // Посилка
      Description: params.description,
      Weight:       String(Math.max(params.weight, 0.1)), // ← Правильный вес из Sitniks
      SeatsAmount:  String(params.seatsAmount),
      Cost:         String(Math.round(params.cost)),
      VolumeGeneral: "0.004", // ← Добавлено обязательное поле (min. 0.0004)

      // Тип
      ServiceType: 'WarehouseWarehouse',
      CargoType:   'Parcel',

      // Оплата - исправлено для онлайн-оплаты
      PaymentMethod: effectivePaymentMethod, // ← "Cash" для онлайн-оплаты (оплачено)
      PayerType:     effectivePayerType,     // ← "Sender" для онлайн-оплаты
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
