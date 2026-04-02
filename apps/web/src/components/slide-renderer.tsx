'use client'

import { forwardRef } from 'react'

export interface SlideData {
  index: number
  title: string
  body: string
  imageKeywords: string[]
  backgroundImage?: string // data URL or URL
}

export interface TemplateStyle {
  id: string
  name: string
  // Background
  bgGradient: string
  bgPattern?: string // SVG pattern
  overlayColor?: string
  // Text
  titleColor: string
  bodyColor: string
  accentColor: string
  numberColor: string
  // Layout
  titlePosition: 'top' | 'center' | 'bottom'
  hasAccentBar: boolean
  hasCircleDecor: boolean
  hasDiagonalStripe: boolean
  hasGridPattern: boolean
  hasDotPattern: boolean
}

export const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  'modern-dark': {
    id: 'modern-dark',
    name: 'Modern Dark',
    bgGradient: 'linear-gradient(160deg, #0a0a1a 0%, #1a1035 50%, #0d0d2b 100%)',
    titleColor: '#ffffff',
    bodyColor: 'rgba(255,255,255,0.75)',
    accentColor: '#7c3aed',
    numberColor: 'rgba(255,255,255,0.2)',
    titlePosition: 'top',
    hasAccentBar: true,
    hasCircleDecor: true,
    hasDiagonalStripe: false,
    hasGridPattern: false,
    hasDotPattern: false,
  },
  'gradient-pop': {
    id: 'gradient-pop',
    name: 'Gradient Pop',
    bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    titleColor: '#ffffff',
    bodyColor: 'rgba(255,255,255,0.9)',
    accentColor: '#fbbf24',
    numberColor: 'rgba(255,255,255,0.3)',
    titlePosition: 'center',
    hasAccentBar: false,
    hasCircleDecor: false,
    hasDiagonalStripe: true,
    hasGridPattern: false,
    hasDotPattern: false,
  },
  'clean-white': {
    id: 'clean-white',
    name: 'Clean White',
    bgGradient: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
    titleColor: '#111827',
    bodyColor: '#4b5563',
    accentColor: '#2563eb',
    numberColor: '#d1d5db',
    titlePosition: 'top',
    hasAccentBar: true,
    hasCircleDecor: false,
    hasDiagonalStripe: false,
    hasGridPattern: true,
    hasDotPattern: false,
  },
  'neon-cyber': {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    bgGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    titleColor: '#00f0ff',
    bodyColor: 'rgba(200,230,255,0.8)',
    accentColor: '#ff006e',
    numberColor: 'rgba(0,240,255,0.2)',
    titlePosition: 'top',
    hasAccentBar: false,
    hasCircleDecor: true,
    hasDiagonalStripe: false,
    hasGridPattern: true,
    hasDotPattern: false,
  },
  'warm-sunset': {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    bgGradient: 'linear-gradient(160deg, #1a0a00 0%, #2d1810 40%, #1a0e08 100%)',
    overlayColor: 'rgba(255,120,50,0.08)',
    titleColor: '#fcd34d',
    bodyColor: 'rgba(255,237,213,0.85)',
    accentColor: '#f97316',
    numberColor: 'rgba(251,191,36,0.2)',
    titlePosition: 'top',
    hasAccentBar: true,
    hasCircleDecor: false,
    hasDiagonalStripe: false,
    hasGridPattern: false,
    hasDotPattern: true,
  },
  'minimal-mono': {
    id: 'minimal-mono',
    name: 'Minimal Mono',
    bgGradient: 'linear-gradient(180deg, #fafafa 0%, #e5e5e5 100%)',
    titleColor: '#000000',
    bodyColor: '#525252',
    accentColor: '#000000',
    numberColor: '#a3a3a3',
    titlePosition: 'center',
    hasAccentBar: false,
    hasCircleDecor: false,
    hasDiagonalStripe: true,
    hasGridPattern: false,
    hasDotPattern: false,
  },
  'ocean-depth': {
    id: 'ocean-depth',
    name: 'Ocean Depth',
    bgGradient: 'linear-gradient(160deg, #020617 0%, #0c4a6e 50%, #082f49 100%)',
    titleColor: '#38bdf8',
    bodyColor: 'rgba(186,230,253,0.8)',
    accentColor: '#06b6d4',
    numberColor: 'rgba(56,189,248,0.2)',
    titlePosition: 'top',
    hasAccentBar: true,
    hasCircleDecor: true,
    hasDiagonalStripe: false,
    hasGridPattern: false,
    hasDotPattern: false,
  },
  'bold-red': {
    id: 'bold-red',
    name: 'Bold Red',
    bgGradient: 'linear-gradient(160deg, #0a0a0a 0%, #1c1917 100%)',
    titleColor: '#ffffff',
    bodyColor: 'rgba(255,255,255,0.7)',
    accentColor: '#ef4444',
    numberColor: 'rgba(255,255,255,0.15)',
    titlePosition: 'top',
    hasAccentBar: false,
    hasCircleDecor: false,
    hasDiagonalStripe: true,
    hasGridPattern: false,
    hasDotPattern: true,
  },
}

interface SlideRendererProps {
  slide: SlideData
  total: number
  template: TemplateStyle
  scale?: number
}

export const SlideRenderer = forwardRef<HTMLDivElement, SlideRendererProps>(
  function SlideRenderer({ slide, total, template: t, scale = 1 }, ref) {
    const isHook = slide.index === 1
    const isCta = slide.index === total
    const w = 1080 * scale
    const h = 1350 * scale
    const pad = 80 * scale
    const hasBgImage = !!slide.backgroundImage

    return (
      <div
        ref={ref}
        style={{
          width: w,
          height: h,
          background: t.bgGradient,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: t.id === 'minimal-mono' ? '"SF Mono", monospace' : '"Inter", system-ui, sans-serif',
        }}
      >
        {/* Background image */}
        {hasBgImage && (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${slide.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.7) 100%)',
            }} />
          </>
        )}

        {/* Overlay */}
        {t.overlayColor && (
          <div style={{ position: 'absolute', inset: 0, background: t.overlayColor }} />
        )}

        {/* Grid pattern */}
        {t.hasGridPattern && (
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.04,
            backgroundImage: `linear-gradient(${t.accentColor} 1px, transparent 1px), linear-gradient(90deg, ${t.accentColor} 1px, transparent 1px)`,
            backgroundSize: `${60 * scale}px ${60 * scale}px`,
          }} />
        )}

        {/* Dot pattern */}
        {t.hasDotPattern && (
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: `radial-gradient(${t.accentColor} 1.5px, transparent 1.5px)`,
            backgroundSize: `${30 * scale}px ${30 * scale}px`,
          }} />
        )}

        {/* Diagonal stripe */}
        {t.hasDiagonalStripe && (
          <div style={{
            position: 'absolute',
            top: -h * 0.3,
            right: -w * 0.2,
            width: w * 0.7,
            height: h * 1.6,
            background: t.accentColor,
            opacity: 0.05,
            transform: 'rotate(15deg)',
            borderRadius: 40 * scale,
          }} />
        )}

        {/* Circle decorations */}
        {t.hasCircleDecor && (
          <>
            <div style={{
              position: 'absolute',
              top: -80 * scale,
              right: -80 * scale,
              width: 300 * scale,
              height: 300 * scale,
              borderRadius: '50%',
              border: `2px solid ${t.accentColor}`,
              opacity: 0.1,
            }} />
            <div style={{
              position: 'absolute',
              bottom: -120 * scale,
              left: -60 * scale,
              width: 400 * scale,
              height: 400 * scale,
              borderRadius: '50%',
              background: t.accentColor,
              opacity: 0.04,
            }} />
          </>
        )}

        {/* Accent bar */}
        {t.hasAccentBar && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0,
            width: 6 * scale, height: h,
            background: `linear-gradient(180deg, ${t.accentColor}, transparent)`,
          }} />
        )}

        {/* Content */}
        <div style={{
          position: 'relative',
          padding: pad,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: t.titlePosition === 'center' && isHook ? 'center' : 'flex-start',
          zIndex: 1,
        }}>
          {/* Slide badge */}
          {!isHook && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10 * scale,
              marginBottom: 24 * scale,
              paddingTop: 20 * scale,
            }}>
              <div style={{
                padding: `${6 * scale}px ${16 * scale}px`,
                borderRadius: 20 * scale,
                background: t.accentColor,
                color: '#fff',
                fontSize: 14 * scale,
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}>
                {String(slide.index).padStart(2, '0')}
              </div>
            </div>
          )}

          {/* Title */}
          <div style={{
            fontSize: (isHook ? 60 : 44) * scale,
            fontWeight: 800,
            lineHeight: 1.1,
            color: hasBgImage ? '#ffffff' : t.titleColor,
            marginBottom: 20 * scale,
            letterSpacing: '-0.03em',
            textShadow: hasBgImage ? '0 2px 20px rgba(0,0,0,0.5)' : 'none',
          }}>
            {slide.title}
          </div>

          {/* Divider line */}
          <div style={{
            width: 60 * scale,
            height: 4 * scale,
            background: t.accentColor,
            borderRadius: 2 * scale,
            marginBottom: 20 * scale,
          }} />

          {/* Body */}
          <div style={{
            fontSize: 26 * scale,
            lineHeight: 1.65,
            color: hasBgImage ? 'rgba(255,255,255,0.9)' : t.bodyColor,
            fontWeight: 400,
            maxWidth: '92%',
            textShadow: hasBgImage ? '0 1px 10px rgba(0,0,0,0.4)' : 'none',
          }}>
            {slide.body}
          </div>

          {/* CTA button */}
          {isCta && (
            <div style={{
              marginTop: 40 * scale,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10 * scale,
              background: t.accentColor,
              color: '#fff',
              padding: `${18 * scale}px ${36 * scale}px`,
              borderRadius: 16 * scale,
              fontSize: 22 * scale,
              fontWeight: 700,
              alignSelf: 'flex-start',
            }}>
              Подпишись →
            </div>
          )}

          {/* Bottom info */}
          <div style={{
            position: 'absolute',
            bottom: pad,
            left: pad,
            right: pad,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{
              width: 40 * scale,
              height: 4 * scale,
              background: t.accentColor,
              borderRadius: 2 * scale,
              opacity: 0.5,
            }} />
            <div style={{
              fontSize: 16 * scale,
              color: hasBgImage ? 'rgba(255,255,255,0.4)' : t.numberColor,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {slide.index} / {total}
            </div>
          </div>
        </div>
      </div>
    )
  },
)

// Generate SVG string for Figma import
export function slideToSVG(slide: SlideData, total: number, t: TemplateStyle): string {
  const w = 1080, h = 1350
  const isHook = slide.index === 1
  const isCta = slide.index === total

  // Parse gradient for SVG
  const gradId = `grad-${slide.index}`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.bgGradient.includes('#') ? t.bgGradient.match(/#[0-9a-fA-F]{6}/g)?.[0] ?? '#0a0a1a' : '#0a0a1a'}" />
      <stop offset="100%" stop-color="${t.bgGradient.match(/#[0-9a-fA-F]{6}/g)?.[1] ?? '#1a1035'}" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${h}" fill="url(#${gradId})" />

  ${t.hasAccentBar ? `<rect x="0" y="0" width="6" height="${h}" fill="${t.accentColor}" opacity="0.8" />` : ''}

  ${t.hasCircleDecor ? `
  <circle cx="${w + 80}" cy="-80" r="150" fill="none" stroke="${t.accentColor}" stroke-width="2" opacity="0.1" />
  <circle cx="-60" cy="${h + 120}" r="200" fill="${t.accentColor}" opacity="0.04" />
  ` : ''}

  <!-- Slide badge -->
  ${!isHook ? `
  <rect x="80" y="100" width="56" height="32" rx="16" fill="${t.accentColor}" />
  <text x="108" y="122" fill="#fff" font-size="14" font-weight="700" text-anchor="middle" font-family="Inter, sans-serif">${String(slide.index).padStart(2, '0')}</text>
  ` : ''}

  <!-- Title -->
  <text x="80" y="${isHook ? 580 : 200}" fill="${t.titleColor}" font-size="${isHook ? 60 : 44}" font-weight="800" font-family="Inter, sans-serif" letter-spacing="-0.03em">
    ${wrapSVGText(slide.title, isHook ? 60 : 44, w - 160)}
  </text>

  <!-- Divider -->
  <rect x="80" y="${isHook ? 610 : (200 + Math.ceil(slide.title.length / 25) * 55)}" width="60" height="4" rx="2" fill="${t.accentColor}" />

  <!-- Body -->
  <text x="80" y="${isHook ? 660 : (260 + Math.ceil(slide.title.length / 25) * 55)}" fill="${t.bodyColor}" font-size="26" font-weight="400" font-family="Inter, sans-serif" line-height="1.6">
    ${wrapSVGText(slide.body, 26, w - 160)}
  </text>

  ${isCta ? `
  <rect x="80" y="1100" width="200" height="56" rx="16" fill="${t.accentColor}" />
  <text x="180" y="1134" fill="#fff" font-size="22" font-weight="700" text-anchor="middle" font-family="Inter, sans-serif">Подпишись →</text>
  ` : ''}

  <!-- Page number -->
  <text x="${w - 80}" y="${h - 80}" fill="${t.numberColor}" font-size="16" font-weight="600" text-anchor="end" font-family="Inter, sans-serif">${slide.index} / ${total}</text>
</svg>`
}

function wrapSVGText(text: string, fontSize: number, maxWidth: number): string {
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.52))
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > charsPerLine && currentLine) {
      lines.push(currentLine.trim())
      currentLine = word
    } else {
      currentLine = (currentLine + ' ' + word).trim()
    }
  }
  if (currentLine) lines.push(currentLine.trim())

  return lines
    .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : fontSize * 1.3}">${escapeXML(line)}</tspan>`)
    .join('\n    ')
}

function escapeXML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
