import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.js'
import { db } from '../../db/index.js'
import { carousels, users } from '../../db/schema.js'
import { carouselQueue } from '../../queue/index.js'
import { eq, desc } from 'drizzle-orm'
import { LimitExceededError, NotFoundError } from '../../utils/errors.js'

const createSchema = z.object({
  topic: z.string().max(500).optional(),
  text: z.string().max(10000).optional(),
  slideCount: z.number().int().min(3).max(15).default(7),
  tone: z.enum(['expert', 'friendly', 'provocative']).default('expert'),
  language: z.enum(['ru', 'en']).default('ru'),
  templateId: z.string().uuid(),
})

export async function carouselRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  app.post('/', async (request, reply) => {
    const body = createSchema.parse(request.body)
    const { userId } = request.user

    if (!body.topic && !body.text) {
      return reply.status(400).send({ success: false, error: 'Provide topic or text' })
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) throw new NotFoundError('User')

    if (user.carouselsUsed >= user.carouselsLimit) {
      throw new LimitExceededError()
    }

    const [carousel] = await db
      .insert(carousels)
      .values({
        userId,
        title: body.topic ?? 'Custom carousel',
        topic: body.topic,
        slides: [],
        templateId: body.templateId,
        status: 'queued',
      })
      .returning()

    await carouselQueue.add('generate', {
      carouselId: carousel.id,
      userId,
      topic: body.topic,
      text: body.text,
      slideCount: body.slideCount,
      tone: body.tone,
      language: body.language,
      templateId: body.templateId,
      figmaAccessToken: user.figmaAccessToken ?? '',
    })

    await db
      .update(users)
      .set({ carouselsUsed: user.carouselsUsed + 1 })
      .where(eq(users.id, userId))

    return reply.status(201).send({ success: true, data: { id: carousel.id, status: 'queued' } })
  })

  app.get('/', async (request) => {
    const { userId } = request.user
    const result = await db
      .select()
      .from(carousels)
      .where(eq(carousels.userId, userId))
      .orderBy(desc(carousels.createdAt))
      .limit(50)

    return { success: true, data: result }
  })

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string }
    const { userId } = request.user

    const [carousel] = await db
      .select()
      .from(carousels)
      .where(eq(carousels.id, id))

    if (!carousel || carousel.userId !== userId) throw new NotFoundError('Carousel')
    return { success: true, data: carousel }
  })

  app.get('/:id/status', async (request) => {
    const { id } = request.params as { id: string }
    const job = await carouselQueue.getJob(id)

    const [carousel] = await db
      .select()
      .from(carousels)
      .where(eq(carousels.id, id))

    return {
      success: true,
      data: {
        status: carousel?.status ?? 'unknown',
        progress: job ? await job.progress : null,
        figmaFileUrl: carousel?.figmaFileUrl,
      },
    }
  })
}
