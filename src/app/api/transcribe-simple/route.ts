import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'nodejs';

/**
 * Простейший тест - отправка видео в Whisper БЕЗ FFmpeg
 * Проверяем: может Whisper принимает видео напрямую?
 */
export async function POST(req: NextRequest) {
  console.log('[TranscribeSimple] Starting...');

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    console.log('[TranscribeSimple] File received, size:', file.size);

    // Пробуем отправить НАПРЯМУЮ в Whisper (может он умеет видео?)
    const buffer = Buffer.from(await file.arrayBuffer());

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log('[TranscribeSimple] Sending to Whisper...');

    const output = await replicate.run(
      "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
      {
        input: {
          audio: buffer, // Пробуем видео как "audio"
          task: "transcribe",
          language: "None",
          timestamp: "chunk",
          batch_size: 64,
        }
      }
    );

    console.log('[TranscribeSimple] Success!', output);
    return NextResponse.json({ transcript: output, note: 'Direct video->Whisper' });

  } catch (error: any) {
    console.error('[TranscribeSimple] Error:', error.message);
    console.error('[TranscribeSimple] Stack:', error.stack);
    return NextResponse.json({
      error: error.message,
      hint: 'Whisper does not accept video directly, FFmpeg needed'
    }, { status: 500 });
  }
}
