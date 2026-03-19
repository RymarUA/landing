// @ts-nocheck
import { getCatalogProducts } from "./instagram-catalog";

/**
 * Умная система подбора сопутствующих товаров
 * Предлагает дешевые товары с высокой вероятностью покупки
 */

export interface CrossSellProduct {
  id: number;
  name: string;
  price: number;
  oldPrice: number | null;
  image: string;
  category: string;
  rating: number;
  slug: string;
}

/**
 * Возвращает рекомендации дешевых товаров, которых нет в корзине
 * @param cartItems - товары в корзине
 * @param maxPrice - максимальная цена для рекомендаций (по умолчанию 500 грн)
 * @param limit - количество рекомендаций (по умолчанию 3)
 */
export async function getCrossSellRecommendations(
  cartItems: Array<{ id: number }>,
  maxPrice: number = 500,
  limit: number = 3
): Promise<CrossSellProduct[]> {
  try {
    const allProducts = await getCatalogProducts();
    console.log(`[cross-sell] Total products available: ${allProducts.length}`);
    
    // Если нет товаров, возвращаем пустой массив
    if (allProducts.length === 0) {
      return [];
    }
    
    // Получаем ID товаров, которые уже в корзине
    const cartItemIds = new Set(cartItems.map(item => item.id));
    console.log(`[cross-sell] Cart items to exclude: ${Array.from(cartItemIds).join(', ')}`);
    
    // Фильтруем товары:
    // 1. Цена не выше maxPrice
    // 2. Нет в корзине
    // 3. Есть в наличии
    // 4. Сортируем по рейтингу (сначала популярные)
    const affordableProducts = allProducts
      .filter(product => product.price <= maxPrice)
      .filter(product => !cartItemIds.has(product.id))
      .filter(product => product.stock > 0)
      .sort((a, b) => {
        // Приоритет: рейтинг > кол-во отзывов > цена (чем дешевле, тем лучше)
        const ratingDiff = b.rating - a.rating;
        if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
        
        const reviewsDiff = b.reviews - a.reviews;
        if (reviewsDiff !== 0) return reviewsDiff;
        
        return a.price - b.price; // дешевле сначала
      })
      .slice(0, limit);
    
    console.log(`[cross-sell] Found ${affordableProducts.length} recommendations under ${maxPrice} грн`);
    
    return affordableProducts.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      image: product.image,
      category: product.category,
      rating: product.rating,
      slug: product.slug,
    }));
  } catch {
    // Silent fail - return empty array
    return [];
  }
}

/**
 * Получает заголовок для блока рекомендаций в зависимости от цены
 */
export function getCrossSellTitle(maxPrice: number): string {
  if (maxPrice <= 300) {
    return "Недорогі товари, які часто купляють разом:";
  }
  if (maxPrice <= 500) {
    return "Популярні доповнення до вашого замовлення:";
  }
  return "З цим товаром також куплять:";
}

/**
 * Проверяет, является ли товар "выгодной покупкой"
 */
export function isGoodDeal(product: CrossSellProduct): boolean {
  return product.oldPrice !== null && product.oldPrice > product.price;
}

/**
 * Возвращает процент скидки для товара
 */
export function getDiscountPercentage(product: CrossSellProduct): number {
  if (!product.oldPrice) return 0;
  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
}
