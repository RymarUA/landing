export interface CatalogSearchProduct {
  id: number;
  name: string;
  category: string;
  description: string;
  image: string;
  price: number;
  oldPrice: number | null;
}
