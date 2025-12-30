# TIMECODER - YouTube Chapters Generator

## Описание проекта

TIMECODER - это веб-приложение для автоматической генерации YouTube-глав (timestamps) из видеофайлов с использованием AI.

### Основная функциональность

1. **Загрузка видео** - пользователь загружает видеофайл (MP4, MOV, MKV и др.)
2. **Извлечение аудио** - FFmpeg.wasm в браузере конвертирует видео в MP3
3. **Транскрипция** - Whisper модель распознаёт речь и создаёт текст с временными метками
4. **Генерация глав** - Claude 3.5 Haiku анализирует транскрипт и создаёт SEO-оптимизированные YouTube главы
5. **Редактирование и копирование** - пользователь может отредактировать результат и скопировать в описание YouTube

---

## Технологический стек

### Frontend
- **Next.js 16.1.1** (React 19) - фреймворк с App Router
- **TypeScript** - типизация
- **Tailwind CSS v4** - стилизация
- **Framer Motion** - анимации
- **FFmpeg.wasm** - обработка видео в браузере (без отправки на сервер)
- **Radix UI** - компоненты UI (Progress, ScrollArea, Slot)
- **Lucide React** - иконки

### Backend (API Routes)
- **Next.js API Routes** - серверные эндпоинты
- **Replicate API** - платформа для запуска AI моделей

### AI Модели
1. **Whisper** (`vaibhavs10/incredibly-fast-whisper`)
   - Версия: 3-5x faster Whisper
   - Задача: транскрипция аудио с timestamps
   - Цена: $0.000975 за секунду

2. **Claude 3.5 Haiku** (`anthropic/claude-3.5-haiku`)
   - Задача: генерация SEO-оптимизированных глав
   - Input: $1 за 1M токенов
   - Output: $5 за 1M токенов

---

## Архитектура приложения

```
/src
├── /app
│   ├── /api
│   │   ├── /transcribe
│   │   │   └── route.ts          # API: транскрипция через Whisper
│   │   └── /generate
│   │       └── route.ts          # API: генерация глав через Claude
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Главная страница (workflow)
├── /components
│   ├── /ui                       # Базовые UI компоненты
│   └── upload-zone.tsx           # Компонент загрузки видео
├── /hooks
│   └── use-ffmpeg.ts             # Хук для работы с FFmpeg.wasm
└── /lib
    └── utils.ts                  # Утилиты (cn для className)
```

### Workflow (Flow диаграмма)

```
1. UPLOAD
   ↓ (пользователь загружает видео)
2. TRANSCRIBING
   ↓ (FFmpeg извлекает аудио → Whisper транскрибирует)
3. REVIEW
   ↓ (пользователь проверяет/редактирует транскрипт)
4. GENERATING
   ↓ (Claude генерирует главы)
5. DONE
   ↓ (пользователь копирует результат)
```

---

## API Endpoints

### POST `/api/transcribe`
**Описание:** Принимает аудиофайл, отправляет на Replicate Whisper, возвращает транскрипт с временными метками.

**Input:**
- `FormData` с полем `file` (Blob)

**Output:**
```json
{
  "transcript": {
    "chunks": [
      {
        "timestamp": [0, 5.2],
        "text": "Hello world"
      }
    ]
  }
}
```

**Обработка на клиенте:**
- Форматирует в строку вида: `[0:00] Hello world\n[0:05] Next sentence...`

---

### POST `/api/generate`
**Описание:** Принимает транскрипт, отправляет на Claude 3.5 Haiku, возвращает YouTube главы.

**Input:**
```json
{
  "transcript": "[0:00] Hello world\n[0:05] Next sentence..."
}
```

**Output:**
```json
{
  "chapters": "00:00 Intro: The Main Topic\n00:05 Key Point #1\n01:23 How to Do Something"
}
```

**System Prompt:**
- Строгие правила форматирования (MM:SS с leading zeros)
- SEO-оптимизация названий глав
- Использование action verbs
- 5-8 глав на видео

---

## Ограничения и производительность

### Максимальная длина видео
- **Оптимально:** до 1 часа
- **Технически возможно:** до 2-3 часов
- **Ограничения:**
  - FFmpeg.wasm работает в памяти браузера (2-4GB обычно)
  - Whisper может выдать OOM на очень длинных файлах
  - Claude context window: 200K токенов ≈ 2-3 часа транскрипта

### Стоимость обработки

| Длительность | Whisper | Claude Haiku | **ИТОГО** |
|--------------|---------|--------------|-----------|
| 1 минута     | $0.059  | ~$0.001      | **$0.06** |
| 10 минут     | $0.59   | ~$0.004      | **$0.59** |
| 1 час        | $3.51   | ~$0.02       | **$3.53** |

*95% стоимости - Whisper, Claude добавляет копейки*

---

## Установка и запуск

### Требования
- Node.js 20+
- npm или yarn
- Replicate API Token

### Шаги установки

1. **Клонируйте репозиторий**
```bash
cd /path/to/TIMECODER
```

2. **Установите зависимости**
```bash
npm install
```

3. **Настройте переменные окружения**
Создайте `.env.local`:
```env
REPLICATE_API_TOKEN=your_token_here
```

4. **Запустите сервер**

**Вариант 1: Двойной клик**
- Запустите `start.command` (macOS)

**Вариант 2: npm**
```bash
npm run dev
```

**Вариант 3: Автоматический скрипт**
```bash
./start.command
```
Скрипт автоматически:
- Проверит и освободит порты 3000/3001
- Установит зависимости
- Запустит dev сервер

5. **Откройте браузер**
```
http://localhost:3000
```

---

## Особенности реализации

### 1. FFmpeg в браузере
- Используется `@ffmpeg/ffmpeg` (WebAssembly версия)
- Обработка видео происходит локально (не загружается на сервер)
- Требуются специальные CORS заголовки в `next.config.ts`:
  ```ts
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```

### 2. Replicate API
- Whisper возвращает объект с `chunks` (массив сегментов с timestamps)
- Claude возвращает массив строк (streaming), склеивается через `.join('')`

### 3. Обработка ошибок
- На сервере логируются детали ошибок
- На клиенте показываются понятные сообщения
- Ошибка 400 если нет транскрипта в `/api/generate`

### 4. UX/UI
- Drag & drop загрузка
- Анимации через Framer Motion
- Прогресс-бар при обработке
- Gradient mesh фон
- Редактируемые textarea для транскрипта и глав

---

## Известные проблемы и решения

### Проблема 1: Claude не создаёт задачу на Replicate
**Причина:** Использовался неподдерживаемый параметр `temperature`

**Решение:** Удалён параметр из запроса (исправлено в `src/app/api/generate/route.ts:76`)

Модель `anthropic/claude-3.5-haiku` на Replicate принимает только:
- `prompt` (required)
- `system_prompt` (optional)
- `max_tokens` (optional)

### Проблема 2: Порт 3000 занят при запуске
**Решение:** Используйте `start.command` - автоматически убивает процессы на занятых портах

---

## Потенциальные улучшения

### Функциональные
- [ ] Поддержка URL видео (YouTube, Vimeo) вместо загрузки файла
- [ ] Экспорт в разные форматы (JSON, SRT, VTT)
- [ ] Поддержка нескольких языков
- [ ] Автоматическое определение языка
- [ ] Batch processing (загрузка нескольких видео)
- [ ] История обработанных видео (LocalStorage или БД)

### Технические
- [ ] Добавить rate limiting
- [ ] Кеширование результатов
- [ ] Прогресс-бар для Replicate задач (polling status)
- [ ] Server-Sent Events для real-time обновлений
- [ ] Загрузка больших файлов через chunked upload
- [ ] Деплой на Vercel/Railway
- [ ] Docker контейнеризация

### UI/UX
- [ ] Темная/светлая тема
- [ ] Предпросмотр видео
- [ ] Rich text editor для глав
- [ ] Шаблоны стилей глав (формальный, casual, technical)
- [ ] Экспорт в PDF с оформлением

---

## Зависимости

### Production
```json
{
  "@ffmpeg/ffmpeg": "^0.12.15",
  "@ffmpeg/util": "^0.12.2",
  "@radix-ui/react-progress": "^1.1.8",
  "@radix-ui/react-scroll-area": "^1.2.10",
  "@radix-ui/react-slot": "^1.2.4",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "framer-motion": "^12.23.26",
  "lucide-react": "^0.562.0",
  "next": "16.1.1",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "replicate": "^1.4.0",
  "tailwind-merge": "^3.4.0"
}
```

### Development
```json
{
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "babel-plugin-react-compiler": "1.0.0",
  "eslint": "^9",
  "eslint-config-next": "16.1.1",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

---

## Файловая структура проекта

```
TIMECODER/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/route.ts    # Claude API
│   │   │   └── transcribe/route.ts  # Whisper API
│   │   ├── favicon.ico
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Main UI
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── progress.tsx
│   │   │   └── textarea.tsx
│   │   └── upload-zone.tsx          # Drag & drop component
│   ├── hooks/
│   │   └── use-ffmpeg.ts            # FFmpeg hook
│   └── lib/
│       └── utils.ts
├── .env.local                        # API keys (не коммитить!)
├── .next/                            # Build artifacts
├── node_modules/
├── package.json
├── next.config.ts                    # Next.js config + CORS
├── tailwind.config.ts
├── tsconfig.json
├── start.command                     # Startup script
└── PROJECT_OVERVIEW.md              # Этот файл
```

---

## Лицензия и использование

Проект создан для генерации YouTube глав. Может использоваться как основа для других проектов обработки видео/аудио с AI.

### Важные замечания:
- Требуется Replicate API ключ (платный сервис)
- FFmpeg работает в браузере - не требует серверной обработки
- Все данные обрабатываются приватно (видео не загружается на сторонние серверы, кроме Replicate для AI)

---

## Контакты и поддержка

Для обсуждения с другими AI или разработчиками:
- Репозиторий: `/Users/ilakostroma/Documents/TIMECODER`
- Главный файл: `src/app/page.tsx`
- API роуты: `src/app/api/*/route.ts`

**Дата последнего обновления:** 30 декабря 2025
