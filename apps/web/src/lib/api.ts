const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `API error: ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  createCarousel: (data: {
    topic?: string
    text?: string
    slideCount: number
    tone: string
    language: string
    templateId: string
  }) => request<{ success: boolean; data: { id: string; status: string } }>('/api/carousels', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getCarousels: () =>
    request<{ success: boolean; data: unknown[] }>('/api/carousels'),

  getCarouselStatus: (id: string) =>
    request<{ success: boolean; data: { status: string; progress: unknown; figmaFileUrl?: string } }>(
      `/api/carousels/${id}/status`,
    ),

  getTemplates: () =>
    request<{ success: boolean; data: unknown[] }>('/api/templates'),

  getPlans: () =>
    request<{ success: boolean; data: unknown[] }>('/api/billing/plans'),

  getMe: () =>
    request<{ success: boolean; data: unknown }>('/api/auth/me'),

  generateSlides: (data: { topic: string; slideCount: number; tone: string; language: string }) =>
    request<{
      success: boolean
      data: { index: number; title: string; body: string; imageKeywords: string[] }[]
    }>('/api/generate/slides', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
