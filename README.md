# TIMECODER - YouTube Chapters Generator

Automatic YouTube chapters generation from video files using AI.

## Features

- Upload video in any format (MP4, MOV, MKV, etc.)
- Automatic transcription via Whisper AI
- SEO-optimized chapter generation via Claude 3.5 Haiku
- Edit results before exporting
- Copy to YouTube description with one click

## Technologies

- **Next.js 16** + React 19
- **FFmpeg** (embedded, works on all platforms)
- **Replicate API** (Whisper + Claude)
- **Tailwind CSS v4** + Framer Motion

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/IliaKostroma/timecoder.git
cd timecoder
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env.local` file in project root:
```bash
cp .env.example .env.local
```

Get your Replicate API token at [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) and add to `.env.local`:
```
REPLICATE_API_TOKEN=your_token_here
```

4. **Run the server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Limitations & Cost

- **Optimal:** up to 1 hour of video
- **Technically possible:** up to 2-3 hours

### Processing Cost

| Duration | Processing Time | Cost |
|----------|----------------|------|
| 10 minutes | ~7 seconds | ~$0.007 (< 1 cent) |
| 1 hour | ~40 seconds | ~$0.04 (4 cents) |

See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for more details.

## Security

⚠️ **IMPORTANT:** Never commit `.env.local` with your API keys!

The file is already added to `.gitignore`, but if you accidentally committed keys:
1. Immediately revoke keys on Replicate
2. Create new keys
3. Use `git filter-branch` or BFG Repo-Cleaner to remove from history

## License

MIT
