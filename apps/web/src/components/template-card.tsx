'use client'

import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'

interface TemplateCardProps {
  id: string
  name: string
  category: string
  isPro: boolean
  selected: boolean
  onSelect: (id: string) => void
}

const categoryColors: Record<string, string> = {
  minimal: 'bg-slate-500/20 text-slate-300',
  vibrant: 'bg-pink-500/20 text-pink-300',
  corporate: 'bg-blue-500/20 text-blue-300',
  lifestyle: 'bg-green-500/20 text-green-300',
  dark: 'bg-purple-500/20 text-purple-300',
}

export function TemplateCard({ id, name, category, isPro, selected, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={cn(
        'relative rounded-xl border-2 overflow-hidden transition-all text-left',
        selected
          ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]'
          : 'border-border hover:border-text-muted/30',
      )}
    >
      {/* Preview placeholder */}
      <div className="aspect-[4/5] bg-gradient-to-br from-surface-light to-surface-lighter flex items-center justify-center">
        <span className="text-4xl opacity-20">
          {category === 'minimal' ? '◻' : category === 'vibrant' ? '◆' : category === 'dark' ? '●' : '△'}
        </span>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{name}</span>
          {isPro && <Lock className="w-3.5 h-3.5 text-accent" />}
        </div>
        <span className={cn('text-xs px-1.5 py-0.5 rounded mt-1 inline-block', categoryColors[category] ?? 'bg-surface-lighter text-text-muted')}>
          {category}
        </span>
      </div>

      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </button>
  )
}
