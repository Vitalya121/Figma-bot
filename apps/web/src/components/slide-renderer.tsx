'use client'

import { forwardRef } from 'react'

export interface SlideData {
  index: number
  title: string
  body: string
}

export interface TemplateStyle {
  id: string
  name: string
  bgGradient: string
  titleColor: string
  bodyColor: string
  accentColor: string
  numberColor: string
  fontClass: string
}

export const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  'minimal-clean': {
    id: 'minimal-clean',
    name: 'Чистый минимал',
    bgGradient: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
    titleColor: '#111827',
    bodyColor: '#4b5563',
    accentColor: '#7c3aed',
    numberColor: '#9ca3af',
    fontClass: 'font-sans',
  },
  'vibrant-gradient': {
    id: 'vibrant-gradient',
    name: 'Яркий градиент',
    bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
    titleColor: '#ffffff',
    bodyColor: 'rgba(255,255,255,0.85)',
    accentColor: '#fbbf24',
    numberColor: 'rgba(255,255,255,0.4)',
    fontClass: 'font-sans',
  },
  'dark-elegant': {
    id: 'dark-elegant',
    name: 'Тёмная элегантность',
    bgGradient: 'linear-gradient(135deg, #0f0f17 0%, #1e1b4b 100%)',
    titleColor: '#ffffff',
    bodyColor: 'rgba(255,255,255,0.75)',
    accentColor: '#a78bfa',
    numberColor: 'rgba(255,255,255,0.3)',
    fontClass: 'font-sans',
  },
  'corporate-blue': {
    id: 'corporate-blue',
    name: 'Корпоративный',
    bgGradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
    titleColor: '#ffffff',
    bodyColor: 'rgba(255,255,255,0.85)',
    accentColor: '#38bdf8',
    numberColor: 'rgba(255,255,255,0.35)',
    fontClass: 'font-sans',
  },
  'lifestyle-warm': {
    id: 'lifestyle-warm',
    name: 'Lifestyle',
    bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fde68a 100%)',
    titleColor: '#1c1917',
    bodyColor: '#44403c',
    accentColor: '#ea580c',
    numberColor: '#a8a29e',
    fontClass: 'font-sans',
  },
  'neon-nights': {
    id: 'neon-nights',
    name: 'Neon Nights',
    bgGradient: 'linear-gradient(135deg, #0a0a1a 0%, #1e1050 50%, #0a0a2e 100%)',
    titleColor: '#22d3ee',
    bodyColor: 'rgba(186,230,253,0.8)',
    accentColor: '#f0abfc',
    numberColor: 'rgba(34,211,238,0.3)',
    fontClass: 'font-sans',
  },
  'mono-type': {
    id: 'mono-type',
    name: 'Mono Type',
    bgGradient: 'linear-gradient(135deg, #fafafa 0%, #e5e5e5 100%)',
    titleColor: '#000000',
    bodyColor: '#404040',
    accentColor: '#000000',
    numberColor: '#a3a3a3',
    fontClass: 'font-mono',
  },
  'bold-statement': {
    id: 'bold-statement',
    name: 'Bold Statement',
    bgGradient: 'linear-gradient(135deg, #000000 0%, #18181b 100%)',
    titleColor: '#ffffff',
    bodyColor: 'rgba(255,255,255,0.7)',
    accentColor: '#ef4444',
    numberColor: 'rgba(255,255,255,0.2)',
    fontClass: 'font-sans',
  },
}

interface SlideRendererProps {
  slide: SlideData
  total: number
  template: TemplateStyle
  scale?: number
}

export const SlideRenderer = forwardRef<HTMLDivElement, SlideRendererProps>(
  function SlideRenderer({ slide, total, template, scale = 1 }, ref) {
    const isHook = slide.index === 1
    const isCta = slide.index === total
    const w = 1080 * scale
    const h = 1350 * scale
    const pad = 80 * scale

    return (
      <div
        ref={ref}
        style={{
          width: w,
          height: h,
          background: template.bgGradient,
          padding: pad,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isHook ? 'center' : 'flex-start',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: template.fontClass === 'font-mono' ? 'monospace' : 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6 * scale,
            background: template.accentColor,
          }}
        />

        {/* Slide number badge */}
        {!isHook && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6 * scale,
              marginBottom: 30 * scale,
              paddingTop: isHook ? 0 : 20 * scale,
            }}
          >
            <div
              style={{
                width: 36 * scale,
                height: 36 * scale,
                borderRadius: '50%',
                background: template.accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 16 * scale,
                fontWeight: 700,
              }}
            >
              {slide.index}
            </div>
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: (isHook ? 64 : 48) * scale,
            fontWeight: 800,
            lineHeight: 1.15,
            color: template.titleColor,
            marginBottom: 24 * scale,
            letterSpacing: '-0.02em',
          }}
        >
          {slide.title}
        </div>

        {/* Body */}
        <div
          style={{
            fontSize: 28 * scale,
            lineHeight: 1.6,
            color: template.bodyColor,
            fontWeight: 400,
            maxWidth: '95%',
          }}
        >
          {slide.body}
        </div>

        {/* Bottom: page indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: pad,
            right: pad,
            fontSize: 20 * scale,
            color: template.numberColor,
            fontWeight: 500,
          }}
        >
          {slide.index} / {total}
        </div>

        {/* CTA arrow */}
        {isCta && (
          <div
            style={{
              marginTop: 40 * scale,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12 * scale,
              background: template.accentColor,
              color: '#fff',
              padding: `${16 * scale}px ${32 * scale}px`,
              borderRadius: 16 * scale,
              fontSize: 24 * scale,
              fontWeight: 700,
              alignSelf: 'flex-start',
            }}
          >
            Подпишись →
          </div>
        )}
      </div>
    )
  },
)
