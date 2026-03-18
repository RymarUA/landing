import type { CatalogProduct } from "@/lib/instagram-catalog";

export type FeaturedProduct = Pick<
  CatalogProduct,
  | "id"
  | "name"
  | "price"
  | "oldPrice"
  | "rating"
  | "reviews"
  | "image"
  | "stock"
  | "sizes"
  | "isHit"
  | "isNew"
  | "freeShipping"
  | "badge"
  | "badgeColor"
>;
