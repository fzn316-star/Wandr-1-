import { Destination, MoodTile } from '@/types';
import { INDIA_DESTINATIONS } from './indiaDestinations';

export const MOCK_MOOD_TILES: MoodTile[] = [
  {
    id: 'wild_untamed',
    emoji: '🏔️',
    label: 'Wild & Untamed',
    tagline: 'Rugged peaks, high passes, and open skies',
    category: 'Nature',
    bgGradient: 'from-emerald-900/80 via-teal-900/60 to-slate-900',
  },
  {
    id: 'culture_cuisine',
    emoji: '🍷',
    label: 'Culture & Cuisine',
    tagline: 'Old quarters, spice markets, local feasts',
    category: 'Food',
    bgGradient: 'from-amber-900/80 via-rose-950/60 to-slate-900',
  },
  {
    id: 'sun_stillness',
    emoji: '🏖️',
    label: 'Sun & Stillness',
    tagline: 'Warm coastlines, calm water, total unplugging',
    category: 'Relaxation',
    bgGradient: 'from-sky-900/80 via-blue-950/60 to-slate-900',
  },
  {
    id: 'off_grid',
    emoji: '🎒',
    label: 'Off the Grid',
    tagline: 'Remote valleys, secret trails, no crowds',
    category: 'Adventure',
    bgGradient: 'from-indigo-900/80 via-purple-950/60 to-slate-900',
  },
  {
    id: 'urban_pulse',
    emoji: '🏙️',
    label: 'Urban Pulse',
    tagline: 'Night markets, architecture, underground art',
    category: 'City',
    bgGradient: 'from-violet-900/80 via-fuchsia-950/60 to-slate-900',
  },
  {
    id: 'slow_grounded',
    emoji: '🌿',
    label: 'Slow & Grounded',
    tagline: 'Wellness retreats, mountain air, quiet reflection',
    category: 'Wellness',
    bgGradient: 'from-green-900/80 via-emerald-950/60 to-slate-900',
  },
  {
    id: 'coastal_vibes',
    emoji: '⛵',
    label: 'Coastal Charm',
    tagline: 'Fishing villages, fresh seafood, harbour sunsets',
    category: 'Coast',
    bgGradient: 'from-cyan-900/80 via-blue-900/60 to-slate-900',
  },
  {
    id: 'ancient_wonders',
    emoji: '🏛️',
    label: 'Ancient Wonders',
    tagline: 'Ruins, temples, stories etched in stone',
    category: 'History',
    bgGradient: 'from-orange-900/80 via-amber-950/60 to-slate-900',
  },
];

export const MOCK_EXAMPLE_PROMPTS: string[] = [
  "I am completely burnt out after a rough quarter and just want to unplug in the mountains near good food.",
  "My partner and I want somewhere romantic but not cliché, with slow water, quiet evenings, and great local cooking.",
  "I'm planning a solo trip on a tight budget. I want vibrant street food, walkable old quarters, and zero tourist traps.",
  "Traveling with my spouse and 3-year-old. We need flat scenic walks, warm weather, and short transfers.",
];

// Layer 1 Knowledge Base. V1 scope is India-domestic (see docs/backend_plan_wandr_v1.md §0) —
// the three international records that used to live here (Azores, Puglia, Luang Prabang) were
// removed with that scope decision, along with the North-America-origin transit assumptions
// baked into every record's flight time.
export const MOCK_DESTINATIONS: Destination[] = [...INDIA_DESTINATIONS];
