import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { config } from '@carousel-forge/config'

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions'
const TEXT_MODEL = 'google/gemini-2.0-flash-001'
const IMAGE_MODEL = 'google/gemini-2.5-flash-image'

async function openRouterText(messages: { role: string; content: string | object[] }[]): Promise<string> {
  const res = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openrouter.apiKey}` },
    body: JSON.stringify({ model: TEXT_MODEL, messages }),
  })
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}`)
  const data = (await res.json()) as { choices: { message: { content: string } }[] }
  return data.choices[0].message.content
}

async function openRouterImage(content: object[]): Promise<string | null> {
  const res = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openrouter.apiKey}` },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      messages: [{ role: 'user', content }],
    }),
  })

  if (!res.ok) {
    console.error('Image generation failed:', res.status)
    return null
  }

  const data = (await res.json()) as {
    choices: {
      message: {
        content: string | null
        images?: { type: string; image_url: { url: string } }[]
      }
    }[]
  }

  return data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null
}

const generateSlidesSchema = z.object({
  topic: z.string().min(1).max(500),
  slideCount: z.number().int().min(3).max(15).default(7),
  tone: z.enum(['expert', 'friendly', 'provocative']).default('expert'),
  language: z.enum(['ru', 'en']).default('ru'),
})

const generateImagesSchema = z.object({
  slides: z.array(z.object({
    index: z.number(),
    title: z.string(),
    body: z.string(),
    totalSlides: z.number().optional(),
    imageKeywords: z.array(z.string()).optional(),
  })),
  referenceImage: z.string().optional(),
})

export async function generateRoutes(app: FastifyInstance) {
  // Generate text for slides
  app.post('/slides', async (request, reply) => {
    const body = generateSlidesSchema.parse(request.body)
    const lang = body.language === 'ru' ? 'Russian' : 'English'

    const prompt = `You are an expert Instagram carousel copywriter. Create a ${body.slideCount}-slide carousel about: "${body.topic}".

Language: ${lang}
Tone: ${body.tone}

Structure:
- Slide 1: Hook — a bold, scroll-stopping headline (max 10 words)
- Slides 2 to ${body.slideCount - 1}: Value slides with one key point each
- Slide ${body.slideCount}: CTA — call to action (follow, save, share)

For each slide provide:
- title: short headline (max 60 chars)
- body: supporting text (max 200 chars)
- imageKeywords: 2-3 keywords for finding a relevant photo

Return ONLY a JSON array:
[{"index":1,"title":"...","body":"...","imageKeywords":["...","..."]}]`

    try {
      const text = await openRouterText([{ role: 'user', content: prompt }])
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Failed to parse AI response')
      return { success: true, data: JSON.parse(jsonMatch[0]) }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed'
      return reply.status(500).send({ success: false, error: message })
    }
  })

  // Hybrid: generate visual backgrounds WITHOUT text
  app.post('/images', async (request, reply) => {
    const body = generateImagesSchema.parse(request.body)
    const results: { index: number; imageUrl: string | null; status: string }[] = []
    const total = body.slides[0]?.totalSlides ?? body.slides.length

    for (const slide of body.slides) {
      try {
        const isHook = slide.index === 1
        const isCta = slide.index === total
        const keywords = slide.imageKeywords?.join(', ') ?? ''

        const prompt = `Create a visual background image for an Instagram carousel slide (1080x1350 portrait).

Topic of the slide: "${slide.title}" — ${keywords}
This is slide ${slide.index} of ${total}${isHook ? ' (first slide, must be eye-catching and bold)' : ''}${isCta ? ' (last slide, call to action vibe)' : ''}.

CRITICAL RULES:
- DO NOT include ANY text, words, letters, numbers, or typography on the image
- DO NOT write any titles, captions, labels, or watermarks
- The image must be PURELY VISUAL — only graphics, illustrations, photos, shapes, colors
- NO TEXT AT ALL — text will be added separately later

VISUAL REQUIREMENTS:
- Professional Instagram design, modern 2026 aesthetic
- Dark background (black, dark gray, deep navy, or deep purple)
- Include relevant thematic illustrations, icons, graphics, or abstract shapes related to "${slide.title}"
- Rich visual composition: gradients, glows, geometric elements, depth
- Leave clear space in the upper portion for title text overlay (about top 40% of image)
- Leave space in the middle for body text overlay
- Bottom area can have decorative elements
- High contrast areas where text will go (dark enough for white text to be readable)
- Visually engaging but not cluttered — serves as a background for text`

        const content: object[] = []

        if (body.referenceImage) {
          content.push({
            type: 'image_url',
            image_url: { url: body.referenceImage },
          })
          content.push({
            type: 'text',
            text: `Look at this reference image for VISUAL STYLE ONLY (colors, composition, mood, graphic style). Create a NEW background image matching this visual aesthetic. IMPORTANT: Do NOT copy any text from the reference. Generate ONLY the visual/graphic elements.\n\n${prompt}`,
          })
        } else {
          content.push({ type: 'text', text: prompt })
        }

        const imageUrl = await openRouterImage(content)
        results.push({
          index: slide.index,
          imageUrl,
          status: imageUrl ? 'success' : 'fallback',
        })

        app.log.info(`Slide ${slide.index}/${total}: ${imageUrl ? 'generated' : 'failed'}`)
      } catch (error) {
        console.error(`Image gen failed for slide ${slide.index}:`, error)
        results.push({ index: slide.index, imageUrl: null, status: 'error' })
      }
    }

    return { success: true, data: results }
  })

  // Regenerate single slide background
  app.post('/image', async (request, reply) => {
    const body = z.object({
      slideIndex: z.number(),
      totalSlides: z.number(),
      title: z.string(),
      bodyText: z.string(),
      referenceImage: z.string().optional(),
    }).parse(request.body)

    try {
      const prompt = `Create a visual background image for an Instagram carousel slide (1080x1350 portrait).
Topic: "${body.title}"
Slide ${body.slideIndex} of ${body.totalSlides}.

DO NOT include ANY text, words, or typography. PURELY VISUAL — graphics, illustrations, shapes only.
Dark background, modern 2026 design, thematic graphics related to the topic.
Leave space for text overlay in the upper and middle portions.`

      const content: object[] = []
      if (body.referenceImage) {
        content.push({ type: 'image_url', image_url: { url: body.referenceImage } })
        content.push({ type: 'text', text: `Match the visual style (colors, mood, graphic style) of this reference. NO TEXT on the image.\n\n${prompt}` })
      } else {
        content.push({ type: 'text', text: prompt })
      }

      const imageUrl = await openRouterImage(content)
      return { success: true, data: { imageUrl } }
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Image generation failed' })
    }
  })
}
