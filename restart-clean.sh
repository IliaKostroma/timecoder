#!/bin/bash

echo "🧹 Cleaning up old dev servers..."

# Убиваем все процессы Next.js
pkill -f "next dev" 2>/dev/null
pkill -f "TIMECODER.*node" 2>/dev/null

# Ждем чтобы процессы точно завершились
sleep 2

# Удаляем lock файлы
rm -rf .next/dev/lock 2>/dev/null

# Очищаем .next кеш
echo "🗑️  Clearing .next cache..."
rm -rf .next

echo "✅ Cleanup done!"
echo ""
echo "Now run:"
echo "  npm run dev"
