'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import { SlideEditor } from '@/components/slide-editor'
import { TemplateCard } from '@/components/template-card'
import { GenerationProgress } from '@/components/generation-progress'
import { cn } from '@/lib/utils'

interface Slide {
  index: number
  title: string
  body: string
  imageKeywords: string[]
}

const MOCK_TEMPLATES = [
  { id: '1', name: 'Минимал', category: 'minimal', isPro: false },
  { id: '2', name: 'Яркий градиент', category: 'vibrant', isPro: false },
  { id: '3', name: 'Корпоративный', category: 'corporate', isPro: false },
  { id: '4', name: 'Lifestyle', category: 'lifestyle', isPro: false },
  { id: '5', name: 'Тёмная элегантность', category: 'dark', isPro: false },
  { id: '6', name: 'Neon', category: 'vibrant', isPro: true },
  { id: '7', name: 'Clean Pro', category: 'minimal', isPro: true },
  { id: '8', name: 'Bold Statement', category: 'dark', isPro: true },
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
  const [figmaUrl, setFigmaUrl] = useState('')

  const generateText = async () => {
    setIsGenerating(true)
    // Mock AI generation
    await new Promise((r) => setTimeout(r, 2000))
    const mockSlides: Slide[] = Array.from({ length: slideCount }, (_, i) => ({
      index: i + 1,
      title:
        i === 0
          ? 'Вы теряете 80% аудитории из-за этих ошибок'
          : i === slideCount - 1
            ? 'Сохрани и подпишись'
            : `Ошибка #${i}: Пример заголовка`,
      body:
        i === 0
          ? 'Узнайте, какие ошибки убивают ваши охваты и как их исправить'
          : i === slideCount - 1
            ? 'Было полезно? Сохрани пост и подпишись на @аккаунт чтобы не пропустить новые разборы'
            : `Подробное описание ошибки номер ${i}. Здесь будет текст с советами и примерами из практики.`,
      imageKeywords: ['marketing', 'social media'],
    }))
    setSlides(mockSlides)
    setIsGenerating(false)
    setStep(2)
  }

  const startGeneration = async () => {
    setStep(4)
    const stages = [
      { id: 'generating_text', progress: 15 },
      { id: 'finding_photos', progress: 35 },
      { id: 'generating_images', progress: 60 },
      { id: 'creating_figma', progress: 85 },
      { id: 'completed', progress: 100 },
    ]
    for (const stage of stages) {
      setGenerationStage(stage.id)
      setGenerationProgress(stage.progress)
      await new Promise((r) => setTimeout(r, 2000))
    }
    setFigmaUrl('https://www.figma.com/file/example')
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
                onChange={(e) => setTopic(e.target.value)}
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
                onChange={(e) => setCustomText(e.target.value)}
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
                onChange={(e) => setSlideCount(Number(e.target.value))}
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
                onChange={(e) => setTone(e.target.value)}
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
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateText}
            disabled={isGenerating || (mode === 'topic' ? !topic : !customText)}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Генерация...
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

      {/* Step 3: Choose template */}
      {step === 3 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Выберите шаблон</h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MOCK_TEMPLATES.map((t) => (
              <TemplateCard
                key={t.id}
                id={t.id}
                name={t.name}
                category={t.category}
                isPro={t.isPro}
                selected={selectedTemplate === t.id}
                onSelect={setSelectedTemplate}
              />
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
            {figmaUrl ? 'Карусель готова!' : 'Генерация карусели...'}
          </h1>

          <div className="bg-surface-light border border-border rounded-2xl p-8">
            <GenerationProgress currentStage={generationStage} progress={generationProgress} />
          </div>

          {figmaUrl && (
            <div className="text-center space-y-4">
              <a
                href={figmaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Открыть в Figma
              </a>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setStep(1)
                    setSlides([])
                    setSelectedTemplate('')
                    setFigmaUrl('')
                    setTopic('')
                    setGenerationStage('')
                    setGenerationProgress(0)
                  }}
                  className="text-sm text-text-muted hover:text-text transition-colors"
                >
                  Создать ещё одну
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
