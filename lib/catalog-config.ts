export const ALL_CATEGORIES = [
  "Всі",
  "Для чоловіків",
  "Для жінок",
  "Для дітей",
  "Іграшки",
  "Дім",
  "Авто",
] as const;

export type SortKey = "default" | "price_asc" | "price_desc" | "rating" | "newest";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "За замовчуванням" },
  { value: "newest", label: "Спочатку нові" },
  { value: "price_asc", label: "Від дешевих" },
  { value: "price_desc", label: "Від дорогих" },
  { value: "rating", label: "За рейтингом" },
];
