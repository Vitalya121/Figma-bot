import { config } from '@carousel-forge/config'

interface UnsplashPhoto {
  urls: { regular: string; small: string }
  alt_description: string
}

interface PexelsPhoto {
  src: { large: string; medium: string }
  alt: string
}

export class PhotoService {
  async searchUnsplash(query: string, count = 5): Promise<string[]> {
    const params = new URLSearchParams({
      query,
      per_page: String(count),
      orientation: 'portrait',
    })

    const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: { Authorization: `Client-ID ${config.unsplash.accessKey}` },
    })

    if (!res.ok) throw new Error(`Unsplash API error: ${res.status}`)

    const data = (await res.json()) as { results: UnsplashPhoto[] }
    return data.results.map((p) => p.urls.regular)
  }

  async searchPexels(query: string, count = 5): Promise<string[]> {
    if (!config.pexels.apiKey) return []

    const params = new URLSearchParams({
      query,
      per_page: String(count),
      orientation: 'portrait',
    })

    const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: config.pexels.apiKey },
    })

    if (!res.ok) throw new Error(`Pexels API error: ${res.status}`)

    const data = (await res.json()) as { photos: PexelsPhoto[] }
    return data.photos.map((p) => p.src.large)
  }

  async findPhoto(keywords: string[]): Promise<string | undefined> {
    const query = keywords.join(' ')
    try {
      const photos = await this.searchUnsplash(query, 1)
      if (photos.length > 0) return photos[0]
    } catch {
      console.warn('Unsplash failed, trying Pexels')
    }

    try {
      const photos = await this.searchPexels(query, 1)
      if (photos.length > 0) return photos[0]
    } catch {
      console.warn('Pexels also failed')
    }

    return undefined
  }
}
