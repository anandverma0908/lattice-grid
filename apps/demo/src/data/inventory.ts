// =============================================================================
//  Demo — inventory data  (5000 rows × 300 columns)
// =============================================================================

// export interface InventoryRow {
//   id: number;
//   product: string;
//   dc: string;
//   channel: number;
//   status: "active" | "low" | "out";

//   // d1 … d296 — date quantity columns
//    [key: string]: string | number;
//   // [key: `d${number}`]: number;
// }

export type InventoryRow = {
  id: number;
  product: string;
  dc: string;
  channel: number;
  status: "active" | "low" | "out";
} & Record<string, string | number>;

const PRODUCTS = [
  "0.6g Chilli Flakes Laminate 50×45mm",
  "1.2g Mixed Herbs Sachet 60×50mm",
  "2g Black Pepper Grind 45×40mm",
  "0.8g Oregano Foil 55×48mm",
  "1.5g Cinnamon Stick Wrap 70×60mm",
  "0.5g Cumin Seed Pack 42×38mm",
  "1.8g Turmeric Powder Sachet 65×55mm",
  "2.5g Garam Masala Laminate 72×60mm",
];

const DCS = [
  "Ahmedabad",
  "Bangalore",
  "Gr.Noida",
  "Guwahati",
  "Hyderabad",
  "Kolkata",
  "Lucknow DC",
  "Mohali",
  "Mumbai",
  "Nagpur",
  "Pune",
  "Chennai",
  "Jaipur",
  "Surat",
  "Patna",
  "Bhopal",
];

const STATUSES: InventoryRow["status"][] = [
  "active",
  "active",
  "active",
  "low",
  "out",
];

// Seeded PRNG so data is reproducible
function mkRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function generateInventoryData(n = 5000): InventoryRow[] {
  const rand = mkRand(42);
  const rows: InventoryRow[] = [];

  for (let i = 0; i < n; i++) {
    const row: InventoryRow = {
      id: i,
      product: PRODUCTS[i % PRODUCTS.length]!,
      dc: DCS[i % DCS.length]!,
      channel: (i % 3) + 1,
      status: STATUSES[Math.floor(rand() * STATUSES.length)]!,
    };
    // 296 date-quantity columns (d1 … d296)
    for (let d = 1; d <= 296; d++) {
      row[`d${d}`] = Math.floor(rand() * 80);
    }
    rows.push(row);
  }
  return rows;
}
