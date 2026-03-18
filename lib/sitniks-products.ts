/**
 * lib/sitniks-products.ts
 *
 * Integration with Sitniks CRM for product management
 * Handles product creation, updates, and variations
 */

import { sitniksSafe } from "./sitniks-consolidated";

export interface CreateProductDto {
  title: string;
  name?: string;
  description?: string;
  price: number;
  costPrice: number;
  weight?: number;
  sku: string;
  barcode?: string;
  isActive?: boolean;
  category?: string;
  variations?: Array<{
    sku: string;
    barcode?: string;
    price: number;
    costPrice: number;
    weight?: number;
    isActive?: boolean;
    properties?: Array<{
      name: string;
      value: string;
    }>;
    warehouseQuantities?: Array<{
      id: number;
      quantity: number;
      stockQuantity: number;
      availableQuantity: number;
      reserveQuantity: number;
      deliveryQuantity: number;
      warehouse: {
        id: number;
        name: string;
      };
    }>;
  }>;
  warehouseQuantities?: Array<{
    id: number;
    quantity: number;
    stockQuantity: number;
    availableQuantity: number;
    reserveQuantity: number;
    deliveryQuantity: number;
    warehouse: {
      id: number;
      name: string;
    };
  }>;
}

export interface SitniksProduct {
  id: number;
  title: string;
  name?: string;
  sku?: string;
  description?: string;
  price: number;
  costPrice: number;
  weight?: number;
  barcode?: string;
  isActive: boolean;
  category?: { id: number; title: string };
  variations?: Array<{
    id: number;
    sku?: string;
    isActive: boolean;
    barcode?: string;
    price: number;
    costPrice: number;
    weight?: number;
    properties: Array<{
      id: number;
      name: string;
      value: string;
    }>;
    warehouseQuantities: Array<{
      id: number;
      quantity: number;
      stockQuantity: number;
      availableQuantity: number;
      reserveQuantity: number;
      deliveryQuantity: number;
      warehouse: { id: number; name: string };
    }>;
  }>;
  warehouseQuantities: Array<{
    id: number;
    quantity: number;
    stockQuantity: number;
    availableQuantity: number;
    reserveQuantity: number;
    deliveryQuantity: number;
    warehouse: { id: number; name: string };
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new product in Sitniks CRM
 */
export async function createSitniksProduct(productData: CreateProductDto): Promise<SitniksProduct | null> {
  try {
    console.log("[sitniks-products] Creating product:", JSON.stringify(productData, null, 2));
    
    const result = await sitniksSafe<SitniksProduct>("POST", "/open-api/products", productData);
    
    if (result) {
      console.log("[sitniks-products] Product created successfully:", result.id);
      return result;
    } else {
      console.error("[sitniks-products] Failed to create product");
      return null;
    }
  } catch (error) {
    console.error("[sitniks-products] Error creating product:", error);
    return null;
  }
}

/**
 * Update an existing product in Sitniks CRM
 */
export async function updateSitniksProduct(
  productId: number, 
  productData: Partial<CreateProductDto>
): Promise<SitniksProduct | null> {
  try {
    console.log(`[sitniks-products] Updating product ${productId}:`, JSON.stringify(productData, null, 2));
    
    const result = await sitniksSafe<SitniksProduct>("PATCH", `/open-api/products/${productId}`, productData);
    
    if (result) {
      console.log("[sitniks-products] Product updated successfully:", result.id);
      return result;
    } else {
      console.error("[sitniks-products] Failed to update product");
      return null;
    }
  } catch (error) {
    console.error("[sitniks-products] Error updating product:", error);
    return null;
  }
}

/**
 * Get product by ID from Sitniks CRM
 */
export async function getSitniksProduct(productId: number): Promise<SitniksProduct | null> {
  try {
    const result = await sitniksSafe<SitniksProduct>("GET", `/open-api/products/${productId}`);
    return result;
  } catch (error) {
    console.error("[sitniks-products] Error fetching product:", error);
    return null;
  }
}

/**
 * Get all products from Sitniks CRM
 */
export async function getAllSitniksProducts(options?: {
  limit?: number;
  skip?: number;
  categoryIds?: number[];
  query?: string;
}): Promise<{ data: SitniksProduct[]; total: number } | null> {
  try {
    const params = new URLSearchParams({
      limit: String(options?.limit ?? 50),
      skip: String(options?.skip ?? 0),
      ...(options?.categoryIds?.length ? { categoryIds: options.categoryIds.join(",") } : {}),
      ...(options?.query ? { query: options.query } : {}),
    });

    const result = await sitniksSafe<{ data: SitniksProduct[]; total: number }>(
      "GET", 
      `/open-api/products?${params}`
    );
    
    return result;
  } catch (error) {
    console.error("[sitniks-products] Error fetching products:", error);
    return null;
  }
}

/**
 * Delete a product from Sitniks CRM
 */
export async function deleteSitniksProduct(productId: number): Promise<boolean> {
  try {
    const result = await sitniksSafe<null>("DELETE", `/open-api/products/${productId}`);
    return result !== null;
  } catch (error) {
    console.error("[sitniks-products] Error deleting product:", error);
    return false;
  }
}

/**
 * Get product categories from Sitniks CRM
 */
export async function getSitniksProductCategories(): Promise<Array<{ id: number; title: string }> | null> {
  try {
    const result = await sitniksSafe<Array<{ id: number; title: string }>>("GET", "/open-api/products/categories");
    return result;
  } catch (error) {
    console.error("[sitniks-products] Error fetching categories:", error);
    return null;
  }
}

/**
 * Helper function to generate SKU based on name and variations
 */
export function generateSKU(baseName: string, variation?: { size?: string; color?: string }): string {
  const cleanName = baseName
    .toUpperCase()
    .replace(/[^A-ZА-Я0-9]/g, '')
    .slice(0, 10);
  
  const variationSuffix = variation ? [
    variation.size?.toUpperCase(),
    variation.color?.toUpperCase().slice(0, 3)
  ].filter(Boolean).join('-') : '';
  
  const base = cleanName || 'PRODUCT';
  const suffix = variationSuffix ? `-${variationSuffix}` : '';
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${base}${suffix}-${random}`;
}

/**
 * Helper function to validate product data
 */
export function validateProductData(data: CreateProductDto): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.title?.trim()) {
    errors.push("Назва товару обов'язкова");
  }
  
  if (!data.sku?.trim()) {
    errors.push("SKU обов'язковий");
  }
  
  if (data.price <= 0) {
    errors.push("Ціна повинна бути більше 0");
  }
  
  if (data.costPrice < 0) {
    errors.push("Ціна закупівлі не може бути від'ємною");
  }
  
  if (data.weight && data.weight < 0) {
    errors.push("Вага не може бути від'ємною");
  }
  
  // Validate variations if present
  if (data.variations && data.variations.length > 0) {
    data.variations.forEach((variation, index) => {
      if (!variation.sku?.trim()) {
        errors.push(`SKU варіації ${index + 1} обов'язковий`);
      }
      
      if (variation.price <= 0) {
        errors.push(`Ціна варіації ${index + 1} повинна бути більше 0`);
      }
      
      if (variation.costPrice < 0) {
        errors.push(`Ціна закупівлі варіації ${index + 1} не може бути від'ємною`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
