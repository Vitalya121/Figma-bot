import type { FastifyInstance } from 'fastify'
import { db } from '../../db/index.js'
import { templates } from '../../db/schema.js'
import { asc } from 'drizzle-orm'

export async function templateRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const result = await db.select().from(templates).orderBy(asc(templates.sortOrder))
    return { success: true, data: result }
  })
}
