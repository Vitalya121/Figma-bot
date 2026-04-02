import type { CarouselSlide } from '@carousel-forge/types'
import { GeminiService } from '../gemini/service.js'
import { PhotoService } from '../photo/service.js'
import { FigmaService } from '../figma/service.js'

export class CarouselService {
  private gemini = new GeminiService()
  private photo = new PhotoService()
  private figma = new FigmaService()

  async generateSlides(
    topic: string,
    slideCount: number,
    tone: string,
    language: string,
  ): Promise<CarouselSlide[]> {
    return this.gemini.generateSlides(topic, slideCount, tone, language)
  }

  parseText(text: string): CarouselSlide[] {
    const parts = text.split(/\n---\n|\n\n\n/).filter(Boolean)
    return parts.map((part, i) => {
      const lines = part.trim().split('\n')
      const title = lines[0]?.replace(/^#+\s*/, '') ?? ''
      const body = lines.slice(1).join('\n').trim()
      return {
        index: i + 1,
        title,
        body,
        imageKeywords: title.split(' ').slice(0, 3),
      }
    })
  }

  async findPhotosForSlides(slides: CarouselSlide[]): Promise<CarouselSlide[]> {
    const results = await Promise.allSettled(
      slides.map(async (slide) => {
        const url = await this.photo.findPhoto(slide.imageKeywords)
        return { ...slide, imageUrl: url }
      }),
    )

    return results.map((r, i) => (r.status === 'fulfilled' ? r.value : slides[i]))
  }

  async generateImagesForSlides(slides: CarouselSlide[]): Promise<CarouselSlide[]> {
    const results = await Promise.allSettled(
      slides.map(async (slide) => {
        try {
          const prompt = await this.gemini.generateImagePrompt(slide.title, slide.body)
          const imageData = await this.gemini.generateImage(prompt)
          return { ...slide, generatedImageBase64: imageData }
        } catch {
          // Fallback: keep the stock photo URL from previous step
          return slide
        }
      }),
    )

    return results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : slides[i],
    ) as CarouselSlide[]
  }

  async createFigmaFile(
    accessToken: string,
    title: string,
    slides: CarouselSlide[],
    _templateId: string,
  ): Promise<{ fileKey: string; fileUrl: string }> {
    return this.figma.createFile(accessToken, `CarouselForge — ${title}`, slides)
  }
}
