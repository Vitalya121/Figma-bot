'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    const err = searchParams.get('error')
    const details = searchParams.get('details')

    if (token) {
      localStorage.setItem('token', token)
      router.replace('/dashboard')
    } else if (err) {
      const messages: Record<string, string> = {
        no_code: 'Google не предоставил код авторизации',
        token_exchange_failed: 'Не удалось обменять код на токен',
        no_user_info: 'Не удалось получить данные пользователя',
        server_error: 'Ошибка сервера при авторизации',
        access_denied: 'Вы отклонили запрос на авторизацию',
      }
      setError(messages[err] ?? `Ошибка авторизации: ${err}${details ? ` — ${details}` : ''}`)
    } else {
      setError('Токен авторизации не получен')
    }
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ошибка авторизации</h2>
          <p className="text-text-muted text-sm mb-6">{error}</p>
          <div className="space-y-3">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/auth/google`}
              className="block bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Попробовать ещё раз
            </a>
            <button
              onClick={() => router.push('/')}
              className="block w-full text-sm text-text-muted hover:text-text transition-colors"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-text-muted">Авторизация...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
