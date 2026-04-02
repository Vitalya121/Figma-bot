'use client'

import Link from 'next/link'
import { Plus, ExternalLink, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data — replace with API calls
const MOCK_CAROUSELS = [
  { id: '1', title: '5 ошибок в таргете', status: 'completed' as const, figmaFileUrl: '#', createdAt: '2026-03-30' },
  { id: '2', title: 'Как увеличить охваты', status: 'completed' as const, figmaFileUrl: '#', createdAt: '2026-03-28' },
  { id: '3', title: 'Тренды SMM 2026', status: 'processing' as const, figmaFileUrl: null, createdAt: '2026-04-01' },
]

const statusConfig = {
  queued: { icon: Clock, label: 'В очереди', color: 'text-text-muted' },
  processing: { icon: Loader2, label: 'Генерация...', color: 'text-primary' },
  completed: { icon: CheckCircle, label: 'Готово', color: 'text-green-400' },
  failed: { icon: AlertCircle, label: 'Ошибка', color: 'text-red-400' },
}

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold">Мои карусели</h1>
          <p className="text-text-muted mt-1">3 из 3 каруселей использовано в этом месяце</p>
        </div>
        <Link
          href="/create"
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Создать карусель
        </Link>
      </div>

      {MOCK_CAROUSELS.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted text-lg mb-4">У вас пока нет каруселей</p>
          <Link
            href="/create"
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Создать первую
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_CAROUSELS.map((carousel) => {
            const status = statusConfig[carousel.status]
            const StatusIcon = status.icon

            return (
              <div
                key={carousel.id}
                className="bg-surface-light border border-border rounded-xl overflow-hidden hover:border-text-muted/30 transition-colors"
              >
                {/* Preview placeholder */}
                <div className="aspect-[4/5] bg-gradient-to-br from-surface-lighter to-surface flex items-center justify-center">
                  <span className="text-6xl opacity-10">C</span>
                </div>

                <div className="p-4">
                  <h3 className="font-medium mb-2 truncate">{carousel.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className={cn('flex items-center gap-1.5 text-xs', status.color)}>
                      <StatusIcon className={cn('w-3.5 h-3.5', carousel.status === 'processing' && 'animate-spin')} />
                      {status.label}
                    </div>
                    <span className="text-xs text-text-muted">{carousel.createdAt}</span>
                  </div>

                  {carousel.figmaFileUrl && (
                    <a
                      href={carousel.figmaFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full border border-border hover:border-primary text-sm py-2 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Открыть в Figma
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
