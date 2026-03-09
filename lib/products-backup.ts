/**
 * Product data layer
 *
 * Currently uses static data. To switch to a real Supabase query:
 *   1. npm install @supabase/supabase-js
 *   2. Replace the static array with: const { data } = await supabase.from("products").select("*")
 *   3. This file is imported only by Server Components → zero JS sent to browser
 */

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  image: string;
  badge: string | null;
  badgeColor: string;
  sizes: string[];
  rating: number;
  reviews: number;
  /** Live stock — fetch from DB in production to prevent overselling */
  stock: number;
  description: string;
  isNew?: boolean;
  isHit?: boolean;
  slug: string;
};

/* ─── Static catalogue (replace with DB query in production) ─────── */
const STATIC_PRODUCTS: Product[] = [
  {
    id: 1,
    slug: "nike-air-replica",
    name: "Кросівки Nike Air (репліка)",
    category: "Для чоловіків",
    price: 1200,
    oldPrice: 1800,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
    badge: "ХІТ",
    badgeColor: "bg-amber-400 text-gray-900",
    sizes: ["40", "41", "42", "43"],
    rating: 4.8,
    reviews: 48,
    stock: 6,
    description: "Легкі кросівки з амортизацією Air Max для щоденного використання.",
    isHit: true,
    isNew: false,
  },
  {
    id: 2,
    slug: "adidas-ultraboost",
    name: "Кросівки Adidas Ultraboost",
    category: "Для жінок",
    price: 950,
    oldPrice: null,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
    badge: "Новинка",
    badgeColor: "bg-orange-500 text-white",
    sizes: ["36", "37", "38", "39"],
    rating: 4.6,
    reviews: 32,
    stock: 12,
    description: "Комфортні кросівки з підошвою Boost для активних прогулянок.",
    isHit: false,
    isNew: true,
  },
  {
    id: 3,
    slug: "kids-cozy-set",
    name: "Дитячий костюм (зріст 92)",
    category: "Для дітей",
    price: 420,
    oldPrice: 580,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
    badge: "Акція",
    badgeColor: "bg-purple-500 text-white",
    sizes: ["86", "92", "98", "104"],
    rating: 4.9,
    reviews: 19,
    stock: 5,
    description: "М'який трикотажний костюм для малюків з приємної до тіла тканини.",
    isHit: false,
    isNew: true,
  },
];

/* ─── Public API ─────────────────────────────────── */

/** Returns all products. In production — replace with Supabase query. */
export async function getAllProducts(): Promise<Product[]> {
  // Example Supabase implementation:
  // const { data, error } = await supabase.from("products").select("*").order("id");
  // if (error) throw error;
  // return data ?? [];
  return STATIC_PRODUCTS;
}

/** Returns a single product by id, or null if not found. */
export async function getProductById(id: number): Promise<Product | null> {
  return STATIC_PRODUCTS.find((p) => p.id === id) ?? null;
}

/** Returns a single product by slug, or null if not found. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return STATIC_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

/** Returns all unique category names. */
export async function getCategories(): Promise<string[]> {
  const cats = new Set(STATIC_PRODUCTS.map((p) => p.category));
  return ["Всі", ...Array.from(cats)];
}
