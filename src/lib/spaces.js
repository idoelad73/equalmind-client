import { Briefcase, ShoppingBag, Users } from 'lucide-react'

/**
 * The three spaces a report can belong to. Ordered as the user reads them,
 * right to left. `key` is what appears in the URL and in the database;
 * `possessive` is the wizard heading, which needs the definite article.
 */
export const SPACES = [
  {
    key: 'work',
    possessive: 'במרחב העבודה שלי',
    label: 'מרחב עבודה',
    description: 'התנהגויות במקום העבודה',
    icon: Briefcase,
    tone: 'work',
  },
  {
    key: 'community',
    possessive: 'במרחב הקהילה שלי',
    label: 'מרחב קהילה',
    description: 'התנהגויות במרחב הציבורי',
    icon: Users,
    tone: 'community',
  },
  {
    key: 'consumption',
    possessive: 'במרחב הצריכה שלי',
    label: 'מרחב צריכה',
    description: 'חוויות עם עסקים',
    icon: ShoppingBag,
    tone: 'consumption',
  },
]

/** Static class strings so Tailwind's scanner can see every variant. */
export const SPACE_TONES = {
  work: {
    tile: 'bg-sky-100 text-sky-700',
    hover: 'hover:border-sky-300 hover:bg-sky-50/40',
  },
  community: {
    tile: 'bg-emerald-100 text-emerald-700',
    hover: 'hover:border-emerald-300 hover:bg-emerald-50/40',
  },
  consumption: {
    tile: 'bg-violet-100 text-violet-700',
    hover: 'hover:border-violet-300 hover:bg-violet-50/40',
  },
}

export const findSpace = (key) => SPACES.find((space) => space.key === key)
