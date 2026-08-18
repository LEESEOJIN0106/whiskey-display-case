export type WhiskyFlavorCategory = {
  id: string;
  label: string;
  tags: string[];
};

/** 테이스팅 노트용 맛/향 카테고리 */
export const WHISKY_FLAVOR_CATEGORIES: WhiskyFlavorCategory[] = [
  {
    id: "smoke-peat",
    label: "스모크 · 피트",
    tags: ["Peat", "Smoke", "Ash", "Medicinal", "Iodine", "Tar"],
  },
  {
    id: "wood-oak",
    label: "오크 · 나무",
    tags: ["Oak", "Cedar", "Sawdust", "Charred Wood", "Barrel"],
  },
  {
    id: "sweet",
    label: "단맛",
    tags: ["Vanilla", "Honey", "Caramel", "Toffee", "Chocolate", "Maple", "Butterscotch"],
  },
  {
    id: "fruit",
    label: "과일",
    tags: [
      "Fruit",
      "Citrus",
      "Apple",
      "Pear",
      "Cherry",
      "Berry",
      "Dried Fruit",
      "Tropical",
    ],
  },
  {
    id: "spice",
    label: "향신료",
    tags: ["Spice", "Cinnamon", "Pepper", "Clove", "Ginger", "Nutmeg"],
  },
  {
    id: "floral",
    label: "꽃 · 허브",
    tags: ["Floral", "Heather", "Grass", "Mint", "Herbal"],
  },
  {
    id: "other",
    label: "그 외",
    tags: ["Malt", "Nuts", "Coffee", "Leather", "Brine", "Creamy", "Oily"],
  },
];

/** 카테고리 없이 쓸 flat 태그 목록 */
export const WHISKY_FLAVOR_TAGS: string[] = WHISKY_FLAVOR_CATEGORIES.flatMap(
  (category) => category.tags
);
