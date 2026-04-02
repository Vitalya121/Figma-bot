'use client'

import { useState, useRef, useCallback } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Download, RefreshCw, Upload, X, Image as ImageIcon, Copy, Check, ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import { SlideEditor } from '@/components/slide-editor'
import { GenerationProgress } from '@/components/generation-progress'
import { SlideRenderer, TEMPLATE_STYLES, slideToSVG } from '@/components/slide-renderer'
import type { SlideData, TemplateStyle } from '@/components/slide-renderer'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

const TEMPLATES = Object.values(TEMPLATE_STYLES)

export default function CreatePage() {
  const [step, setStep] = useState(1)
  const [topic, setTopic] = useState('')
  const [customText, setCustomText] = useState('')
  const [mode, setMode] = useState<'topic' | 'text'>('topic')
  const [slideCount, setSlideCount] = useState(7)
  const [tone, setTone] = useState('expert')
  const [language, setLanguage] = useState('ru')
  const [slides, setSlides] = useState<SlideData[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('modern-dark')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState('')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState('')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const slideImageInputRef = useRef<HTMLInputElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

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

  const handleSlideImageUpload = (slideIndex: number) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const updated = [...slides]
        updated[slideIndex] = { ...updated[slideIndex], backgroundImage: ev.target?.result as string }
        setSlides(updated)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const removeSlideImage = (slideIndex: number) => {
    const updated = [...slides]
    updated[slideIndex] = { ...updated[slideIndex], backgroundImage: undefined }
    setSlides(updated)
  }

  const templateStyle: TemplateStyle = TEMPLATE_STYLES[selectedTemplate] ?? TEMPLATE_STYLES['modern-dark']

  const startGeneration = async () => {
    setStep(4)
    setIsDone(false)
    setError('')

    try {
      // Stage 1: Confirm text
      setGenerationStage('generating_text')
      setGenerationProgress(10)
      await new Promise((r) => setTimeout(r, 500))

      // Stage 2: Generate images via Nano Banana Pro
      setGenerationStage('generating_images')
      setGenerationProgress(20)

      const slidesForApi = slides.filter((s) => !s.backgroundImage).map((s) => ({
        index: s.index,
        title: s.title,
        body: s.body,
        imageKeywords: s.imageKeywords,
      }))

      if (slidesForApi.length > 0) {
        // Generate images for slides that don't have custom backgrounds
        const imageResult = await api.generateImages({
          slides: slidesForApi,
          templateName: templateStyle.name,
          referenceImage: referenceImage ?? undefined,
        })

        if (imageResult.success && imageResult.data) {
          const updated = [...slides]
          for (const result of imageResult.data) {
            const idx = updated.findIndex((s) => s.index === result.index)
            if (idx !== -1 && result.imageUrl && !updated[idx].backgroundImage) {
              updated[idx] = { ...updated[idx], backgroundImage: result.imageUrl }
            }
          }
          setSlides(updated)
        }
      }

      // Stage 3: Compositing
      setGenerationStage('creating_figma')
      setGenerationProgress(90)
      await new Promise((r) => setTimeout(r, 800))

      // Done
      setGenerationStage('completed')
      setGenerationProgress(100)
      setIsDone(true)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка генерации изображений')
      // Still show result with template backgrounds even if image gen fails
      setGenerationStage('completed')
      setGenerationProgress(100)
      setIsDone(true)
    }
  }

  const exportSlide = useCallback(async (index: number): Promise<Blob | null> => {
    const { toPng } = await import('html-to-image')
    const el = slideRefs.current[index]
    if (!el) return null
    const dataUrl = await toPng(el, { width: 1080, height: 1350, pixelRatio: 1 })
    return (await fetch(dataUrl)).blob()
  }, [])

  const downloadSlide = async (index: number) => {
    const blob = await exportSlide(index)
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
        const blob = await exportSlide(i)
        if (blob) zip.file(`slide-${i + 1}.png`, blob)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(content)
      a.download = `carousel-${topic.slice(0, 30).replace(/\s+/g, '-') || 'slides'}.zip`
      a.click()
    } finally { setIsExporting(false) }
  }

  const downloadFigmaSVG = () => {
    const JSZipPromise = import('jszip')
    JSZipPromise.then(async ({ default: JSZip }) => {
      const zip = new JSZip()
      for (const slide of slides) {
        const svg = slideToSVG(slide, slides.length, templateStyle)
        zip.file(`slide-${slide.index}.svg`, svg)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(content)
      a.download = `figma-carousel-${topic.slice(0, 30).replace(/\s+/g, '-') || 'slides'}.zip`
      a.click()
    })
  }

  const copySlides = () => {
    navigator.clipboard.writeText(slides.map((s) => `# Слайд ${s.index}\n**${s.title}**\n${s.body}`).join('\n\n---\n\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setStep(1); setSlides([]); setSelectedTemplate('modern-dark'); setIsDone(false)
    setTopic(''); setGenerationStage(''); setGenerationProgress(0)
    setReferenceImage(null); setError(''); setActiveSlide(0)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Steps */}
      <div className="flex items-center gap-2 mb-10">
        {['Контент', 'Редактирование', 'Дизайн', 'Результат'].map((label, i) => (
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

      {/* Step 1 */}
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
              <select value={slideCount} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSlideCount(Number(e.target.value))} className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary">
                {[5, 7, 10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Тон</label>
              <select value={tone} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTone(e.target.value)} className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary">
                <option value="expert">Экспертный</option>
                <option value="friendly">Дружелюбный</option>
                <option value="provocative">Провокационный</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Язык</label>
              <select value={language} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)} className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary">
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

      {/* Step 3: Design */}
      {step === 3 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Дизайн карусели</h1>

          {/* Reference */}
          <div className="bg-surface-light border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Upload className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Референс (необязательно)</span>
            </div>
            <p className="text-xs text-text-muted mb-3">Загрузите скриншот для вдохновения</p>
            {referenceImage ? (
              <div className="relative inline-block">
                <img src={referenceImage} alt="" className="h-28 rounded-lg border border-border object-cover" />
                <button onClick={() => { setReferenceImage(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl px-5 py-3 text-text-muted text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />Выбрать изображение
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleReferenceUpload} className="hidden" />
          </div>

          {/* Template grid */}
          <div>
            <h2 className="text-sm font-medium text-text-muted mb-3">Выберите стиль</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                  className={cn('relative rounded-xl border-2 overflow-hidden transition-all text-left',
                    selectedTemplate === t.id ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]' : 'border-border hover:border-text-muted/30')}>
                  <div className="aspect-[4/5] overflow-hidden">
                    <SlideRenderer
                      slide={{ index: 1, title: slides[0]?.title?.slice(0, 30) || 'Заголовок', body: slides[0]?.body?.slice(0, 50) || 'Текст слайда...', imageKeywords: [] }}
                      total={slides.length || 7}
                      template={t}
                      scale={0.155}
                    />
                  </div>
                  <div className="p-2 bg-surface-light">
                    <span className="text-xs font-medium">{t.name}</span>
                  </div>
                  {selectedTemplate === t.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Per-slide images */}
          <div>
            <h2 className="text-sm font-medium text-text-muted mb-3">Фоновые изображения для слайдов</h2>
            <p className="text-xs text-text-muted mb-3">Загрузите свои фото — они будут использованы как фон с затемнением</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {slides.map((slide, i) => (
                <div key={i} className="relative">
                  {slide.backgroundImage ? (
                    <div className="relative aspect-[4/5] rounded-lg overflow-hidden border border-border">
                      <img src={slide.backgroundImage} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button onClick={() => removeSlideImage(i)} className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
                      </div>
                      <div className="absolute bottom-1 left-1 text-[10px] text-white/70 bg-black/40 px-1 rounded">{i + 1}</div>
                    </div>
                  ) : (
                    <button onClick={() => handleSlideImageUpload(i)}
                      className="w-full aspect-[4/5] rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-1 transition-colors">
                      <ImageIcon className="w-4 h-4 text-text-muted/40" />
                      <span className="text-[10px] text-text-muted/40">{i + 1}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 border border-border py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Назад</button>
            <button onClick={startGeneration} className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
              Сгенерировать <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 4 && (
        <div className="space-y-8">
          <h1 className="text-2xl font-bold">{isDone ? 'Карусель готова!' : 'Генерация...'}</h1>

          {!isDone && (
            <div className="bg-surface-light border border-border rounded-2xl p-8">
              <GenerationProgress currentStage={generationStage} progress={generationProgress} />
            </div>
          )}

          {isDone && (
            <div className="space-y-6">
              {/* Slide viewer */}
              <div className="bg-surface-light border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-text-muted">Слайд {activeSlide + 1} из {slides.length}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))} disabled={activeSlide === 0} className="w-8 h-8 rounded-full border border-border flex items-center justify-center disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))} disabled={activeSlide === slides.length - 1} className="w-8 h-8 rounded-full border border-border flex items-center justify-center disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div style={{ width: 360, height: 450, overflow: 'hidden', borderRadius: 12 }} className="shadow-2xl">
                    <SlideRenderer slide={slides[activeSlide]} total={slides.length} template={templateStyle} scale={360 / 1080} />
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {slides.map((slide, i) => (
                    <button key={i} onClick={() => setActiveSlide(i)}
                      className={cn('flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                        i === activeSlide ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-80')}>
                      <div style={{ width: 54, height: 67, overflow: 'hidden' }}>
                        <SlideRenderer slide={slide} total={slides.length} template={templateStyle} scale={54 / 1080} />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Per-slide actions */}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => downloadSlide(activeSlide)} className="flex-1 border border-border hover:border-primary py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors">
                    <Download className="w-3.5 h-3.5" />PNG 1080×1350
                  </button>
                  <button onClick={() => handleSlideImageUpload(activeSlide)} className="flex-1 border border-border hover:border-primary py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors">
                    <ImageIcon className="w-3.5 h-3.5" />{slides[activeSlide]?.backgroundImage ? 'Заменить фон' : 'Добавить фон'}
                  </button>
                </div>
              </div>

              {/* Hidden full-size for export */}
              <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {slides.map((slide, i) => (
                  <SlideRenderer key={i} ref={(el) => { slideRefs.current[i] = el }} slide={slide} total={slides.length} template={templateStyle} scale={1} />
                ))}
              </div>

              {/* Export actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={downloadAll} disabled={isExporting}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-3.5 rounded-xl text-sm font-medium">
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isExporting ? 'Экспорт...' : `Скачать PNG (ZIP)`}
                </button>
                <button onClick={downloadFigmaSVG}
                  className="flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary/10 py-3.5 rounded-xl text-sm font-medium">
                  <FileDown className="w-4 h-4" />
                  SVG для Figma
                </button>
                <button onClick={copySlides}
                  className="flex items-center justify-center gap-2 border border-border hover:border-primary py-3.5 rounded-xl text-sm font-medium">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Скопировано!' : 'Копировать текст'}
                </button>
              </div>

              <p className="text-xs text-text-muted text-center">
                SVG файлы можно импортировать в Figma через File → Import (Ctrl+Shift+K) для редактирования
              </p>

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
