export interface RABItem {
    name: string;
    category: string;
    quantity: number;
    price: string;
}

export const CATEGORIES = [
    "Elektronik",
    "Funitur",
    "Kendaraan",
    "Peralatan",
    "Software",
    "Lainnya"
] as const;

export type Category = typeof CATEGORIES[number];
