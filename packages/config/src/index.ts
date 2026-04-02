function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function envOptional(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback
}

export const config = {
  nodeEnv: envOptional('NODE_ENV', 'development')!,
  isDev: envOptional('NODE_ENV', 'development') === 'development',
  port: parseInt(envOptional('PORT', '4000')!, 10),

  database: {
    url: env('DATABASE_URL'),
  },

  redis: {
    url: env('REDIS_URL'),
  },

  gemini: {
    apiKey: env('GEMINI_API_KEY'),
  },

  figma: {
    clientId: env('FIGMA_CLIENT_ID'),
    clientSecret: env('FIGMA_CLIENT_SECRET'),
  },

  unsplash: {
    accessKey: env('UNSPLASH_ACCESS_KEY'),
  },

  pexels: {
    apiKey: envOptional('PEXELS_API_KEY'),
  },

  auth: {
    jwtSecret: env('JWT_SECRET'),
    googleClientId: env('GOOGLE_CLIENT_ID'),
    googleClientSecret: env('GOOGLE_CLIENT_SECRET'),
  },

  stripe: {
    secretKey: env('STRIPE_SECRET_KEY'),
    webhookSecret: envOptional('STRIPE_WEBHOOK_SECRET'),
  },

  app: {
    frontendUrl: envOptional('FRONTEND_URL', 'http://localhost:3000')!,
    apiUrl: envOptional('API_URL', 'http://localhost:4000')!,
  },
} as const

export type Config = typeof config
