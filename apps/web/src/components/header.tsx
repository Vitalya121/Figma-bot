'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Sparkles className="w-6 h-6 text-primary" />
          <span>CarouselForge</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-text-muted">
          <Link href="/dashboard" className="hover:text-text transition-colors">
            Дашборд
          </Link>
          <Link href="/create" className="hover:text-text transition-colors">
            Создать
          </Link>
          <Link href="/#pricing" className="hover:text-text transition-colors">
            Тарифы
          </Link>
        </nav>

        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/auth/google`}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Войти
        </a>
      </div>
    </header>
  )
}
