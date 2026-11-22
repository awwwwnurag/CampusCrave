import mappingData from './outletMappingData.json';

export interface OutletMeta {
  id: string;
  name: string;
  icon: string;
  badge: string;
  color: string;
}

export const OUTLETS_LIST: OutletMeta[] = [
  { id: 'food-court', name: 'Food Court', icon: '🍲', badge: 'Main Canteen', color: 'from-orange-500 to-amber-500' },
  { id: 'basil', name: 'Basil', icon: '🍕', badge: 'Italian & Pizza', color: 'from-emerald-500 to-teal-600' },
  { id: 'ccd', name: 'Cafe Coffee Day', icon: '☕', badge: 'Brew & Frappe', color: 'from-amber-600 to-amber-800' },
  { id: 'subway', name: 'Subway', icon: '🥪', badge: 'Fresh Subs & Salads', color: 'from-green-600 to-yellow-500' },
  { id: 'ahaar-cafe', name: 'Ahaar Cafe', icon: '🍛', badge: 'North Indian Thali', color: 'from-orange-600 to-red-600' },
  { id: 'dice-n-sip', name: 'Dice n Sip', icon: '🎲', badge: 'Snacks & Gaming', color: 'from-indigo-500 to-purple-600' },
  { id: 'georgia', name: 'Georgia', icon: '🧋', badge: 'Beverages & Shakes', color: 'from-cyan-500 to-blue-600' },
  { id: 'uncles', name: "Uncle's Cafe", icon: '🍔', badge: 'Fast Food & Burgers', color: 'from-rose-500 to-pink-600' },
  { id: 'happiness-store', name: 'Happiness Store', icon: '🍫', badge: 'Quick Bites & Confectionery', color: 'from-yellow-500 to-amber-600' },
];

const DISH_LOOKUP: Record<string, { outletId: string; outletName: string }> = {};

// Populate case-insensitive lookup
Object.entries(mappingData).forEach(([dishName, meta]) => {
  DISH_LOOKUP[dishName.toLowerCase().trim()] = meta as { outletId: string; outletName: string };
});

export function getOutletForItem(
  dishName: string,
  explicitOutletId?: string,
  explicitOutletName?: string
): { outletId: string; outletName: string } {
  // If explicitly provided, use it
  if (explicitOutletId && explicitOutletName) {
    return { outletId: explicitOutletId, outletName: explicitOutletName };
  }

  const normalized = (dishName || '').toLowerCase().trim();

  // Exact match
  if (DISH_LOOKUP[normalized]) {
    return DISH_LOOKUP[normalized];
  }

  // Keyword / Substring heuristics
  if (normalized.includes('coffee') || normalized.includes('frappe') || normalized.includes('latte') || normalized.includes('cappuccino')) {
    return { outletId: 'ccd', outletName: 'Cafe Coffee Day' };
  }
  if (normalized.includes('sub') || normalized.includes('wrap') || normalized.includes('cookie') || normalized.includes('panini')) {
    return { outletId: 'subway', outletName: 'Subway' };
  }
  if (normalized.includes('pizza') || normalized.includes('pasta') || normalized.includes('garlic bread') || normalized.includes('lasagna')) {
    return { outletId: 'basil', outletName: 'Basil' };
  }
  if (normalized.includes('parantha') || normalized.includes('rajma') || normalized.includes('thali') || normalized.includes('chole bhature')) {
    return { outletId: 'ahaar-cafe', outletName: 'Ahaar Cafe' };
  }
  if (normalized.includes('shake') || normalized.includes('smoothie') || normalized.includes('mojito') || normalized.includes('iced tea')) {
    return { outletId: 'georgia', outletName: 'Georgia' };
  }
  if (normalized.includes('burger') || normalized.includes('fries') || normalized.includes('maggi') || normalized.includes('roll')) {
    return { outletId: 'uncles', outletName: "Uncle's Cafe" };
  }
  if (normalized.includes('dosa') || normalized.includes('idli') || normalized.includes('vada') || normalized.includes('sambar') || normalized.includes('biryani') || normalized.includes('paneer') || normalized.includes('roti') || normalized.includes('naan')) {
    return { outletId: 'food-court', outletName: 'Food Court' };
  }

  // Fallback to Food Court (Main Canteen)
  return { outletId: 'food-court', outletName: 'Food Court' };
}

export function getOutletMeta(outletId: string): OutletMeta {
  const found = OUTLETS_LIST.find(o => o.id === outletId);
  if (found) return found;
  return {
    id: outletId,
    name: outletId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: '🍽️',
    badge: 'Campus Outlet',
    color: 'from-blue-600 to-indigo-600',
  };
}
