#!/bin/bash
# Создает короткое тестовое видео (10 секунд, тишина)

echo "Creating test video..."

# Используем системный ffmpeg для создания тестового видео
ffmpeg -f lavfi -i testsrc=duration=10:size=320x240:rate=30 \
       -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 \
       -shortest test-video.mp4 -y 2>/dev/null

if [ -f test-video.mp4 ]; then
  SIZE=$(ls -lh test-video.mp4 | awk '{print $5}')
  echo "✓ Test video created: test-video.mp4 ($SIZE)"
else
  echo "✗ Failed to create test video"
  exit 1
fi
