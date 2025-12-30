import { NextResponse } from 'next/server';
import { FFMPEG_PATH } from '@/lib/ffmpeg';

export const runtime = 'nodejs';

export async function GET() {
  console.log('[Health] Check requested');

  const checks = {
    ffmpeg: FFMPEG_PATH,
    replicateToken: process.env.REPLICATE_API_TOKEN ? '✓ Set' : '✗ Missing',
    nodeVersion: process.version,
    platform: process.platform,
    tmpDir: require('os').tmpdir(),
  };

  console.log('[Health] Checks:', checks);

  return NextResponse.json({
    status: 'ok',
    checks,
  });
}
