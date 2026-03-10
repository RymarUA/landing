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
    name: "˳��������� ������� ��� ����� �������",
    category: "˳������� �������",
    price: 289,
    oldPrice: 349,
    image: "/images/placeholder.svg",
    badge: "ղ�",
    badgeColor: "bg-amber-400 text-gray-900",
    sizes: [],
    rating: 4.8,
    reviews: 128,
    stock: 46,
    description: "�������� ������� ��� ���� ����� �� �������� � ������������ �����������.",
    isHit: true,
    slug: "plastyri-spyna-drakon",
  },
  {
    id: 1002,
    name: "������� ��� ���� � �������",
    category: "˳������� �������",
    price: 239,
    oldPrice: 299,
    image: "/images/placeholder.svg",
    badge: "�������",
    badgeColor: "bg-orange-500 text-white",
    sizes: [],
    rating: 4.7,
    reviews: 64,
    stock: 38,
    description: "���������� ����������� � ��������, ��������� �����.",
    isNew: true,
    slug: "plastyri-kolina-travy",
  },
  {
    id: 1003,
    name: "��������� ����������� � ���������",
    category: "������ �� ������",
    price: 490,
    oldPrice: 590,
    image: "/images/placeholder.svg",
    badge: "ղ�",
    badgeColor: "bg-amber-400 text-gray-900",
    sizes: ["S", "M", "L", "XL"],
    rating: 4.6,
    reviews: 92,
    stock: 27,
    description: "���������� �������� ��� ������� ����� �� ��� �����������.",
    isHit: true,
    slug: "nakolinnuk-kompresiynyi",
  },
  {
    id: 1004,
    name: "������ ����������� ���������",
    category: "������ �� ������",
    price: 680,
    oldPrice: 790,
    image: "/images/placeholder.svg",
    badge: null,
    badgeColor: "",
    sizes: ["M", "L", "XL"],
    rating: 4.5,
    reviews: 41,
    stock: 18,
    description: "̒��� �������� �������� � ������� ���������� �����.",
    slug: "bandazh-poperek",
  },
  {
    id: 1005,
    name: "������� ��� �� 3D",
    category: "��������",
    price: 1290,
    oldPrice: 1490,
    image: "/images/placeholder.svg",
    badge: "ղ�",
    badgeColor: "bg-amber-400 text-gray-900",
    sizes: [],
    rating: 4.9,
    reviews: 214,
    stock: 22,
    description: "����������� ������� ��� ��������� ������������ ���� ��.",
    isHit: true,
    slug: "masazher-shyia-3d",
  },
  {
    id: 1006,
    name: "������� ��� ���� ���������",
    category: "��������",
    price: 540,
    oldPrice: 650,
    image: "/images/placeholder.svg",
    badge: null,
    badgeColor: "",
    sizes: [],
    rating: 4.4,
    reviews: 58,
    stock: 33,
    description: "���������� ��������� ������� ��� ������ ����� ��.",
    slug: "masazher-stop-rol",
  },
  {
    id: 1007,
    name: "���� ��� ������� � �����������",
    category: "��� �� �����",
    price: 319,
    oldPrice: 399,
    image: "/images/placeholder.svg",
    badge: "�������",
    badgeColor: "bg-orange-500 text-white",
    sizes: [],
    rating: 4.6,
    reviews: 73,
    stock: 50,
    description: "���������� ���� � ����������� �� ���������� �����������.",
    isNew: true,
    slug: "krem-glukozamin",
  },
  {
    id: 1008,
    name: "���� ��� ������� � ������ ���",
    category: "��� �� �����",
    price: 299,
    oldPrice: 359,
    image: "/images/placeholder.svg",
    badge: null,
    badgeColor: "",
    sizes: [],
    rating: 4.5,
    reviews: 36,
    stock: 42,
    description: "��������� �� ������ ����, ������� ������� � ��������.",
    slug: "maz-emus-oil",
  },
  {
    id: 1009,
    name: "����������� ������� � ������� �����",
    category: "���������� �������",
    price: 990,
    oldPrice: 1190,
    image: "/images/placeholder.svg",
    badge: "ղ�",
    badgeColor: "bg-amber-400 text-gray-900",
    sizes: [],
    rating: 4.8,
    reviews: 154,
    stock: 26,
    description: "��������� ��������� �� �� ������ �� ��� ���.",
    isHit: true,
    slug: "ortopodushka-memory",
  },
  {
    id: 1010,
    name: "�������� ������� ��� �����",
    category: "��������� �������",
    price: 560,
    oldPrice: 690,
    image: "/images/placeholder.svg",
    badge: null,
    badgeColor: "",
    sizes: ["S", "M", "L"],
    rating: 4.3,
    reviews: 29,
    stock: 31,
    description: "̒��� ����������� ������� �� �������� �����.",
    slug: "korektor-postavy",
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
  return ["��", ...Array.from(cats)];
}

/** Legacy compatibility exports */
export const CATALOG_PRODUCTS = STATIC_PRODUCTS;
export const getCatalogProducts = getAllProducts;
export const getCatalogProductById = getProductById;

