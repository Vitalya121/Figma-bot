import { Worker, Job } from 'bullmq'
import { redisConnection } from './index.js'
import { CarouselService } from '../modules/carousel/service.js'
import { db } from '../db/index.js'
import { carousels } from '../db/schema.js'
import { eq } from 'drizzle-orm'

interface CarouselJobData {
  carouselId: string
  userId: string
  topic?: string
  text?: string
  slideCount: number
  tone: string
  language: string
  templateId: string
  figmaAccessToken: string
}

const worker = new Worker(
  'carousel-generation',
  async (job: Job<CarouselJobData>) => {
    const { carouselId, userId, topic, text, slideCount, tone, language, templateId, figmaAccessToken } = job.data
    const service = new CarouselService()

    try {
      await db.update(carousels).set({ status: 'processing' }).where(eq(carousels.id, carouselId))

      await job.updateProgress({ stage: 'generating_text', progress: 10 })
      const slides = text
        ? service.parseText(text)
        : await service.generateSlides(topic!, slideCount, tone, language)

      await job.updateProgress({ stage: 'finding_photos', progress: 30 })
      const slidesWithPhotos = await service.findPhotosForSlides(slides)

      await job.updateProgress({ stage: 'generating_images', progress: 50 })
      const slidesWithImages = await service.generateImagesForSlides(slidesWithPhotos)

      await job.updateProgress({ stage: 'creating_figma', progress: 70 })
      const figmaResult = await service.createFigmaFile(
        figmaAccessToken,
        topic ?? 'Carousel',
        slidesWithImages,
        templateId,
      )

      await job.updateProgress({ stage: 'completed', progress: 100 })
      await db
        .update(carousels)
        .set({
          status: 'completed',
          slides: slidesWithImages,
          figmaFileUrl: figmaResult.fileUrl,
          figmaFileKey: figmaResult.fileKey,
        })
        .where(eq(carousels.id, carouselId))

      return { fileUrl: figmaResult.fileUrl }
    } catch (error) {
      await db.update(carousels).set({ status: 'failed' }).where(eq(carousels.id, carouselId))
      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
)

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message)
})

export { worker }
