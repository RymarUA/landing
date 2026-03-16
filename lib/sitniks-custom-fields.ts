/**
 * Sitniks Custom Fields Integration
 * 
 * Управление кастомными полями клиентов для хранения:
 * - Wishlist
 * - Аналитики просмотров  
 * - Подписок на уведомления
 * - Истории активности
 */

export interface CustomField {
  id?: number;
  code: string;
  value: string;
  name?: string;
}

export interface CustomerActivity {
  wishlist: number[];
  lastViewed: number[];
  viewCount: number;
  categories: string[];
  priceRange: string;
  notifications: string[];
  lastActivity: string;
}

/**
 * Обновить активность клиента через comment поле
 */
export async function updateCustomerActivity(
  customerId: number,
  activity: CustomerActivity
): Promise<boolean> {
  try {
    console.log("[custom-fields] Updating activity for customer:", customerId, activity);
    
    // Получаем текущие данные клиента
    const currentClient = await getSitniksCustomer(customerId);
    if (!currentClient) {
      console.error("[custom-fields] Customer not found:", customerId);
      return false;
    }

    // Создаем JSON с активностью
    const activityJson = JSON.stringify(activity);
    
    // Используем customFields для хранения активности
    const customFields = [
      {
        id: 1, // Обязательное поле
        type: "text", // Правильный enum: ["text", "number", "boolean", "datetime", "select", "multiselect"]
        code: "customer_activity",
        name: "Customer Activity",
        value: activityJson,
        isRequired: false, // Правильное название поля
        model: "clients", // Обязательное поле: ["orders", "clients"]
        ordering: 1 // Обязательное поле
      }
    ];

    console.log("[custom-fields] Updating custom fields:", {
      customFields,
      activityJson
    });

    // Отправляем обновление через customFields
    const response = await sitniksRequest<any>(`/open-api/clients/${customerId}`, {
      method: "PUT",
      body: JSON.stringify({
        fullname: currentClient.fullname,
        email: currentClient.email,
        phone: currentClient.phone,
        customFields: customFields,
      }),
    });

    console.log("[custom-fields] Activity updated successfully via comment:", response);
    return true;
  } catch (error) {
    console.error("[custom-fields] Failed to update activity:", error);
    return false;
  }
}

/**
 * Получить активность клиента из comment поля
 */
export async function getCustomerActivity(customerId: number): Promise<CustomerActivity> {
  try {
    const client = await getSitniksCustomer(customerId);
    console.log(`[getCustomerActivity] Client data for ${customerId}:`, {
      id: client?.id,
      customFields: client?.customFields,
      customFieldsCount: client?.customFields?.length
    });
    
    if (!client || !client.customFields || client.customFields.length === 0) {
      console.log(`[getCustomerActivity] No client or custom fields found for ${customerId}`);
      return {
        wishlist: [],
        lastViewed: [],
        viewCount: 0,
        categories: [],
        priceRange: "",
        notifications: [],
        lastActivity: new Date().toISOString(),
      };
    }

    // Ищем custom field с кодом "customer_activity"
    const activityField = client.customFields.find(field => field.code === "customer_activity");
    
    if (!activityField || !activityField.value) {
      console.log(`[getCustomerActivity] No activity field found for ${customerId}`);
      return {
        wishlist: [],
        lastViewed: [],
        viewCount: 0,
        categories: [],
        priceRange: "",
        notifications: [],
        lastActivity: new Date().toISOString(),
      };
    }

    console.log(`[getCustomerActivity] Found activity field:`, activityField);
    const activityJson = activityField.value;
    
    try {
      const activity = JSON.parse(activityJson);
      return {
        wishlist: activity.wishlist || [],
        lastViewed: activity.lastViewed || [],
        viewCount: activity.viewCount || 0,
        categories: activity.categories || [],
        priceRange: activity.priceRange || "",
        notifications: activity.notifications || [],
        lastActivity: activity.lastActivity || new Date().toISOString(),
      };
    } catch (parseError) {
      console.error("[custom-fields] Failed to parse activity JSON:", parseError);
      return {
        wishlist: [],
        lastViewed: [],
        viewCount: 0,
        categories: [],
        priceRange: "",
        notifications: [],
        lastActivity: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error("[custom-fields] Failed to get activity:", error);
    return {
      wishlist: [],
      lastViewed: [],
      viewCount: 0,
      categories: [],
      priceRange: "",
      notifications: [],
      lastActivity: new Date().toISOString(),
    };
  }
}

/**
 * Добавить товар в wishlist
 */
export async function addToWishlist(customerId: number, productId: number): Promise<boolean> {
  const activity = await getCustomerActivity(customerId);
  const wishlist = [...new Set([...activity.wishlist, productId])]; // Уникальные значения
  
  const updatedActivity = {
    ...activity,
    wishlist,
    lastActivity: new Date().toISOString()
  };
  
  return await updateCustomerActivity(customerId, updatedActivity);
}

/**
 * Добавить просмотр товара
 */
export async function addProductView(customerId: number, productId: number, category: string, price: number): Promise<boolean> {
  const activity = await getCustomerActivity(customerId);
  
  // Обновляем последние просмотренные (максимум 10)
  const lastViewed = [productId, ...activity.lastViewed.filter(id => id !== productId)].slice(0, 10);
  
  // Обновляем категории
  const categories = [...new Set([...activity.categories, category])];
  
  // Обновляем диапазон цен
  const prices = activity.priceRange ? activity.priceRange.split("-").map(Number) : [0, 10000];
  const newPriceRange = [Math.min(prices[0], price), Math.max(prices[1], price)].join("-");
  
  const updatedActivity = {
    ...activity,
    lastViewed,
    viewCount: activity.viewCount + 1,
    categories,
    priceRange: newPriceRange,
    lastActivity: new Date().toISOString()
  };
  
  return await updateCustomerActivity(customerId, updatedActivity);
}

/**
 * Добавить подписку на уведомления
 */
export async function addNotificationSubscription(customerId: number, type: string): Promise<boolean> {
  const activity = await getCustomerActivity(customerId);
  const notifications = [...new Set([...activity.notifications, type])];
  
  const updatedActivity = {
    ...activity,
    notifications,
    lastActivity: new Date().toISOString()
  };
  
  return await updateCustomerActivity(customerId, updatedActivity);
}

// Импортируем sitniksRequest и getSitniksCustomer
import { sitniksRequest } from "./sitniks-customers";
import { getSitniksCustomer } from "./sitniks-customers";
