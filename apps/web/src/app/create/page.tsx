'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Download, RefreshCw, Upload, X, Image as ImageIcon, Copy, Check } from 'lucide-react'
import { SlideEditor } from '@/components/slide-editor'
import { GenerationProgress } from '@/components/generation-progress'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

interface Slide {
  index: number
  title: string
  body: string
  imageKeywords: string[]
}

const TEMPLATES = [
  {
    id: 'minimal-clean',
    name: 'Чистый минимал',
    category: 'minimal',
    isPro: false,
    bg: 'from-white to-gray-100',
    accent: '#1a1a2e',
    textColor: 'text-gray-900',
    preview: { bg: 'bg-gradient-to-br from-white to-gray-50', text: 'text-gray-900', accent: 'bg-gray-900' },
  },
  {
    id: 'vibrant-gradient',
    name: 'Яркий градиент',
    category: 'vibrant',
    isPro: false,
    bg: 'from-purple-600 to-pink-500',
    accent: '#f59e0b',
    textColor: 'text-white',
    preview: { bg: 'bg-gradient-to-br from-purple-600 to-pink-500', text: 'text-white', accent: 'bg-amber-400' },
  },
  {
    id: 'dark-elegant',
    name: 'Тёмная элегантность',
    category: 'dark',
    isPro: false,
    bg: 'from-gray-900 to-gray-800',
    accent: '#a78bfa',
    textColor: 'text-white',
    preview: { bg: 'bg-gradient-to-br from-gray-900 to-gray-800', text: 'text-white', accent: 'bg-violet-400' },
  },
  {
    id: 'corporate-blue',
    name: 'Корпоративный',
    category: 'corporate',
    isPro: false,
    bg: 'from-blue-900 to-blue-700',
    accent: '#38bdf8',
    textColor: 'text-white',
    preview: { bg: 'bg-gradient-to-br from-blue-900 to-blue-700', text: 'text-white', accent: 'bg-sky-400' },
  },
  {
    id: 'lifestyle-warm',
    name: 'Lifestyle',
    category: 'lifestyle',
    isPro: false,
    bg: 'from-orange-50 to-amber-50',
    accent: '#ea580c',
    textColor: 'text-gray-800',
    preview: { bg: 'bg-gradient-to-br from-orange-50 to-amber-100', text: 'text-gray-800', accent: 'bg-orange-500' },
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    category: 'vibrant',
    isPro: true,
    bg: 'from-indigo-950 to-purple-950',
    accent: '#22d3ee',
    textColor: 'text-white',
    preview: { bg: 'bg-gradient-to-br from-indigo-950 to-purple-950', text: 'text-cyan-300', accent: 'bg-cyan-400' },
  },
  {
    id: 'mono-type',
    name: 'Mono Type',
    category: 'minimal',
    isPro: true,
    bg: 'from-neutral-100 to-neutral-200',
    accent: '#000000',
    textColor: 'text-black',
    preview: { bg: 'bg-gradient-to-br from-neutral-100 to-neutral-200', text: 'text-black', accent: 'bg-black' },
  },
  {
    id: 'bold-statement',
    name: 'Bold Statement',
    category: 'dark',
    isPro: false,
    bg: 'from-black to-zinc-900',
    accent: '#ef4444',
    textColor: 'text-white',
    preview: { bg: 'bg-gradient-to-br from-black to-zinc-900', text: 'text-white', accent: 'bg-red-500' },
  },
]

export default function CreatePage() {
  const [step, setStep] = useState(1)
  const [topic, setTopic] = useState('')
  const [customText, setCustomText] = useState('')
  const [mode, setMode] = useState<'topic' | 'text'>('topic')
  const [slideCount, setSlideCount] = useState(7)
  const [tone, setTone] = useState('expert')
  const [language, setLanguage] = useState('ru')
  const [slides, setSlides] = useState<Slide[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState('')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState('')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateText = async () => {
    setIsGenerating(true)
    setError('')

    if (mode === 'text') {
      // Parse custom text
      const parts = customText.split(/\n---\n|\n\n\n/).filter(Boolean)
      const parsed: Slide[] = parts.map((part, i) => {
        const lines = part.trim().split('\n')
        return {
          index: i + 1,
          title: lines[0]?.replace(/^#+\s*/, '') ?? '',
          body: lines.slice(1).join('\n').trim(),
          imageKeywords: lines[0]?.split(' ').slice(0, 3) ?? [],
        }
      })
      setSlides(parsed)
      setIsGenerating(false)
      setStep(2)
      return
    }

    try {
      const result = await api.generateSlides({ topic, slideCount, tone, language })
      if (result.success && result.data) {
        setSlides(result.data)
        setStep(2)
      } else {
        setError('Не удалось сгенерировать текст. Попробуйте ещё раз.')
      }
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
    reader.onload = (ev) => {
      setReferenceImage(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const selectedTpl = TEMPLATES.find((t) => t.id === selectedTemplate)

  const startGeneration = async () => {
    setStep(4)
    setIsDone(false)

    const stages = [
      { id: 'generating_text', progress: 15, delay: 1500 },
      { id: 'finding_photos', progress: 35, delay: 2000 },
      { id: 'generating_images', progress: 60, delay: 3000 },
      { id: 'creating_figma', progress: 85, delay: 2500 },
      { id: 'completed', progress: 100, delay: 1000 },
    ]

    for (const stage of stages) {
      setGenerationStage(stage.id)
      setGenerationProgress(stage.progress)
      await new Promise((r) => setTimeout(r, stage.delay))
    }

    setIsDone(true)
  }

  const copySlides = () => {
    const text = slides.map((s) => `# Слайд ${s.index}\n**${s.title}**\n${s.body}`).join('\n\n---\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setStep(1)
    setSlides([])
    setSelectedTemplate('')
    setIsDone(false)
    setTopic('')
    setGenerationStage('')
    setGenerationProgress(0)
    setReferenceImage(null)
    setError('')
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {['Контент', 'Редактирование', 'Шаблон', 'Результат'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step > i + 1 && 'bg-green-500/20 text-green-400',
                step === i + 1 && 'bg-primary text-white',
                step < i + 1 && 'bg-surface-lighter text-text-muted',
              )}
            >
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={cn('text-sm hidden sm:block', step === i + 1 ? 'text-text' : 'text-text-muted')}>
              {label}
            </span>
            {i < 3 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Content input */}
      {step === 1 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Создать карусель</h1>

          <div className="flex gap-2">
            <button
              onClick={() => setMode('topic')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm transition-colors',
                mode === 'topic' ? 'bg-primary text-white' : 'bg-surface-light text-text-muted',
              )}
            >
              По теме
            </button>
            <button
              onClick={() => setMode('text')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm transition-colors',
                mode === 'text' ? 'bg-primary text-white' : 'bg-surface-light text-text-muted',
              )}
            >
              Свой текст
            </button>
          </div>

          {mode === 'topic' ? (
            <div>
              <label className="block text-sm text-text-muted mb-2">Тема карусели</label>
              <input
                type="text"
                value={topic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
                placeholder="Например: 5 ошибок в таргетированной рекламе"
                maxLength={500}
                className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-muted/40 outline-none focus:border-primary transition-colors"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-text-muted mb-2">
                Текст (разделяйте слайды через ---)
              </label>
              <textarea
                value={customText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomText(e.target.value)}
                placeholder={'Заголовок первого слайда\nТекст первого слайда\n---\nЗаголовок второго слайда\nТекст второго слайда'}
                rows={10}
                maxLength={10000}
                className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-muted/40 outline-none focus:border-primary transition-colors resize-none font-mono text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-2">Слайдов</label>
              <select
                value={slideCount}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSlideCount(Number(e.target.value))}
                className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary"
              >
                {[5, 7, 10, 12, 15].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Тон</label>
              <select
                value={tone}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTone(e.target.value)}
                className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary"
              >
                <option value="expert">Экспертный</option>
                <option value="friendly">Дружелюбный</option>
                <option value="provocative">Провокационный</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Язык</label>
              <select
                value={language}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)}
                className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={generateText}
            disabled={isGenerating || (mode === 'topic' ? !topic : !customText)}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI генерирует текст...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Сгенерировать текст
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Edit slides */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Редактирование слайдов</h1>
            <span className="text-sm text-text-muted">{slides.length} слайдов</span>
          </div>

          <div className="space-y-3">
            {slides.map((slide, i) => (
              <SlideEditor
                key={slide.index}
                index={slide.index}
                title={slide.title}
                body={slide.body}
                total={slides.length}
                onTitleChange={(v) => {
                  const updated = [...slides]
                  updated[i] = { ...updated[i], title: v }
                  setSlides(updated)
                }}
                onBodyChange={(v) => {
                  const updated = [...slides]
                  updated[i] = { ...updated[i], body: v }
                  setSlides(updated)
                }}
                onDelete={() => {
                  setSlides(slides.filter((_, j) => j !== i).map((s, j) => ({ ...s, index: j + 1 })))
                }}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-border hover:border-text-muted py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Назад
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Далее <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Choose template + reference */}
      {step === 3 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Выберите шаблон</h1>

          {/* Reference upload */}
          <div className="bg-surface-light border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Upload className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Загрузить референс (необязательно)</span>
            </div>
            <p className="text-xs text-text-muted mb-3">
              Загрузите скриншот карусели, стиль которой хотите повторить
            </p>

            {referenceImage ? (
              <div className="relative inline-block">
                <img
                  src={referenceImage}
                  alt="Reference"
                  className="h-32 rounded-lg border border-border object-cover"
                />
                <button
                  onClick={() => setReferenceImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl px-6 py-4 text-text-muted hover:text-text text-sm transition-colors flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Выбрать изображение
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleReferenceUpload}
              className="hidden"
            />
          </div>

          {/* Template grid with visual previews */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={cn(
                  'relative rounded-xl border-2 overflow-hidden transition-all text-left',
                  selectedTemplate === t.id
                    ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'border-border hover:border-text-muted/30',
                )}
              >
                {/* Visual preview of the template */}
                <div className={cn('aspect-[4/5] p-3 flex flex-col justify-between', t.preview.bg)}>
                  {/* Mini slide preview */}
                  <div>
                    <div className={cn('h-1.5 rounded-full w-2/3 mb-1.5', t.preview.accent)} />
                    <div className={cn('text-[8px] font-bold leading-tight', t.preview.text)}>
                      {slides[0]?.title?.slice(0, 30) || 'Заголовок слайда'}
                    </div>
                  </div>
                  <div>
                    <div className={cn('h-1 rounded-full w-full mb-1 opacity-20', t.preview.accent)} />
                    <div className={cn('h-1 rounded-full w-4/5 mb-1 opacity-20', t.preview.accent)} />
                    <div className={cn('h-1 rounded-full w-3/5 opacity-20', t.preview.accent)} />
                  </div>
                  <div className={cn('text-[6px] opacity-40', t.preview.text)}>1/{slides.length || 7}</div>
                </div>

                <div className="p-2.5 bg-surface-light">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{t.name}</span>
                    {t.isPro && (
                      <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-medium">PRO</span>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted">{t.category}</span>
                </div>

                {selectedTemplate === t.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 border border-border hover:border-text-muted py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Назад
            </button>
            <button
              onClick={startGeneration}
              disabled={!selectedTemplate}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Сгенерировать карусель <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Generation / Result */}
      {step === 4 && (
        <div className="space-y-8">
          <h1 className="text-2xl font-bold">
            {isDone ? 'Карусель готова!' : 'Генерация карусели...'}
          </h1>

          <div className="bg-surface-light border border-border rounded-2xl p-8">
            <GenerationProgress currentStage={generationStage} progress={generationProgress} />
          </div>

          {isDone && (
            <div className="space-y-6">
              {/* Preview slides */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Превью слайдов</h2>
                <div className="flex gap-3 overflow-x-auto pb-4">
                  {slides.map((slide) => (
                    <div
                      key={slide.index}
                      className={cn(
                        'flex-shrink-0 w-48 aspect-[4/5] rounded-xl p-4 flex flex-col justify-between',
                        selectedTpl?.preview.bg ?? 'bg-gradient-to-br from-gray-900 to-gray-800',
                      )}
                    >
                      <div>
                        <div className={cn('text-xs font-bold leading-tight mb-2', selectedTpl?.preview.text ?? 'text-white')}>
                          {slide.title}
                        </div>
                        <div className={cn('text-[9px] leading-relaxed opacity-70', selectedTpl?.preview.text ?? 'text-white')}>
                          {slide.body.slice(0, 80)}{slide.body.length > 80 ? '...' : ''}
                        </div>
                      </div>
                      <div className={cn('text-[8px] opacity-40', selectedTpl?.preview.text ?? 'text-white')}>
                        {slide.index}/{slides.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={copySlides}
                  className="flex items-center justify-center gap-2 border border-border hover:border-primary py-3.5 rounded-xl text-sm font-medium transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Скопировано!' : 'Копировать текст'}
                </button>
                <button
                  onClick={() => {
                    const text = slides.map((s) => `Слайд ${s.index}: ${s.title}\n${s.body}`).join('\n\n---\n\n')
                    const blob = new Blob([text], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `carousel-${topic.slice(0, 30).replace(/\s+/g, '-')}.txt`
                    a.click()
                  }}
                  className="flex items-center justify-center gap-2 border border-border hover:border-primary py-3.5 rounded-xl text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Скачать текст
                </button>
              </div>

              {/* Info about Figma */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 text-center">
                <p className="text-sm text-text-muted mb-2">
                  Генерация Figma-файла будет доступна после авторизации и подключения Figma-аккаунта
                </p>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/auth/google`}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  Войти через Google
                </a>
              </div>

              <div className="text-center">
                <button onClick={reset} className="text-sm text-text-muted hover:text-text transition-colors">
                  Создать ещё одну карусель
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
