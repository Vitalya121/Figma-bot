'use client'

import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Stage {
  id: string
  label: string
}

const STAGES: Stage[] = [
  { id: 'generating_text', label: 'Генерация текста' },
  { id: 'finding_photos', label: 'Подбор фото' },
  { id: 'generating_images', label: 'Создание изображений (Nano Banana Pro)' },
  { id: 'creating_figma', label: 'Сборка в Figma' },
  { id: 'completed', label: 'Готово!' },
]

interface GenerationProgressProps {
  currentStage: string
  progress: number
}

export function GenerationProgress({ currentStage, progress }: GenerationProgressProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage)

  return (
    <div className="space-y-4">
      <div className="w-full bg-surface-lighter rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-3">
        {STAGES.map((stage, i) => {
          const isDone = i < currentIndex || currentStage === 'completed'
          const isCurrent = i === currentIndex && currentStage !== 'completed'

          return (
            <div key={stage.id} className="flex items-center gap-3">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                  isDone && 'bg-green-500/20 text-green-400',
                  isCurrent && 'bg-primary/20 text-primary',
                  !isDone && !isCurrent && 'bg-surface-lighter text-text-muted/30',
                )}
              >
                {isDone ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-xs">{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-sm transition-colors',
                  isDone && 'text-green-400',
                  isCurrent && 'text-text font-medium',
                  !isDone && !isCurrent && 'text-text-muted/40',
                )}
              >
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
