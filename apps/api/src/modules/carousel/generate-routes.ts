import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { GeminiService } from '../gemini/service.js'

const generateSchema = z.object({
  topic: z.string().min(1).max(500),
  slideCount: z.number().int().min(3).max(15).default(7),
  tone: z.enum(['expert', 'friendly', 'provocative']).default('expert'),
  language: z.enum(['ru', 'en']).default('ru'),
})

export async function generateRoutes(app: FastifyInstance) {
  const gemini = new GeminiService()

  // Public endpoint — no auth required
  app.post('/slides', async (request, reply) => {
    const body = generateSchema.parse(request.body)

    try {
      const slides = await gemini.generateSlides(
        body.topic,
        body.slideCount,
        body.tone,
        body.language,
      )
      return { success: true, data: slides }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed'
      return reply.status(500).send({ success: false, error: message })
    }
  })
}
