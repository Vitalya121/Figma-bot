import { config } from '@carousel-forge/config'
import type { CarouselSlide } from '@carousel-forge/types'

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions'

async function openRouterRequest(
  model: string,
  messages: { role: string; content: string }[],
): Promise<string> {
  const res = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openrouter.apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenRouter API error ${res.status}: ${body}`)
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[]
  }
  return data.choices[0].message.content
}

export class GeminiService {
  private textModel = 'google/gemini-2.0-flash-001'
  private imageModel = 'google/nano-banana-2'

  async generateSlides(
    topic: string,
    slideCount: number,
    tone: string,
    language: string,
  ): Promise<CarouselSlide[]> {
    const lang = language === 'ru' ? 'Russian' : 'English'
    const prompt = `You are an expert Instagram carousel copywriter. Create a ${slideCount}-slide carousel about: "${topic}".

Language: ${lang}
Tone: ${tone}

Structure:
- Slide 1: Hook — a bold, scroll-stopping headline (max 10 words)
- Slides 2 to ${slideCount - 1}: Value slides with one key point each
- Slide ${slideCount}: CTA — call to action (follow, save, share)

For each slide provide:
- title: short headline (max 60 chars)
- body: supporting text (max 200 chars)
- imageKeywords: 2-3 keywords for finding a relevant photo

Return ONLY a JSON array:
[{"index":1,"title":"...","body":"...","imageKeywords":["...","..."]}]`

    const text = await openRouterRequest(this.textModel, [
      { role: 'user', content: prompt },
    ])
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Failed to parse AI response')

    return JSON.parse(jsonMatch[0]) as CarouselSlide[]
  }

  async generateImagePrompt(slideTitle: string, slideBody: string): Promise<string> {
    const text = await openRouterRequest(this.textModel, [
      {
        role: 'user',
        content: `Generate a short image generation prompt (max 30 words) for a photo that would fit an Instagram carousel slide with title "${slideTitle}" and text "${slideBody}". The image should be modern, high quality, suitable for social media. Return ONLY the prompt text, nothing else.`,
      },
    ])
    return text.trim()
  }

  async generateImage(prompt: string): Promise<string> {
    const text = await openRouterRequest(this.imageModel, [
      {
        role: 'user',
        content: `Generate an image: ${prompt}`,
      },
    ])
    // OpenRouter image models return base64 or URL depending on model
    return text
  }
}
