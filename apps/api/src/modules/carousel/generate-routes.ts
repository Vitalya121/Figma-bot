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

async function openRouterImage(prompt: string, referenceBase64?: string): Promise<string | null> {
  const content: object[] = []

  if (referenceBase64) {
    content.push({
      type: 'image_url',
      image_url: { url: referenceBase64 },
    })
    content.push({
      type: 'text',
      text: `Using the attached image as a style reference, create a new background image in a similar visual style. ${prompt}`,
    })
  } else {
    content.push({ type: 'text', text: prompt })
  }

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

  const msg = data.choices?.[0]?.message
  if (msg?.images?.[0]?.image_url?.url) {
    return msg.images[0].image_url.url
  }

  return null
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
    imageKeywords: z.array(z.string()).optional(),
  })),
  templateName: z.string().optional(),
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

  // Generate background images for slides using Nano Banana Pro
  app.post('/images', async (request, reply) => {
    const body = generateImagesSchema.parse(request.body)
    const results: { index: number; imageUrl: string | null; status: string }[] = []

    for (const slide of body.slides) {
      try {
        const keywords = slide.imageKeywords?.join(', ') ?? slide.title
        const prompt = `Generate a professional Instagram carousel slide background image.
Theme: "${slide.title}" — ${keywords}
Style: Modern 2026 social media design, high quality, suitable as a background for text overlay.
The image should be abstract/atmospheric enough that white or light text would be readable on top.
${body.templateName ? `Visual style: ${body.templateName}` : ''}
Portrait orientation 1080x1350.
Return only the generated image.`

        const imageUrl = await openRouterImage(prompt, body.referenceImage)
        results.push({
          index: slide.index,
          imageUrl,
          status: imageUrl ? 'success' : 'fallback',
        })
      } catch (error) {
        console.error(`Image gen failed for slide ${slide.index}:`, error)
        results.push({ index: slide.index, imageUrl: null, status: 'error' })
      }
    }

    return { success: true, data: results }
  })

  // Generate a single slide image
  app.post('/image', async (request, reply) => {
    const body = z.object({
      prompt: z.string(),
      referenceImage: z.string().optional(),
    }).parse(request.body)

    try {
      const imageUrl = await openRouterImage(body.prompt, body.referenceImage)
      return { success: true, data: { imageUrl } }
    } catch (error) {
      return reply.status(500).send({ success: false, error: 'Image generation failed' })
    }
  })
}
