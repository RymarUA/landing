// @ts-nocheck
/**
 * Product data layer
 *
 * Currently uses static data. To switch to a real Supabase query:
 *   1. npm install @supabase/supabase-js
 *   2. Replace the static array with: const { data } = await supabase.from("products").select("*")
 *   3. This file is imported only by Server Components > zero JS sent to browser
 */

export type Product = {
  id: number;
  variationId: number;
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
  /** Live stock � fetch from DB in production to prevent overselling */
  stock: number;
  description: string;
  isNew?: boolean;
  isHit?: boolean;
  slug: string;
};

/* -- Static catalogue (replace with DB query in production) ------------- */
const STATIC_PRODUCTS: Product[] = [
  {
    id: 1001,
    variationId: 1001,
    name: "Матча-еліксир для ранкового балансу",
    category: "Чаї та настої",
    price: 420,
    oldPrice: 490,
    image: "/images/placeholder.svg",
    badge: "Хіт",
    badgeColor: "bg-amber-400 text-gray-900",
    sizes: [],
    rating: 4.9,
    reviews: 132,
    stock: 40,
    description: "Порошок матча з жасмином та жіночим женьшенем для підтримки енергії та нервової системи.",
    isHit: true,
    slug: "matcha-balans",
  },
  {
    id: 1002,
    variationId: 1002,
    name: "Суміш Warm Tonic із гвоздикою",
    category: "Чаї та настої",
    price: 360,
    oldPrice: null,
    image: "/images/placeholder.svg",
    badge: "Новинка",
    badgeColor: "bg-orange-500 text-white",
    sizes: [],
    rating: 4.7,
    reviews: 58,
    stock: 55,
    description: "Прогріваючий напій із кардамоном та корицею для відновлення після тренувань і детоксу.",
    isNew: true,
    slug: "chai-warm-tonic",
  },
  {
    id: 1003,
    variationId: 1003,
    name: "Пластир «Нефритова спина»",
    category: "Зігріваючі пластирі",
    price: 310,
    oldPrice: 360,
    image: "/images/placeholder.svg",
    badge: "-15%",
    badgeColor: "bg-[#1F6B5E] text-white",
    sizes: [],
    rating: 4.8,
    reviews: 147,
    stock: 60,
    description: "Травʼяний пластир із капсаїцином для зняття напруги попереку та розслаблення мʼязів.",
    isHit: true,
    slug: "plastyr-nefryt",
  },
  {
    id: 1004,
    variationId: 1004,
    name: "Пластир для колін «Шовкова трава»",
    category: "Зігріваючі пластирі",
    price: 280,
    oldPrice: null,
    image: "/images/placeholder.svg",
    badge: null,
    badgeColor: "",
    sizes: [],
    rating: 4.6,
    reviews: 98,
    stock: 48,
    description: "Екстракти порії, імбиру та шафрану підтримують суглоби й забезпечують легкий прогрів.",
    slug: "plastyr-kolino",
  },
  {
    id: 1005,
    variationId: 1005,
    name: "Диффузор «Янтарний сад»",
    category: "Ароматерапія",
    price: 980,
    oldPrice: 1120,
    image: "/images/placeholder.svg",
    badge: "Преміум",
    badgeColor: "bg-purple-500 text-white",
    sizes: [],
    rating: 4.9,
    reviews: 84,
    stock: 24,
    description: "Скляний дифузор із сумішшю сандалу, янтарю та лемонграсу для кабінетів і спалень.",
    slug: "diffuzor-yantrynyi-sad",
  },
  {
    id: 1006,
    variationId: 1006,
    name: "Ортез «Лотос» для підтримки постави",
    category: "Ортези та підтримка",
    price: 890,
    oldPrice: 980,
    image: "/images/placeholder.svg",
    badge: null,
    badgeColor: "",
    sizes: ["S", "M", "L", "XL"],
    rating: 4.5,
    reviews: 61,
    stock: 30,
    description: "Двошаровий ортез із бамбуковим волокном для щоденної корекції постави та зменшення болю.",
    slug: "ortez-lotos",
  },
  {
    id: 1007,
    variationId: 1007,
    name: "Масажний рол для стоп «Сяюча точка»",
    category: "Ортези та підтримка",
    price: 540,
    oldPrice: 620,
    image: "/images/placeholder.svg",
    badge: null,
    badgeColor: "",
    sizes: [],
    rating: 4.4,
    reviews: 52,
    stock: 44,
    description: "Деревʼяний рол із нефритовими вставками для рефлексотерапії й домашніх процедур.",
    slug: "rol-syayucha-tochka",
  },
  {
    id: 1008,
    variationId: 1008,
    name: "Олія «Тепло Сходу»",
    category: "Масла і бальзами",
    price: 390,
    oldPrice: 450,
    image: "/images/placeholder.svg",
    badge: "Бестселлер",
    badgeColor: "bg-amber-400 text-gray-900",
    sizes: [],
    rating: 4.7,
    reviews: 120,
    stock: 70,
    description: "Суміш кунжутної олії, мирри та календули для масажу і швидкого відновлення шкіри.",
    slug: "oliya-teplo-shodu",
  },
  {
    id: 1009,
    variationId: 1009,
    name: "Дитячий сет «Спокійний сон»",
    category: "Дитячі протоколи",
    price: 760,
    oldPrice: null,
    image: "/images/placeholder.svg",
    badge: "Kids",
    badgeColor: "bg-sky-500 text-white",
    sizes: [],
    rating: 4.8,
    reviews: 43,
    stock: 28,
    description: "Чай з ромашкою, бальзам із лавандою та мʼяка маска для очей — для вечірніх ритуалів.",
    slug: "set-spokyinyi-son",
  },
  {
    id: 1010,
    variationId: 1010,
    name: "Подарунковий набір «Ранковий обряд»",
    category: "Подарункові сети",
    price: 1480,
    oldPrice: 1650,
    image: "/images/placeholder.svg",
    badge: "Gift",
    badgeColor: "bg-pink-500 text-white",
    sizes: [],
    rating: 4.9,
    reviews: 67,
    stock: 15,
    description: "У набір входять матча, нефритова гуаша, аромаолія та свічка з нотами цитрусу й білого чаю.",
    slug: "gift-morning-ritual",
  },
];

/* -- Public API -------------------------------------------------------- */

/** Returns all products. In production � replace with Supabase query. */
export async function getAllProducts(): Promise<Product[]> {
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


