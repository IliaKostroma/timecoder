import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import Replicate from 'replicate';
import { runFfmpeg } from '@/lib/ffmpeg';

// ВАЖНО: Должен быть Node.js runtime, не Edge
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  console.log('[Transcribe] Request received');

  // Проверяем наличие API токена
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('[Transcribe] REPLICATE_API_TOKEN not found in environment');
    return NextResponse.json(
      { error: 'Server misconfiguration: REPLICATE_API_TOKEN not set' },
      { status: 500 }
    );
  }

  // Объявляем переменные для cleanup в finally
  let inputPath: string | null = null;
  let audioPath: string | null = null;

  try {
    const formData = await req.formData();
    console.log('[Transcribe] FormData parsed');

    const file = formData.get('file');
    console.log('[Transcribe] File from formData:', file ? 'present' : 'missing');

    if (!file || !(file instanceof Blob)) {
      console.error('[Transcribe] No file provided or not a Blob');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Генерируем уникальные имена для временных файлов
    const tmp = tmpdir();
    const id = crypto.randomUUID();
    inputPath = path.join(tmp, `timecoder_${id}.input`);
    audioPath = path.join(tmp, `timecoder_${id}.mp3`);

    console.log('[Transcribe] Temp paths:', { inputPath, audioPath });

    // 1) Сохраняем загруженный видеофайл на диск
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(inputPath, buffer);

    console.log(`[Transcribe] Video saved: ${inputPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // 2) Конвертируем видео → легковесный аудиофайл
    console.log('[Transcribe] Starting FFmpeg conversion...');
    await runFfmpeg(inputPath, audioPath);

    const audioStats = await fs.stat(audioPath);
    console.log(`[Transcribe] Audio extracted: ${audioPath} (${(audioStats.size / 1024 / 1024).toFixed(2)} MB)`);

    // 3) Отправляем аудио в Whisper на Replicate
    const audioBuffer = await fs.readFile(audioPath);

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log('[Transcribe] Sending to Whisper...');

    const output = await replicate.run(
      "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
      {
        input: {
          audio: audioBuffer,
          task: "transcribe",
          language: "None",
          timestamp: "chunk",
          batch_size: 64,
          diarise_audio: false
        }
      }
    );

    console.log('[Transcribe] Success!');

    return NextResponse.json({ transcript: output });

  } catch (error: any) {
    console.error('[Transcribe] Error:', error);
    console.error('[Transcribe] Error stack:', error?.stack);
    return NextResponse.json(
      { error: error?.message || 'Transcription failed' },
      { status: 500 }
    );
  } finally {
    // 4) Чистим временные файлы
    if (inputPath) {
      await fs.rm(inputPath, { force: true }).catch(() => {});
    }
    if (audioPath) {
      await fs.rm(audioPath, { force: true }).catch(() => {});
    }
  }
}
