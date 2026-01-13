import { spawn } from 'child_process';
import { execSync } from 'child_process';

// Функция для получения пути к FFmpeg
export function getFFmpegPath(): string {
  // Приоритет 1: переменная окружения
  if (process.env.FFMPEG_PATH) {
    return process.env.FFMPEG_PATH;
  }

  // Приоритет 2: системный FFmpeg (если есть в PATH)
  try {
    const command = process.platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
    execSync(command, { stdio: 'pipe' });
    return 'ffmpeg';
  } catch {
    // Системный FFmpeg не найден
  }

  // Приоритет 3: ffmpeg-static (кросс-платформенный бинарник)
  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic) {
      console.log('[FFmpeg] Using ffmpeg-static:', ffmpegStatic);
      return ffmpegStatic;
    }
  } catch {
    // ffmpeg-static не установлен
  }

  // Fallback: надеемся, что ffmpeg в PATH
  return 'ffmpeg';
}

/**
 * Конвертирует видео в лёгкий аудио-файл для Whisper
 * mono, 16kHz, 48kbps → 4 часа ≈ 80-90 МБ
 */
export function runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const ffmpegPath = getFFmpegPath();

    const args = [
      '-y',           // перезаписывать выходной файл
      '-i', inputPath,
      '-vn',          // без видео
      '-ac', '1',     // mono
      '-ar', '16000', // 16 kHz (достаточно для речи, Whisper любит)
      '-b:a', '48k',  // 48 kbps (очень экономно)
      '-f', 'mp3',
      outputPath,
    ];

    console.log('[FFmpeg] Executing:', ffmpegPath, args.join(' '));

    const ff = spawn(ffmpegPath, args);

    let stderr = '';

    ff.stderr.on('data', (data) => {
      stderr += data.toString();
      // FFmpeg пишет прогресс в stderr
      const str = data.toString().trim();
      if (str.includes('time=') || str.includes('size=')) {
        console.log('[ffmpeg]', str);
      }
    });

    ff.on('error', (err) => {
      reject(new Error(`FFmpeg spawn error: ${err.message}`));
    });

    ff.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}\n${stderr}`));
      }
    });
  });
}
