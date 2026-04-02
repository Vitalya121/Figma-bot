import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { templates } from './schema.js'

const DATABASE_URL = process.env.DATABASE_URL!
const client = postgres(DATABASE_URL)
const db = drizzle(client)

const TEMPLATES = [
  // Minimal
  {
    name: 'Чистый минимал',
    category: 'minimal' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_minimal_clean',
    isPro: false,
    sortOrder: 1,
  },
  {
    name: 'Светлый воздух',
    category: 'minimal' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_minimal_airy',
    isPro: false,
    sortOrder: 2,
  },
  {
    name: 'Mono Type',
    category: 'minimal' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_minimal_mono',
    isPro: true,
    sortOrder: 3,
  },
  // Vibrant
  {
    name: 'Яркий градиент',
    category: 'vibrant' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_vibrant_gradient',
    isPro: false,
    sortOrder: 4,
  },
  {
    name: 'Neon Nights',
    category: 'vibrant' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_vibrant_neon',
    isPro: true,
    sortOrder: 5,
  },
  {
    name: 'Candy Pop',
    category: 'vibrant' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_vibrant_candy',
    isPro: true,
    sortOrder: 6,
  },
  // Corporate
  {
    name: 'Бизнес классик',
    category: 'corporate' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_corp_classic',
    isPro: false,
    sortOrder: 7,
  },
  {
    name: 'Финтех',
    category: 'corporate' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_corp_fintech',
    isPro: true,
    sortOrder: 8,
  },
  // Lifestyle
  {
    name: 'Lifestyle блог',
    category: 'lifestyle' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_life_blog',
    isPro: false,
    sortOrder: 9,
  },
  {
    name: 'Travel Vibes',
    category: 'lifestyle' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_life_travel',
    isPro: false,
    sortOrder: 10,
  },
  {
    name: 'Wellness',
    category: 'lifestyle' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_life_wellness',
    isPro: true,
    sortOrder: 11,
  },
  // Dark
  {
    name: 'Тёмная элегантность',
    category: 'dark' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_dark_elegant',
    isPro: false,
    sortOrder: 12,
  },
  {
    name: 'Midnight Pro',
    category: 'dark' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_dark_midnight',
    isPro: true,
    sortOrder: 13,
  },
  {
    name: 'Carbon',
    category: 'dark' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_dark_carbon',
    isPro: true,
    sortOrder: 14,
  },
  {
    name: 'Bold Statement',
    category: 'dark' as const,
    previewUrl: null,
    figmaComponentKey: 'tpl_dark_bold',
    isPro: false,
    sortOrder: 15,
  },
]

async function seed() {
  console.log('Seeding templates...')
  await db.insert(templates).values(TEMPLATES).onConflictDoNothing()
  console.log(`Inserted ${TEMPLATES.length} templates`)

  await client.end()
  console.log('Done!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
