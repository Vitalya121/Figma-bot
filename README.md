# CarouselForge

AI-сервис для генерации Instagram-каруселей в Figma.

Введите тему — получите готовую карусель с AI-текстом, изображениями (Nano Banana Pro) и дизайном прямо в Figma.

## Стек

- **Frontend**: Next.js 15, React 19, TailwindCSS v4
- **Backend**: Fastify 5, TypeScript
- **AI**: Google Gemini API (Nano Banana Pro / Imagen для генерации изображений)
- **Design**: Figma REST API
- **Фото**: Unsplash + Pexels API
- **БД**: PostgreSQL 16 + Drizzle ORM
- **Очередь**: Redis 7 + BullMQ
- **Оплата**: Stripe
- **Монорепо**: pnpm workspaces + Turborepo

## Структура проекта

```
carousel-forge/
├── apps/
│   ├── api/                    # Fastify backend
│   │   ├── src/
│   │   │   ├── config/         # Валидация env
│   │   │   ├── db/             # Drizzle ORM схема и подключение
│   │   │   ├── middleware/     # JWT auth
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Google + Figma OAuth
│   │   │   │   ├── billing/    # Stripe подписки
│   │   │   │   ├── carousel/   # CRUD + генерация каруселей
│   │   │   │   ├── figma/      # Figma API интеграция
│   │   │   │   ├── gemini/     # Gemini AI (текст + Nano Banana Pro)
│   │   │   │   └── photo/      # Unsplash + Pexels
│   │   │   ├── queue/          # BullMQ очередь генерации
│   │   │   └── utils/          # Ошибки
│   │   ├── Dockerfile
│   │   └── drizzle.config.ts
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   ├── app/            # App Router страницы
│       │   │   ├── page.tsx            # Лендинг
│       │   │   ├── dashboard/page.tsx  # Дашборд каруселей
│       │   │   ├── create/page.tsx     # Wizard создания
│       │   │   └── auth/callback/      # OAuth callback
│       │   ├── components/     # UI компоненты
│       │   ├── lib/            # API клиент, утилиты
│       │   └── styles/         # Tailwind CSS
│       └── Dockerfile
├── packages/
│   ├── types/                  # Общие TypeScript типы
│   └── config/                 # Конфигурация из env
├── docker-compose.yml          # PostgreSQL + Redis
├── turbo.json                  # Turborepo конфиг
└── .env.example                # Переменные окружения
```

## Быстрый старт

### Требования

- Node.js >= 22
- pnpm >= 9
- Docker и Docker Compose

### Установка

```bash
# 1. Клонировать репозиторий
git clone <repo-url> carousel-forge
cd carousel-forge

# 2. Скопировать переменные окружения
cp .env.example .env

# 3. Заполнить API-ключи в .env (см. раздел ниже)

# 4. Запустить PostgreSQL и Redis
docker compose up -d

# 5. Установить зависимости
pnpm install

# 6. Запустить миграции
pnpm db:migrate

# 7. Запустить dev-сервер
pnpm dev
```

Frontend: http://localhost:3000
Backend: http://localhost:4000
Health check: http://localhost:4000/health

### Получение API-ключей

| Сервис | Где получить |
|--------|-------------|
| Gemini (Nano Banana Pro) | https://aistudio.google.com/apikey |
| Figma | https://www.figma.com/developers/api#authentication |
| Google OAuth | https://console.cloud.google.com/apis/credentials |
| Unsplash | https://unsplash.com/developers |
| Pexels | https://www.pexels.com/api/new/ |
| Stripe | https://dashboard.stripe.com/apikeys |

## Скрипты

| Команда | Описание |
|---------|----------|
| `pnpm dev` | Запуск dev-серверов (frontend + backend) |
| `pnpm build` | Production-сборка |
| `pnpm lint` | Линтинг |
| `pnpm type-check` | Проверка типов |
| `pnpm db:migrate` | Применить миграции БД |
| `pnpm db:seed` | Заполнить тестовыми данными |

## API Endpoints

### Auth
- `GET /api/auth/google` — начать Google OAuth
- `GET /api/auth/figma` — подключить Figma
- `GET /api/auth/me` — текущий пользователь

### Carousels
- `POST /api/carousels` — создать карусель
- `GET /api/carousels` — список каруселей
- `GET /api/carousels/:id` — детали карусели
- `GET /api/carousels/:id/status` — статус генерации

### Templates
- `GET /api/templates` — список шаблонов

### Billing
- `GET /api/billing/plans` — тарифы
- `POST /api/billing/checkout` — начать оплату

## Лицензия

MIT
