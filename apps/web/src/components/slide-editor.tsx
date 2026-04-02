'use client'

import { Trash2, GripVertical } from 'lucide-react'

interface SlideEditorProps {
  index: number
  title: string
  body: string
  total: number
  onTitleChange: (value: string) => void
  onBodyChange: (value: string) => void
  onDelete: () => void
}

export function SlideEditor({
  index,
  title,
  body,
  total,
  onTitleChange,
  onBodyChange,
  onDelete,
}: SlideEditorProps) {
  const label = index === 1 ? 'Hook' : index === total ? 'CTA' : `Слайд ${index}`

  return (
    <div className="bg-surface-light border border-border rounded-xl p-5 group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-text-muted cursor-grab" />
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
            {label}
          </span>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Заголовок слайда"
        maxLength={60}
        className="w-full bg-transparent text-lg font-semibold text-text placeholder:text-text-muted/50 outline-none mb-2"
      />

      <textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        placeholder="Текст слайда..."
        maxLength={280}
        rows={3}
        className="w-full bg-transparent text-sm text-text-muted placeholder:text-text-muted/30 outline-none resize-none"
      />

      <div className="flex justify-end mt-1">
        <span className={`text-xs ${body.length > 240 ? 'text-amber-400' : 'text-text-muted/40'}`}>
          {body.length}/280
        </span>
      </div>
    </div>
  )
}
