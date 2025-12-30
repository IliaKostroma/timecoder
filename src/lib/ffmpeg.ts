import { spawn } from 'child_process';

// Путь к FFmpeg из ffmpeg-static
// В production можно использовать системный FFmpeg
export const FFMPEG_PATH = process.env.FFMPEG_PATH ||
  (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('ffmpeg-static') as string;
    } catch {
      return 'ffmpeg'; // fallback к системному
    }
  })();

/**
 * Конвертирует видео в лёгкий аудио-файл для Whisper
 * mono, 16kHz, 48kbps → 4 часа ≈ 80-90 МБ
 */
export function runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
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

    console.log('[FFmpeg] Executing:', FFMPEG_PATH, args.join(' '));

    const ff = spawn(FFMPEG_PATH, args);

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
