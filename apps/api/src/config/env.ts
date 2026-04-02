import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  OPENROUTER_API_KEY: z.string().min(1),
  FIGMA_CLIENT_ID: z.string().min(1),
  FIGMA_CLIENT_SECRET: z.string().min(1),
  UNSPLASH_ACCESS_KEY: z.string().optional(),
  PEXELS_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(16),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
    process.exit(1)
  }
  return parsed.data
}
