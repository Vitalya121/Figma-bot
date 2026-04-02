import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Header } from '@/components/header'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'CarouselForge — AI-генератор Instagram каруселей в Figma',
  description:
    'Создавайте вирусные Instagram-карусели за минуты. AI генерирует текст и дизайн прямо в Figma.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.className} bg-surface text-text min-h-screen`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
