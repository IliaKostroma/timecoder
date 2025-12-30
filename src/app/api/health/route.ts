import { NextResponse } from 'next/server';
import { tmpdir } from 'os';
import { getFFmpegPath } from '@/lib/ffmpeg';

export const runtime = 'nodejs';

export async function GET() {
  console.log('[Health] Check requested');

  const checks = {
    ffmpeg: getFFmpegPath(),
    replicateToken: process.env.REPLICATE_API_TOKEN ? '✓ Set' : '✗ Missing',
    nodeVersion: process.version,
    platform: process.platform,
    tmpDir: tmpdir(),
  };

  console.log('[Health] Checks:', checks);

  return NextResponse.json({
    status: 'ok',
    checks,
  });
}
