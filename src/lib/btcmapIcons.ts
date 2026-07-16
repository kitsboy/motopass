import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  Briefcase,
  Car,
  Coffee,
  Dumbbell,
  Gem,
  GraduationCap,
  Home,
  Hotel,
  Laptop,
  MapPin,
  Pizza,
  Scissors,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Store,
  Utensils,
  UtensilsCrossed,
  Wine,
} from 'lucide-react'
import type { BtcMapPlace } from './btcmap'

export type BtcMapIconCategory = {
  id: string
  label: string
  icon: LucideIcon
}

const ICON_MAP: Record<string, BtcMapIconCategory> = {
  local_atm: { id: 'local_atm', label: 'ATM', icon: Banknote },
  storefront: { id: 'storefront', label: 'Store', icon: Store },
  restaurant: { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  lunch_dining: { id: 'lunch_dining', label: 'Dining', icon: Utensils },
  local_cafe: { id: 'local_cafe', label: 'Cafe', icon: Coffee },
  business: { id: 'business', label: 'Business', icon: Briefcase },
  currency_exchange: { id: 'currency_exchange', label: 'Exchange', icon: Banknote },
  local_mall: { id: 'local_mall', label: 'Mall', icon: ShoppingBag },
  hotel: { id: 'hotel', label: 'Hotel', icon: Hotel },
  content_cut: { id: 'content_cut', label: 'Salon', icon: Scissors },
  local_bar: { id: 'local_bar', label: 'Bar', icon: Wine },
  medical_services: { id: 'medical_services', label: 'Medical', icon: Stethoscope },
  computer: { id: 'computer', label: 'Tech', icon: Laptop },
  local_grocery_store: { id: 'local_grocery_store', label: 'Grocery', icon: ShoppingCart },
  fitness_center: { id: 'fitness_center', label: 'Fitness', icon: Dumbbell },
  local_pizza: { id: 'local_pizza', label: 'Pizza', icon: Pizza },
  directions_car: { id: 'directions_car', label: 'Auto', icon: Car },
  spa: { id: 'spa', label: 'Spa', icon: Sparkles },
  home: { id: 'home', label: 'Home', icon: Home },
  school: { id: 'school', label: 'School', icon: GraduationCap },
  diamond: { id: 'diamond', label: 'Jewelry', icon: Gem },
}

const FALLBACK: BtcMapIconCategory = { id: 'other', label: 'Other', icon: MapPin }

export function btcMapPlaceCategory(place: BtcMapPlace): BtcMapIconCategory {
  if (!place.icon) return FALLBACK
  return ICON_MAP[place.icon] ?? { ...FALLBACK, id: place.icon, label: place.icon.replace(/_/g, ' ') }
}

export function btcMapCategoryFilters(places: BtcMapPlace[]): BtcMapIconCategory[] {
  const counts = new Map<string, { cat: BtcMapIconCategory; count: number }>()
  for (const place of places) {
    const cat = btcMapPlaceCategory(place)
    const prev = counts.get(cat.id)
    counts.set(cat.id, { cat, count: (prev?.count ?? 0) + 1 })
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map(v => v.cat)
}

export function filterPlacesByCategory(places: BtcMapPlace[], categoryId: string | null): BtcMapPlace[] {
  if (!categoryId) return places
  return places.filter(p => btcMapPlaceCategory(p).id === categoryId)
}