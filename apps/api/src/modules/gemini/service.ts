import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '@carousel-forge/config'
import type { CarouselSlide } from '@carousel-forge/types'

const genAI = new GoogleGenerativeAI(config.gemini.apiKey)

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  private imageModel = genAI.getGenerativeModel({ model: 'imagen-3.0-generate-002' })

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

    const result = await this.model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Failed to parse AI response')

    return JSON.parse(jsonMatch[0]) as CarouselSlide[]
  }

  async generateImagePrompt(slideTitle: string, slideBody: string): Promise<string> {
    const result = await this.model.generateContent(
      `Generate a short image generation prompt (max 30 words) for a photo that would fit an Instagram carousel slide with title "${slideTitle}" and text "${slideBody}". The image should be modern, high quality, suitable for social media. Return ONLY the prompt text, nothing else.`,
    )
    return result.response.text().trim()
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      const result = await this.imageModel.generateContent(prompt)
      const response = result.response
      const candidates = response.candidates
      if (candidates && candidates[0]?.content?.parts?.[0]?.inlineData) {
        return candidates[0].content.parts[0].inlineData.data as string
      }
      throw new Error('No image data in response')
    } catch (error) {
      console.warn('Image generation failed, will use stock photo:', error)
      throw error
    }
  }
}
