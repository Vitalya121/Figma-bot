'use client'

import { forwardRef } from 'react'

interface SlideCompositeProps {
  backgroundImage?: string
  title: string
  body: string
  slideIndex: number
  totalSlides: number
  scale?: number
}

export const SlideComposite = forwardRef<HTMLDivElement, SlideCompositeProps>(
  function SlideComposite({ backgroundImage, title, body, slideIndex, totalSlides, scale = 1 }, ref) {
    const w = 1080 * scale
    const h = 1350 * scale
    const pad = 72 * scale
    const isHook = slideIndex === 1
    const isCta = slideIndex === totalSlides

    return (
      <div
        ref={ref}
        style={{
          width: w,
          height: h,
          position: 'relative',
          overflow: 'hidden',
          background: '#0a0a0f',
          fontFamily: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
        }}
      >
        {/* AI-generated background */}
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Dark gradient overlay for text readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: backgroundImage
              ? 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.6) 100%)'
              : 'transparent',
          }}
        />

        {/* Content overlay */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: pad,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isHook ? 'center' : 'flex-start',
          }}
        >
          {/* Slide number badge */}
          {!isHook && (
            <div
              style={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44 * scale,
                height: 44 * scale,
                borderRadius: 22 * scale,
                background: 'rgba(124, 58, 237, 0.9)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                fontSize: 18 * scale,
                fontWeight: 800,
                marginBottom: 24 * scale,
                marginTop: 10 * scale,
              }}
            >
              {String(slideIndex).padStart(2, '0')}
            </div>
          )}

          {/* Title */}
          <div
            style={{
              fontSize: (isHook ? 64 : 48) * scale,
              fontWeight: 900,
              lineHeight: 1.1,
              color: '#ffffff',
              marginBottom: 20 * scale,
              letterSpacing: '-0.03em',
              textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3)',
              maxWidth: '95%',
            }}
          >
            {title}
          </div>

          {/* Accent divider */}
          <div
            style={{
              width: 56 * scale,
              height: 4 * scale,
              borderRadius: 2 * scale,
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
              marginBottom: 20 * scale,
              boxShadow: '0 0 12px rgba(124,58,237,0.4)',
            }}
          />

          {/* Body text */}
          <div
            style={{
              fontSize: 26 * scale,
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400,
              maxWidth: '90%',
              textShadow: '0 1px 8px rgba(0,0,0,0.5)',
            }}
          >
            {body}
          </div>

          {/* CTA button */}
          {isCta && (
            <div
              style={{
                marginTop: 36 * scale,
                display: 'inline-flex',
                alignSelf: 'flex-start',
                alignItems: 'center',
                gap: 10 * scale,
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: '#fff',
                padding: `${16 * scale}px ${32 * scale}px`,
                borderRadius: 14 * scale,
                fontSize: 22 * scale,
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
              }}
            >
              Подпишись →
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: pad * 0.8,
            left: pad,
            right: pad,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          {/* Accent line */}
          <div
            style={{
              width: 36 * scale,
              height: 3 * scale,
              borderRadius: 2 * scale,
              background: 'rgba(124, 58, 237, 0.5)',
            }}
          />
          {/* Slide counter */}
          <div
            style={{
              fontSize: 16 * scale,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.35)',
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          >
            {slideIndex} / {totalSlides}
          </div>
        </div>
      </div>
    )
  },
)
