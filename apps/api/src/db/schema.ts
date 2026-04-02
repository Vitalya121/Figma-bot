import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core'

export const planEnum = pgEnum('plan', ['free', 'pro', 'agency'])
export const generationStatusEnum = pgEnum('generation_status', [
  'queued',
  'processing',
  'completed',
  'failed',
])
export const templateCategoryEnum = pgEnum('template_category', [
  'minimal',
  'vibrant',
  'corporate',
  'lifestyle',
  'dark',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  googleId: text('google_id').unique(),
  figmaAccessToken: text('figma_access_token'),
  figmaRefreshToken: text('figma_refresh_token'),
  plan: planEnum('plan').notNull().default('free'),
  carouselsUsed: integer('carousels_used').notNull().default(0),
  carouselsLimit: integer('carousels_limit').notNull().default(3),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const carousels = pgTable('carousels', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  topic: text('topic'),
  slides: jsonb('slides').notNull(),
  templateId: uuid('template_id').references(() => templates.id),
  figmaFileUrl: text('figma_file_url'),
  figmaFileKey: text('figma_file_key'),
  status: generationStatusEnum('status').notNull().default('queued'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: templateCategoryEnum('category').notNull(),
  previewUrl: text('preview_url'),
  figmaComponentKey: text('figma_component_key'),
  isPro: boolean('is_pro').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const brandKits = pgTable('brand_kits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').notNull().default('#6D28D9'),
  secondaryColor: text('secondary_color').notNull().default('#1E1B4B'),
  accentColor: text('accent_color').notNull().default('#F59E0B'),
  headingFont: text('heading_font').notNull().default('Inter'),
  bodyFont: text('body_font').notNull().default('Inter'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
