// Простой тест FFmpeg
const { spawn } = require('child_process');

console.log('Testing ffmpeg-static...\n');

let FFMPEG_PATH;
try {
  FFMPEG_PATH = require('ffmpeg-static');
  console.log('✓ ffmpeg-static found:', FFMPEG_PATH);
} catch (e) {
  console.error('✗ ffmpeg-static not found:', e.message);
  process.exit(1);
}

console.log('\nTesting FFmpeg binary...');
const ff = spawn(FFMPEG_PATH, ['-version']);

ff.stdout.on('data', (data) => {
  console.log(data.toString());
});

ff.stderr.on('data', (data) => {
  console.log(data.toString());
});

ff.on('error', (err) => {
  console.error('✗ FFmpeg spawn error:', err.message);
  process.exit(1);
});

ff.on('close', (code) => {
  if (code === 0) {
    console.log('\n✓ FFmpeg works!');
  } else {
    console.error(`✗ FFmpeg exited with code ${code}`);
    process.exit(1);
  }
});
