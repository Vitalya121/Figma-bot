import Link from 'next/link'
import { Sparkles, Zap, Image, FigmaIcon, Eye } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-1.5 rounded-full mb-8">
          <Sparkles className="w-4 h-4" />
          AI + Figma + Nano Banana Pro
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          Создавайте вирусные
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            карусели за минуты
          </span>
        </h1>

        <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10">
          Введите тему — получите готовую Instagram-карусель с текстом, AI-изображениями
          и дизайном прямо в Figma. Без дизайнера.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/create"
            className="bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors"
          >
            Попробовать бесплатно
          </Link>
          <a
            href="#how"
            className="border border-border hover:border-text-muted text-text-muted hover:text-text px-8 py-3.5 rounded-xl text-lg transition-colors"
          >
            Как это работает
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">
          Три шага до готовой карусели
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Введите тему',
              desc: 'Напишите тему или вставьте готовый текст. AI сгенерирует контент с hook-слайдом и CTA.',
              icon: Zap,
            },
            {
              step: '02',
              title: 'Выберите шаблон',
              desc: 'Выберите дизайн из библиотеки или загрузите референс. AI подберёт фото и изображения.',
              icon: Eye,
            },
            {
              step: '03',
              title: 'Получите Figma-файл',
              desc: 'Готовая карусель появится в вашем Figma — с редактируемым текстом и AI-изображениями.',
              icon: FigmaIcon,
            },
          ].map((item) => (
            <div key={item.step} className="bg-surface-light border border-border rounded-2xl p-8">
              <div className="text-primary text-sm font-mono mb-4">{item.step}</div>
              <item.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">Возможности</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { title: 'AI-тексты', desc: 'Генерация по фреймворкам AIDA, PAS, BAB. Экспертный, дружелюбный или провокационный тон.', icon: Zap },
            { title: 'Nano Banana Pro', desc: 'Генерация уникальных изображений через Gemini Imagen для каждого слайда.', icon: Image },
            { title: 'Figma-выход', desc: 'Редактируемый файл — не PNG-картинка. Доработайте любой элемент.', icon: FigmaIcon },
            { title: 'Подбор фото', desc: 'Автоматический поиск по Unsplash и Pexels по контексту слайда.', icon: Eye },
          ].map((f) => (
            <div key={f.title} className="flex gap-4 bg-surface-light border border-border rounded-xl p-6">
              <f.icon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-text-muted">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Тарифы</h2>
        <p className="text-text-muted text-center mb-16">Начните бесплатно, масштабируйтесь по мере роста</p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'Free',
              price: '$0',
              features: ['3 карусели/мес', '5 базовых шаблонов', 'Unsplash фото'],
              cta: 'Начать бесплатно',
              highlight: false,
            },
            {
              name: 'Pro',
              price: '$19',
              period: '/мес',
              features: ['30 каруселей/мес', 'Все шаблоны', 'Brand Kit', 'Nano Banana Pro изображения', 'Приоритетная генерация'],
              cta: 'Выбрать Pro',
              highlight: true,
            },
            {
              name: 'Agency',
              price: '$49',
              period: '/мес',
              features: ['Безлимит каруселей', '10 Brand Kit', 'Batch-генерация', 'Приоритетная поддержка'],
              cta: 'Выбрать Agency',
              highlight: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 ${
                plan.highlight
                  ? 'bg-gradient-to-b from-primary/20 to-surface-light border-2 border-primary'
                  : 'bg-surface-light border border-border'
              }`}
            >
              <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-text-muted">{plan.period}</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                    <span className="text-green-400">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                  plan.highlight
                    ? 'bg-primary hover:bg-primary-dark text-white'
                    : 'border border-border hover:border-text-muted text-text'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-text-muted">
        <p>&copy; 2026 CarouselForge. Powered by Gemini AI + Figma.</p>
      </footer>
    </div>
  )
}
