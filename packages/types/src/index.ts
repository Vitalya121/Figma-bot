export type Tone = 'expert' | 'friendly' | 'provocative'
export type Language = 'ru' | 'en'
export type Plan = 'free' | 'pro' | 'agency'
export type GenerationStatus = 'queued' | 'processing' | 'completed' | 'failed'
export type TemplateCategory = 'minimal' | 'vibrant' | 'corporate' | 'lifestyle' | 'dark'

export interface CarouselRequest {
  topic?: string
  text?: string
  slideCount: number
  tone: Tone
  language: Language
  templateId: string
}

export interface CarouselSlide {
  index: number
  title: string
  body: string
  imageKeywords: string[]
  imageUrl?: string
}

export interface CarouselResult {
  id: string
  userId: string
  title: string
  topic: string
  figmaFileUrl: string
  figmaFileKey: string
  slides: CarouselSlide[]
  templateId: string
  status: GenerationStatus
  createdAt: string
}

export interface Template {
  id: string
  name: string
  category: TemplateCategory
  previewUrl: string
  figmaComponentKey: string
  isPro: boolean
  sortOrder: number
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  plan: Plan
  carouselsUsed: number
  carouselsLimit: number
}

export interface BrandKit {
  id: string
  userId: string
  name: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  headingFont: string
  bodyFont: string
}

export interface GenerationJob {
  id: string
  userId: string
  status: GenerationStatus
  progress: number
  stage?: string
  result?: CarouselResult
  error?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
