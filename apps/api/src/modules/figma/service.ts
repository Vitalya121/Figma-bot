import type { CarouselSlide } from '@carousel-forge/types'
import { FigmaApiError } from '../../utils/errors.js'

const FIGMA_API = 'https://api.figma.com/v1'
const SLIDE_WIDTH = 1080
const SLIDE_HEIGHT = 1350
const SLIDE_GAP = 100

interface FigmaNode {
  name: string
  type: string
  x?: number
  y?: number
  width?: number
  height?: number
  children?: FigmaNode[]
  characters?: string
  style?: Record<string, unknown>
  fills?: unknown[]
  [key: string]: unknown
}

export class FigmaService {
  private async figmaFetch(
    accessToken: string,
    path: string,
    options: RequestInit = {},
  ): Promise<unknown> {
    const res = await fetch(`${FIGMA_API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!res.ok) {
      const body = await res.text()
      throw new FigmaApiError(`${res.status} ${body}`)
    }

    return res.json()
  }

  async getMe(accessToken: string): Promise<{ id: string; handle: string; email: string }> {
    return (await this.figmaFetch(accessToken, '/me')) as {
      id: string
      handle: string
      email: string
    }
  }

  async createFile(
    accessToken: string,
    name: string,
    slides: CarouselSlide[],
  ): Promise<{ fileKey: string; fileUrl: string }> {
    const children: FigmaNode[] = slides.map((slide, i) => ({
      name: `Slide ${slide.index} — ${slide.title}`,
      type: 'FRAME',
      x: i * (SLIDE_WIDTH + SLIDE_GAP),
      y: 0,
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      fills: [{ type: 'SOLID', color: { r: 0.07, g: 0.07, b: 0.12, a: 1 } }],
      children: [
        {
          name: 'Title',
          type: 'TEXT',
          x: 80,
          y: slide.index === 1 ? 450 : 100,
          width: SLIDE_WIDTH - 160,
          height: 200,
          characters: slide.title,
          style: {
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: slide.index === 1 ? 64 : 48,
            lineHeightPx: slide.index === 1 ? 72 : 56,
          },
          fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 1 } }],
        },
        {
          name: 'Body',
          type: 'TEXT',
          x: 80,
          y: slide.index === 1 ? 700 : 340,
          width: SLIDE_WIDTH - 160,
          height: 400,
          characters: slide.body,
          style: {
            fontFamily: 'Inter',
            fontWeight: 400,
            fontSize: 28,
            lineHeightPx: 40,
          },
          fills: [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.9, a: 1 } }],
        },
        {
          name: 'Slide Number',
          type: 'TEXT',
          x: SLIDE_WIDTH - 140,
          y: SLIDE_HEIGHT - 100,
          width: 60,
          height: 40,
          characters: `${slide.index}/${slides.length}`,
          style: {
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 20,
          },
          fills: [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.6, a: 1 } }],
        },
      ],
    }))

    const fileData = {
      name,
      document: {
        type: 'DOCUMENT',
        children: [
          {
            type: 'CANVAS',
            name: 'Carousel',
            children,
          },
        ],
      },
    }

    // Note: Figma REST API doesn't support direct file creation.
    // In production, use Figma Plugin API via a plugin bridge.
    // For MVP, we create a project file and use the Plugin API.
    // This is a placeholder for the architecture.
    const result = (await this.figmaFetch(accessToken, '/files', {
      method: 'POST',
      body: JSON.stringify(fileData),
    })) as { key: string }

    return {
      fileKey: result.key,
      fileUrl: `https://www.figma.com/file/${result.key}`,
    }
  }

  async uploadImage(
    accessToken: string,
    fileKey: string,
    imageData: Buffer,
  ): Promise<{ imageRef: string }> {
    const res = await fetch(`${FIGMA_API}/images/${fileKey}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'image/png',
      },
      body: imageData,
    })

    if (!res.ok) throw new FigmaApiError(`Image upload failed: ${res.status}`)
    return (await res.json()) as { imageRef: string }
  }
}
