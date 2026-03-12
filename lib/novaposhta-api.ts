/**
 * lib/novaposhta-api.ts
 * 
 * API utilities for Nova Poshta integration.
 * Centralized functions for city and warehouse lookups.
 */

interface NPCity {
  Ref: string;
  Description: string;
  DescriptionRu?: string;
  Area?: string;
}

interface NPWarehouse {
  Ref: string;
  Description: string;
  Number?: string;
  CityRef?: string;
}

interface NPResponse<T> {
  success: boolean;
  data: T[];
  errors?: string[];
  warnings?: string[];
  info?: string[];
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
    const res = await fetch("/api/novaposhta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelName: "Address",
        calledMethod: "getCities",
        methodProperties: { 
          FindByString: query, 
          Limit: String(limit) 
        },
      }),
    });

    if (!res.ok) {
      console.error("[NP API] Cities fetch failed:", res.status);
      return [];
    }

    const json: NPResponse<NPCity> = await res.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error("[NP API] Cities fetch error:", error);
    return [];
  }
}

/**
 * Fetches warehouses (departments/post offices) for a specific city.
 * 
 * @param cityRef - Nova Poshta city reference ID
 * @param query - Optional search string to filter warehouses
 * @param limit - Maximum number of results (default: 50)
 * @returns Array of warehouses in the specified city
 */
export async function fetchNPWarehouses(
  cityRef: string,
  query: string = "",
  limit: number = 50
): Promise<NPWarehouse[]> {
  if (!cityRef) {
    return [];
  }

  try {
    const res = await fetch("/api/novaposhta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelName: "Address",
        calledMethod: "getWarehouses",
        methodProperties: { 
          CityRef: cityRef, 
          FindByString: query,
          Limit: String(limit) 
        },
      }),
    });

    if (!res.ok) {
      console.error("[NP API] Warehouses fetch failed:", res.status);
      return [];
    }

    const json: NPResponse<NPWarehouse> = await res.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error("[NP API] Warehouses fetch error:", error);
    return [];
  }
}

/**
 * Quick city lookup for predefined popular cities.
 * Useful for "quick select" buttons.
 * 
 * @param cityName - Exact city name (e.g., "Київ", "Одеса")
 * @returns City object if found, null otherwise
 */
export async function findCityByName(cityName: string): Promise<NPCity | null> {
  const cities = await fetchNPCities(cityName, 5);
  
  // Find exact match or closest match
  const exact = cities.find(
    (c) => c.Description === cityName || c.Description?.startsWith(cityName)
  );
  
  return exact || cities[0] || null;
}
