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
    console.error('Image generation failed:', res.status, await res.text().catch(() => ''))
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

  // Generate COMPLETE slide designs using Nano Banana Pro (Variant B)
  app.post('/images', async (request, reply) => {
    const body = generateImagesSchema.parse(request.body)
    const results: { index: number; imageUrl: string | null; status: string }[] = []
    const total = body.slides[0]?.totalSlides ?? body.slides.length

    for (const slide of body.slides) {
      try {
        const isHook = slide.index === 1
        const isCta = slide.index === total

        const prompt = `Create a complete, ready-to-post Instagram carousel slide image (1080x1350 portrait).

This is slide ${slide.index} of ${total}${isHook ? ' (FIRST SLIDE — HOOK, must grab attention)' : ''}${isCta ? ' (LAST SLIDE — CTA, call to action)' : ''}.

TEXT TO INCLUDE ON THE SLIDE:
Title: "${slide.title}"
Body text: "${slide.body}"
Slide number: ${slide.index}/${total}

DESIGN REQUIREMENTS:
- Professional Instagram carousel design, modern 2026 style
- Dark background (black/dark gray/deep color)
- Title must be large, bold, high contrast, immediately readable
- Body text smaller but clearly legible
- Include relevant thematic graphics, icons, or illustrations related to the topic
- Add subtle decorative elements (geometric shapes, gradients, glows)
- Slide number "${slide.index}/${total}" in bottom-right corner
- Clean typography, good visual hierarchy
- The text on the image MUST be exactly as written above, no changes, no extra text
- All text must be in the same language as provided above
- DO NOT add any text that is not specified above`

        const content: object[] = []

        // If reference image provided, include it for style matching
        if (body.referenceImage) {
          content.push({
            type: 'image_url',
            image_url: { url: body.referenceImage },
          })
          content.push({
            type: 'text',
            text: `Use the attached image as a STYLE REFERENCE. Match the visual style, color scheme, layout approach, typography style, and overall aesthetic. Create a new slide with this exact style but with the following content:\n\n${prompt}`,
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

  // Generate a single slide image
  app.post('/image', async (request, reply) => {
    const body = z.object({
      slideIndex: z.number(),
      totalSlides: z.number(),
      title: z.string(),
      bodyText: z.string(),
      referenceImage: z.string().optional(),
    }).parse(request.body)

    try {
      const prompt = `Create a complete, ready-to-post Instagram carousel slide image (1080x1350 portrait).
Slide ${body.slideIndex} of ${body.totalSlides}.
Title: "${body.title}"
Body: "${body.bodyText}"
Number: ${body.slideIndex}/${body.totalSlides}
Dark background, modern 2026 design, clean typography, thematic graphics. Text must be exactly as specified.`

      const content: object[] = []
      if (body.referenceImage) {
        content.push({ type: 'image_url', image_url: { url: body.referenceImage } })
        content.push({ type: 'text', text: `Match the visual style of this reference image. ${prompt}` })
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
