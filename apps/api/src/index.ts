import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import { config } from '@carousel-forge/config'
import { carouselRoutes } from './modules/carousel/routes.js'
import { authRoutes } from './modules/auth/routes.js'
import { billingRoutes } from './modules/billing/routes.js'
import { templateRoutes } from './modules/carousel/template-routes.js'

const app = Fastify({
  logger: {
    level: config.isDev ? 'debug' : 'info',
  },
})

await app.register(cors, {
  origin: config.app.frontendUrl,
  credentials: true,
})

await app.register(rateLimit, {
  max: 60,
  timeWindow: '1 minute',
})

await app.register(jwt, {
  secret: config.auth.jwtSecret,
})

app.get('/health', async () => ({ status: 'ok' }))

await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(carouselRoutes, { prefix: '/api/carousels' })
await app.register(templateRoutes, { prefix: '/api/templates' })
await app.register(billingRoutes, { prefix: '/api/billing' })

try {
  await app.listen({ port: config.port, host: '0.0.0.0' })
  app.log.info(`Server running on http://localhost:${config.port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
