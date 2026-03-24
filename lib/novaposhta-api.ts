/**
 * lib/novaposhta-api.ts
 * 
 * API utilities for Nova Poshta integration.
 * Centralized functions for city, warehouse lookups, and tracking.
 */

export interface NPCity {
  Ref: string;
  Description: string;
  DescriptionRu?: string;
  Area?: string;
}

export interface NPWarehouse {
  Ref: string;
  SiteKey: string;
  Description: string;
  DescriptionRu?: string;
  ShortAddress?: string;
  Phone?: string;
  TypeOfWarehouse?: string;
  Number?: string;
  CityRef: string;
  CityDescription?: string;
  MaxWeightAllowed?: string;
  Schedule?: Record<string, string>;
  PostFinance?: string;
  BicycleParking?: string;
  PaymentAccess?: string;
  POSTerminal?: string;
  InternationalShipping?: string;
  SelfServiceWorkplacesCount?: string;
  DistrictCode?: string; // Added for proper WarehouseIndex format (e.g., "55/52")
  TotalMaxWeightAllowed?: string;
  PlaceMaxWeightAllowed?: string;
  Dimensions?: {
    width: string;
    height: string;
    length: string;
  };
  Reception?: Record<string, string>;
  Delivery?: Record<string, string>;
  WorkInMobileAwis?: string;
  CategoryOfWarehouse?: string;
  Direct?: string;
  RegionCity?: string;
  WarehouseForAgent?: string;
  GeneratorEnabled?: string;
  MaxDeclaredCost?: string;
  CanGetMoneyTransfer?: string;
  HasMirror?: string;
  HasFittingRoom?: string;
  OnlyReceivingParcel?: string;
  PostMachineType?: string;
  PostalCodeUA?: string;
  WarehouseIndex?: string;
  BeaconCode?: string;
  Location?: string;
  WarehouseStatus?: string;
  WarehouseStatusDate?: string;
  WarehouseIllusha?: string;
  DenyToSelect?: string;
  SettlementRef?: string;
  SettlementDescription?: string;
  SettlementAreaDescription?: string;
  SettlementRegionsDescription?: string;
  SettlementTypeDescription?: string;
  Longitude?: string;
  Latitude?: string;
  SendingLimitationsOnDimensions?: {
    Width: number;
    Height: number;
    Length: number;
  };
  ReceivingLimitationsOnDimensions?: {
    Width: number;
    Height: number;
    Length: number;
  };
}

export interface NPTrackingStatus {
  Status?: string;
  StatusDescription?: string;
  WarehouseRecipient?: string;
  RecipientDateTime?: string;
  TrackingHistory?: Array<{
    DateTime?: string;
    StatusDescription?: string;
  }>;
}

interface NPResponse<T> {
  success: boolean;
  data: T[];
  errors?: string[];
  warnings?: string[];
  info?: string[];
}

/**
 * Generic Nova Poshta API proxy function
 * Provides universal access to NP API with validation
 */
async function callNovaPoshtaAPI<T>(requestData: {
  modelName: string;
  calledMethod: string;
  methodProperties?: Record<string, unknown>;
}): Promise<NPResponse<T>> {
  // Validate request body
  if (!requestData.modelName || typeof requestData.modelName !== "string") {
    throw new Error("modelName is required and must be a string");
  }
  if (!requestData.calledMethod || typeof requestData.calledMethod !== "string") {
    throw new Error("calledMethod is required and must be a string");
  }

  try {
    // CRITICAL: Always use direct Nova Poshta API to avoid internal route issues
    const apiUrl = 'https://api.novaposhta.ua/v2.0/json/';
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: process.env.NOVAPOSHTA_API_KEY,
        modelName: requestData.modelName,
        calledMethod: requestData.calledMethod,
        methodProperties: requestData.methodProperties,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Nova Poshta API error: ${response.status} - ${errorText}`);
    }

    const json: NPResponse<T> = await response.json();
    
    if (!json.success) {
      const errorMessage = json.errors?.join(', ') || 'Unknown API error';
      throw new Error(`Nova Poshta API failure: ${errorMessage}`);
    }
    
    return json;
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw our custom errors
      if (error.message.includes('Nova Poshta API')) {
        throw error;
      }
    }
    // Network or other errors
    throw new Error(`Failed to call Nova Poshta API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetches cities from Nova Poshta API based on search query.
 * 
 * @param query - Search string (minimum 2 characters)
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of cities matching the query
 */
export async function fetchNPCities(
  query: string,
  limit: number = 20
): Promise<NPCity[]> {
  if (query.length < 2) {
    return [];
  }

  try {
    const response = await callNovaPoshtaAPI<NPCity>({
      modelName: "Address",
      calledMethod: "getCities",
      methodProperties: { 
        FindByString: query, 
        Limit: String(limit) 
      },
    });
    
    return response.data || [];
  } catch (error) {
    console.error("[novaposhta] Failed to fetch cities:", error);
    return [];
  }
}

/**
 * Fetches warehouses (departments/post offices) for a specific city.
 * 
 * @param cityRef - Nova Poshta city reference ID
 * @param query - Optional search string to filter warehouses
 * @param limit - Maximum number of results (default: 500)
 * @returns Array of warehouses in the specified city
 */
export async function fetchNPWarehouses(
  cityRef: string,
  query: string = "",
  limit: number = 500
): Promise<NPWarehouse[]> {
  if (!cityRef) {
    return [];
  }

  try {
    const response = await callNovaPoshtaAPI<NPWarehouse>({
      modelName: "Address",
      calledMethod: "getWarehouses",
      methodProperties: { 
        CityRef: cityRef, 
        FindByString: query,
        Limit: String(limit) 
      },
    });
    
    return response.data || [];
  } catch (error) {
    console.error("[novaposhta] Failed to fetch warehouses:", error);
    return [];
  }
}

/**
 * Tracks a package by TTN (tracking number)
 * 
 * @param ttn - Tracking number (10-20 digits)
 * @returns Tracking status with history
 */
export async function trackNPPackage(ttn: string): Promise<{
  status: string;
  details: string;
  history: Array<{ date: string; event: string }>;
}> {
  const TTN_REGEX = /^\d{10,20}$/;
  
  if (!TTN_REGEX.test(ttn)) {
    throw new Error("Невірний номер ТТН. Тільки цифри, 10–20 символів.");
  }

  try {
    const response = await callNovaPoshtaAPI<NPTrackingStatus>({
      modelName: "TrackingDocument",
      calledMethod: "getStatusDocuments",
      methodProperties: {
        Documents: [{ DocumentNumber: ttn, Phone: "" }],
      },
    });

    if (!response.data?.length) {
      throw new Error("ТТН не знайдено");
    }

    const info = response.data[0];
    const status = info.StatusDescription ?? info.Status ?? "Статус невідомий";
    const details = [info.WarehouseRecipient, info.RecipientDateTime].filter(Boolean).join(" · ");
    const history = (info.TrackingHistory ?? []).map((h) => ({
      date: h.DateTime ?? "",
      event: h.StatusDescription ?? "",
    }));

    return { status, details, history };
  } catch (error) {
    console.error("[novaposhta] Failed to track package:", error);
    throw error;
  }
}

/**
 * Updates order status in Sitniks based on NP tracking
 * 
 * @param orderReference - Order reference number
 * @param ttn - TTN number
 * @param adminSecret - Admin secret for authorization
 */
export async function updateOrderShippingStatus(
  orderReference: string,
  ttn: string,
  adminSecret: string
): Promise<void> {
  try {
    const trackingInfo = await trackNPPackage(ttn);
    
    // Determine status based on tracking
    let status = "shipped";
    if (trackingInfo.status.toLowerCase().includes("доставлено")) {
      status = "delivered";
    } else if (trackingInfo.status.toLowerCase().includes("отримано")) {
      status = "delivered";
    }

    // Send shipping notification
    const response = await fetch("/api/notify-shipping", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": adminSecret,
      },
      body: JSON.stringify({
        orderReference,
        ttn,
        estimatedDate: trackingInfo.details,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update shipping status");
    }

    console.log(`[novaposhta] Updated order ${orderReference} status to ${status}`);
  } catch (error) {
    console.error("[novaposhta] Failed to update shipping status:", error);
    throw error;
  }
}

/**
 * Get comprehensive tracking information with automatic status updates
 * 
 * @param ttn - Tracking number
 * @param orderReference - Optional order reference for status updates
 * @param adminSecret - Optional admin secret for status updates
 */
export async function getComprehensiveTracking(
  ttn: string,
  orderReference?: string,
  adminSecret?: string
): Promise<{
  status: string;
  details: string;
  history: Array<{ date: string; event: string }>;
  autoUpdated?: boolean;
}> {
  const trackingInfo = await trackNPPackage(ttn);
  let autoUpdated = false;

  // If order reference and admin secret provided, try to update status
  if (orderReference && adminSecret) {
    try {
      await updateOrderShippingStatus(orderReference, ttn, adminSecret);
      autoUpdated = true;
    } catch (error) {
      console.warn("[novaposhta] Auto-update failed:", error);
    }
  }

  return {
    ...trackingInfo,
    autoUpdated,
  };
}

