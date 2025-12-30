// Тест конвертации реального видеофайла
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('Testing video to audio conversion...\n');

// Получаем путь к FFmpeg
let ffmpegPath;
try {
  ffmpegPath = require('ffmpeg-static');
  console.log('✓ FFmpeg path:', ffmpegPath);
} catch (e) {
  console.error('✗ ffmpeg-static not found');
  process.exit(1);
}

// Проверяем есть ли тестовое видео
const videoPath = process.argv[2];
if (!videoPath) {
  console.log('\nUsage: node test-conversion.js <path-to-video-file>');
  console.log('Example: node test-conversion.js ~/Downloads/test.mp4\n');
  process.exit(1);
}

if (!fs.existsSync(videoPath)) {
  console.error('✗ Video file not found:', videoPath);
  process.exit(1);
}

const videoStats = fs.statSync(videoPath);
console.log(`✓ Video found: ${(videoStats.size / 1024 / 1024).toFixed(2)} MB\n`);

// Создаем временный выходной файл
const outputPath = path.join(os.tmpdir(), 'test_output.mp3');

console.log('Converting...');

const args = [
  '-y',
  '-i', videoPath,
  '-vn',
  '-ac', '1',
  '-ar', '16000',
  '-b:a', '48k',
  '-f', 'mp3',
  outputPath,
];

const ff = spawn(ffmpegPath, args);

ff.stderr.on('data', (data) => {
  const str = data.toString();
  if (str.includes('time=')) {
    // Показываем прогресс
    const match = str.match(/time=(\d+:\d+:\d+)/);
    if (match) {
      process.stdout.write(`\rProgress: ${match[1]}`);
    }
  }
});

ff.on('error', (err) => {
  console.error('\n✗ Spawn error:', err.message);
  process.exit(1);
});

ff.on('close', (code) => {
  if (code === 0) {
    const audioStats = fs.statSync(outputPath);
    console.log(`\n\n✓ Success!`);
    console.log(`Output: ${outputPath}`);
    console.log(`Size: ${(audioStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compression: ${((1 - audioStats.size / videoStats.size) * 100).toFixed(1)}% smaller`);

    // Удаляем тестовый файл
    fs.unlinkSync(outputPath);
    console.log('\n(Test file cleaned up)');
  } else {
    console.error(`\n✗ FFmpeg exited with code ${code}`);
    process.exit(1);
  }
});
