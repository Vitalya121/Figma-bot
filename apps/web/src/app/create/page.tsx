'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Download, RefreshCw, Upload, X, Image as ImageIcon, Copy, Check, ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import { SlideEditor } from '@/components/slide-editor'
import { GenerationProgress } from '@/components/generation-progress'
import { SlideComposite } from '@/components/slide-composite'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

interface Slide {
  index: number
  title: string
  body: string
  imageKeywords: string[]
  generatedImage?: string // data:image/png;base64,...
}

export default function CreatePage() {
  const [step, setStep] = useState(1)
  const [topic, setTopic] = useState('')
  const [customText, setCustomText] = useState('')
  const [mode, setMode] = useState<'topic' | 'text'>('topic')
  const [slideCount, setSlideCount] = useState(5)
  const [tone, setTone] = useState('expert')
  const [language, setLanguage] = useState('ru')
  const [slides, setSlides] = useState<Slide[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState('')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState('')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [regeneratingSlide, setRegeneratingSlide] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const compositeRefs = useRef<(HTMLDivElement | null)[]>([])

  const generateText = async () => {
    setIsGenerating(true)
    setError('')

    if (mode === 'text') {
      const parts = customText.split(/\n---\n|\n\n\n/).filter(Boolean)
      setSlides(parts.map((part, i) => {
        const lines = part.trim().split('\n')
        return { index: i + 1, title: lines[0]?.replace(/^#+\s*/, '') ?? '', body: lines.slice(1).join('\n').trim(), imageKeywords: [] }
      }))
      setIsGenerating(false)
      setStep(2)
      return
    }

    try {
      const result = await api.generateSlides({ topic, slideCount, tone, language })
      if (result.success && result.data) {
        setSlides(result.data)
        setStep(2)
      } else setError('Не удалось сгенерировать текст')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка генерации')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setReferenceImage(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const startGeneration = async () => {
    setStep(4)
    setIsDone(false)
    setError('')
    setActiveSlide(0)

    try {
      setGenerationStage('generating_text')
      setGenerationProgress(5)

      // Generate all slide images via Nano Banana Pro
      setGenerationStage('generating_images')

      const slidesForApi = slides.map((s) => ({
        index: s.index,
        title: s.title,
        body: s.body,
        totalSlides: slides.length,
        imageKeywords: s.imageKeywords,
      }))

      // Generate one by one with progress updates
      const updated = [...slides]
      for (let i = 0; i < slidesForApi.length; i++) {
        setGenerationProgress(10 + Math.round((i / slidesForApi.length) * 80))

        try {
          const result = await api.generateImages({
            slides: [slidesForApi[i]],
            referenceImage: referenceImage ?? undefined,
          })

          if (result.success && result.data[0]?.imageUrl) {
            updated[i] = { ...updated[i], generatedImage: result.data[0].imageUrl }
            setSlides([...updated])
          }
        } catch (err) {
          console.error(`Slide ${i + 1} generation failed:`, err)
        }
      }

      setGenerationStage('creating_figma')
      setGenerationProgress(95)
      await new Promise((r) => setTimeout(r, 500))

      setGenerationStage('completed')
      setGenerationProgress(100)
      setIsDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка генерации')
      setGenerationStage('completed')
      setGenerationProgress(100)
      setIsDone(true)
    }
  }

  const regenerateSlide = async (index: number) => {
    const slide = slides[index]
    if (!slide) return
    setRegeneratingSlide(index)

    try {
      const result = await api.regenerateSlideImage({
        slideIndex: slide.index,
        totalSlides: slides.length,
        title: slide.title,
        bodyText: slide.body,
        referenceImage: referenceImage ?? undefined,
      })

      if (result.success && result.data.imageUrl) {
        const updated = [...slides]
        updated[index] = { ...updated[index], generatedImage: result.data.imageUrl }
        setSlides(updated)
      }
    } catch (err) {
      console.error('Regeneration failed:', err)
    } finally {
      setRegeneratingSlide(null)
    }
  }

  const exportComposite = async (index: number): Promise<Blob | null> => {
    const { toPng } = await import('html-to-image')
    const el = compositeRefs.current[index]
    if (!el) return null
    const dataUrl = await toPng(el, { width: 1080, height: 1350, pixelRatio: 1 })
    return (await fetch(dataUrl)).blob()
  }

  const downloadSlide = async (index: number) => {
    const blob = await exportComposite(index)
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `slide-${index + 1}.png`
    a.click()
  }

  const downloadAll = async () => {
    setIsExporting(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      for (let i = 0; i < slides.length; i++) {
        const blob = await exportComposite(i)
        if (blob) zip.file(`slide-${i + 1}.png`, blob)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(content)
      a.download = `carousel-${topic.slice(0, 30).replace(/\s+/g, '-') || 'slides'}.zip`
      a.click()
    } finally { setIsExporting(false) }
  }

  const copySlides = () => {
    navigator.clipboard.writeText(slides.map((s) => `# Слайд ${s.index}\n**${s.title}**\n${s.body}`).join('\n\n---\n\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setStep(1); setSlides([]); setIsDone(false); setTopic('')
    setGenerationStage(''); setGenerationProgress(0)
    setReferenceImage(null); setError(''); setActiveSlide(0)
  }

  const generatedCount = slides.filter((s) => s.generatedImage).length

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Steps */}
      <div className="flex items-center gap-2 mb-10">
        {['Контент', 'Редактирование', 'Референс', 'Результат'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              step > i + 1 && 'bg-green-500/20 text-green-400',
              step === i + 1 && 'bg-primary text-white',
              step < i + 1 && 'bg-surface-lighter text-text-muted')}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={cn('text-sm hidden sm:block', step === i + 1 ? 'text-text' : 'text-text-muted')}>{label}</span>
            {i < 3 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Content */}
      {step === 1 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Создать карусель</h1>
          <div className="flex gap-2">
            <button onClick={() => setMode('topic')} className={cn('px-4 py-2 rounded-lg text-sm', mode === 'topic' ? 'bg-primary text-white' : 'bg-surface-light text-text-muted')}>По теме</button>
            <button onClick={() => setMode('text')} className={cn('px-4 py-2 rounded-lg text-sm', mode === 'text' ? 'bg-primary text-white' : 'bg-surface-light text-text-muted')}>Свой текст</button>
          </div>
          {mode === 'topic' ? (
            <div>
              <label className="block text-sm text-text-muted mb-2">Тема карусели</label>
              <input type="text" value={topic} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)} placeholder="Например: 5 ошибок в таргетированной рекламе" maxLength={500} className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-muted/40 outline-none focus:border-primary" />
            </div>
          ) : (
            <textarea value={customText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomText(e.target.value)} placeholder="Заголовок\nТекст\n---\nЗаголовок 2" rows={8} className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-muted/40 outline-none focus:border-primary resize-none font-mono text-sm" />
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-2">Слайдов</label>
              <select value={slideCount} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSlideCount(Number(e.target.value))} className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text outline-none">
                {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Тон</label>
              <select value={tone} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTone(e.target.value)} className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text outline-none">
                <option value="expert">Экспертный</option>
                <option value="friendly">Дружелюбный</option>
                <option value="provocative">Провокационный</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Язык</label>
              <select value={language} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)} className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text outline-none">
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}
          <button onClick={generateText} disabled={isGenerating || (mode === 'topic' ? !topic : !customText)} className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2">
            {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" />AI генерирует...</> : <><RefreshCw className="w-5 h-5" />Сгенерировать текст</>}
          </button>
        </div>
      )}

      {/* Step 2: Edit */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Редактирование слайдов</h1>
            <span className="text-sm text-text-muted">{slides.length} слайдов</span>
          </div>
          <div className="space-y-3">
            {slides.map((slide, i) => (
              <SlideEditor key={i} index={slide.index} title={slide.title} body={slide.body} total={slides.length}
                onTitleChange={(v) => { const u = [...slides]; u[i] = { ...u[i], title: v }; setSlides(u) }}
                onBodyChange={(v) => { const u = [...slides]; u[i] = { ...u[i], body: v }; setSlides(u) }}
                onDelete={() => setSlides(slides.filter((_, j) => j !== i).map((s, j) => ({ ...s, index: j + 1 })))}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-border py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Назад</button>
            <button onClick={() => setStep(3)} className="flex-1 bg-primary text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">Далее <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Step 3: Reference + Launch */}
      {step === 3 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Стиль карусели</h1>

          {/* Reference upload */}
          <div className="bg-surface-light border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Upload className="w-5 h-5 text-primary" />
              <span className="font-medium">Загрузить референс</span>
            </div>
            <p className="text-sm text-text-muted mb-4">
              Загрузите скриншот карусели, стиль которой хотите повторить. Nano Banana Pro будет следовать этому стилю при генерации каждого слайда.
            </p>

            {referenceImage ? (
              <div className="relative inline-block">
                <img src={referenceImage} alt="" className="h-48 rounded-xl border border-border object-cover shadow-lg" />
                <button onClick={() => { setReferenceImage(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl px-8 py-10 text-text-muted hover:text-text transition-colors flex flex-col items-center gap-3">
                <ImageIcon className="w-8 h-8 opacity-40" />
                <span className="text-sm">Нажмите, чтобы загрузить референс</span>
                <span className="text-xs text-text-muted/60">PNG, JPG до 10 МБ</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleReferenceUpload} className="hidden" />
          </div>

          {!referenceImage && (
            <div className="bg-surface-light/50 border border-border/50 rounded-xl p-4 text-center">
              <p className="text-sm text-text-muted">Без референса Nano Banana Pro создаст дизайн в современном тёмном стиле</p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-surface-light border border-border rounded-xl p-5">
            <h3 className="font-medium mb-3">Что будет сгенерировано:</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {slides.length} слайдов с полным дизайном</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Тематические графики и иллюстрации</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Текст на карточках: заголовки + описания</li>
              {referenceImage && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Стиль по вашему референсу</li>}
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Готовые PNG 1080×1350 для Instagram</li>
            </ul>
            <p className="text-xs text-text-muted mt-3">Генерация займёт ~{slides.length * 10}-{slides.length * 15} секунд</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 border border-border py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Назад</button>
            <button onClick={startGeneration} className="flex-1 bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              Сгенерировать дизайн <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 4 && (
        <div className="space-y-8">
          <h1 className="text-2xl font-bold">{isDone ? 'Карусель готова!' : 'Nano Banana Pro генерирует дизайн...'}</h1>

          {!isDone && (
            <div className="space-y-4">
              <div className="bg-surface-light border border-border rounded-2xl p-8">
                <GenerationProgress currentStage={generationStage} progress={generationProgress} />
              </div>
              {generatedCount > 0 && (
                <p className="text-sm text-text-muted text-center">Сгенерировано {generatedCount} из {slides.length} слайдов...</p>
              )}
              {/* Show slides as they generate */}
              {generatedCount > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {slides.map((slide, i) => (
                    <div key={i} className="flex-shrink-0 w-20 aspect-[4/5] rounded-lg overflow-hidden border border-border bg-surface-lighter">
                      {slide.generatedImage ? (
                        <div style={{ width: 80, height: 100, overflow: 'hidden' }}>
                          <SlideComposite
                            backgroundImage={slide.generatedImage}
                            title={slide.title}
                            body=""
                            slideIndex={slide.index}
                            totalSlides={slides.length}
                            scale={80 / 1080}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-text-muted/30" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isDone && (
            <div className="space-y-6">
              {error && <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-400 text-sm">{error}</div>}

              {/* Main slide viewer */}
              <div className="bg-surface-light border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-text-muted">Слайд {activeSlide + 1} из {slides.length}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))} disabled={activeSlide === 0}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))} disabled={activeSlide === slides.length - 1}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Active slide — composite preview */}
                <div className="flex justify-center">
                  <div style={{ width: 360, height: 450, overflow: 'hidden', borderRadius: 12 }} className="shadow-2xl">
                    <SlideComposite
                      backgroundImage={slides[activeSlide]?.generatedImage}
                      title={slides[activeSlide]?.title ?? ''}
                      body={slides[activeSlide]?.body ?? ''}
                      slideIndex={slides[activeSlide]?.index ?? 1}
                      totalSlides={slides.length}
                      scale={360 / 1080}
                    />
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 justify-center">
                  {slides.map((slide, i) => (
                    <button key={i} onClick={() => setActiveSlide(i)}
                      className={cn('flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                        i === activeSlide ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-80')}>
                      <div style={{ width: 54, height: 67, overflow: 'hidden' }}>
                        <SlideComposite
                          backgroundImage={slide.generatedImage}
                          title={slide.title}
                          body={slide.body}
                          slideIndex={slide.index}
                          totalSlides={slides.length}
                          scale={54 / 1080}
                        />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Per-slide actions */}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => downloadSlide(activeSlide)} disabled={!slides[activeSlide]?.generatedImage}
                    className="flex-1 border border-border hover:border-primary py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30">
                    <Download className="w-3.5 h-3.5" />Скачать PNG
                  </button>
                  <button onClick={() => regenerateSlide(activeSlide)} disabled={regeneratingSlide !== null}
                    className="flex-1 border border-border hover:border-primary py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-30">
                    {regeneratingSlide === activeSlide ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Перегенерировать
                  </button>
                </div>
              </div>

              {/* Hidden full-size composites for PNG export */}
              <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {slides.map((slide, i) => (
                  <SlideComposite
                    key={i}
                    ref={(el) => { compositeRefs.current[i] = el }}
                    backgroundImage={slide.generatedImage}
                    title={slide.title}
                    body={slide.body}
                    slideIndex={slide.index}
                    totalSlides={slides.length}
                    scale={1}
                  />
                ))}
              </div>

              {/* Export actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={downloadAll} disabled={isExporting || generatedCount === 0}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-3.5 rounded-xl text-sm font-medium">
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isExporting ? 'Экспорт...' : `Скачать все ${generatedCount} слайдов (ZIP)`}
                </button>
                <button onClick={copySlides}
                  className="flex items-center justify-center gap-2 border border-border hover:border-primary py-3.5 rounded-xl text-sm font-medium">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Скопировано!' : 'Копировать текст слайдов'}
                </button>
              </div>

              <div className="text-center">
                <button onClick={reset} className="text-sm text-text-muted hover:text-text">Создать ещё карусель</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
