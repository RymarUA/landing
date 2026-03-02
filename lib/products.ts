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
    badge: "Хіт",
    badgeColor: "bg-orange-500",
    sizes: ["36", "37", "38", "39", "40"],
    rating: 4.9,
    reviews: 48,
    stock: 3,
    description: "Легкі та зручні кросівки Nike Air — репліка преміум-якості. Дихаюча сітка, амортизуюча підошва. Ідеально для щоденного носіння та спорту.",
    isHit: true,
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
    badgeColor: "bg-orange-400",
    sizes: ["36", "37", "38", "39"],
    rating: 4.8,
    reviews: 32,
    stock: 7,
    description: "Стильні жіночі кросівки Adidas Ultraboost з покращеною підошвою Boost. Максимальний комфорт при ходьбі та бігу.",
    isNew: true,
  },
  {
    id: 9,
    slug: "dytyachyi-kostyum-92",
    name: "Дитячий костюм (зріст 92)",
    category: "Для дітей",
    price: 420,
    oldPrice: 580,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
    badge: "Знижка",
    badgeColor: "bg-amber-500",
    sizes: ["86", "92", "98", "104"],
    rating: 4.7,
    reviews: 19,
    stock: 5,
    description: "М'який та приємний до тіла дитячий костюм з гіпоалергенних матеріалів. Зручний крій, еластичний пояс. Безпечні барвники.",
    isNew: true,
  },
  {
    id: 3,
    slug: "nabir-ihrashok-montessori",
    name: "Набір іграшок Монтессорі",
    category: "Іграшки",
    price: 320,
    oldPrice: 450,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
    badge: "Знижка",
    badgeColor: "bg-amber-500",
    sizes: [],
    rating: 5.0,
    reviews: 61,
    stock: 12,
    description: "Розвиваючий набір іграшок у стилі Монтессорі. Розвиває дрібну моторику, логічне мислення та творчість. Вік 1–4 роки.",
    isHit: true,
  },
  {
    id: 4,
    slug: "myaka-ihrashka-vedmedyk",
    name: "М'яка іграшка Ведмедик",
    category: "Іграшки",
    price: 180,
    oldPrice: null,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
    badge: null,
    badgeColor: "",
    sizes: [],
    rating: 4.6,
    reviews: 14,
    stock: 20,
    description: "Пухнастий плюшевий ведмедик — ідеальний подарунок для дитини. М'яке наповнення, безпечні матеріали, можна прати.",
  },
  {
    id: 5,
    slug: "orhanayzer-dlya-domu",
    name: "Органайзер для дому",
    category: "Дім",
    price: 145,
    oldPrice: null,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177786810-home-accessories",
    badge: null,
    badgeColor: "",
    sizes: [],
    rating: 4.5,
    reviews: 27,
    stock: 15,
    description: "Стильний і функціональний органайзер для дому. Компактний дизайн, 6 відділень. Підходить для кухні, ванної чи офісу.",
    isNew: true,
  },
  {
    id: 6,
    slug: "dekoratyvni-svichky",
    name: "Декоративні свічки (набір)",
    category: "Дім",
    price: 210,
    oldPrice: 280,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177786810-home-accessories",
    badge: "Знижка",
    badgeColor: "bg-amber-500",
    sizes: [],
    rating: 4.8,
    reviews: 33,
    stock: 8,
    description: "Набір із 6 ароматичних декоративних свічок. Аромати: ваніль, сандалове дерево, лаванда. Час горіння — до 30 год.",
    isHit: true,
  },
  {
    id: 7,
    slug: "trymach-dlya-telefonu-avto",
    name: "Тримач для телефону в авто",
    category: "Авто",
    price: 195,
    oldPrice: null,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177787276-auto-accessories",
    badge: "Топ",
    badgeColor: "bg-orange-500",
    sizes: [],
    rating: 4.9,
    reviews: 72,
    stock: 4,
    description: "Магнітний тримач для телефону на дефлектор або лобове скло. Сумісний з усіма смартфонами. Надійна фіксація.",
    isHit: true,
  },
  {
    id: 8,
    slug: "aromatyzator-avto",
    name: "Ароматизатор для авто",
    category: "Авто",
    price: 120,
    oldPrice: null,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177787276-auto-accessories",
    badge: null,
    badgeColor: "",
    sizes: [],
    rating: 4.4,
    reviews: 18,
    stock: 30,
    description: "Стильний ароматизатор для авто на дефлектор. Доступні аромати: New Car, Ocean, Vanilla. Тривалість дії — 2–3 місяці.",
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
