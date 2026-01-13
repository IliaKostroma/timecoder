# TIMECODER - YouTube Chapters Generator

Автоматическая генерация YouTube-глав из видеофайлов с использованием AI.

## Возможности

- Загрузка видео любого формата (MP4, MOV, MKV и др.)
- Автоматическая транскрипция через Whisper AI
- Генерация SEO-оптимизированных глав через Claude 3.5 Haiku
- Редактирование результата
- Копирование в описание YouTube одним кликом

## Технологии

- **Next.js 16** + React 19
- **FFmpeg** (встроенный, работает на всех платформах)
- **Replicate API** (Whisper + Claude)
- **Tailwind CSS v4** + Framer Motion

## Установка

1. **Клонируйте репозиторий**
```bash
git clone <your-repo-url>
cd TIMECODER
```

2. **Установите зависимости**
```bash
npm install
```

3. **Настройте переменные окружения**

Создайте файл `.env.local` в корне проекта:
```bash
cp .env.example .env.local
```

Получите Replicate API токен на [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) и добавьте в `.env.local`:
```
REPLICATE_API_TOKEN=your_token_here
```

4. **Запустите сервер**
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## Ограничения

- **Оптимально:** до 1 часа видео
- **Технически возможно:** до 2-3 часов
- **Стоимость:** ~$3.50 за 1 час видео

Подробнее см. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)

## Безопасность

⚠️ **ВАЖНО:** Никогда не коммитьте `.env.local` с вашими API ключами!

Файл уже добавлен в `.gitignore`, но если случайно закоммитили ключи:
1. Сразу отзовите ключи на Replicate
2. Создайте новые ключи
3. Используйте `git filter-branch` или BFG Repo-Cleaner для удаления из истории

## Лицензия

MIT
