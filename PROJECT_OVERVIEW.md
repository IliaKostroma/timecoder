# TIMECODER - YouTube Chapters Generator

## Project Description

TIMECODER is a web application for automatic generation of YouTube chapters (timestamps) from video files using AI.

### Core Functionality

1. **Video Upload** - User uploads a video file (MP4, MOV, MKV, etc.)
2. **Audio Extraction** - FFmpeg converts video to optimized audio file
3. **Transcription** - Whisper model transcribes audio with timestamps
4. **Chapter Generation** - Claude 3.5 Haiku analyzes transcript and creates SEO-optimized YouTube chapters
5. **Edit & Copy** - User can edit results and copy to YouTube description

---

## Technology Stack

### Frontend
- **Next.js 16.1.1** (React 19) - Framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Framer Motion** - Animations
- **Radix UI** - UI components (Progress, ScrollArea, Slot)
- **Lucide React** - Icons

### Backend (API Routes)
- **Next.js API Routes** - Server endpoints
- **Replicate API** - Platform for running AI models
- **ffmpeg-static** - Embedded FFmpeg binary (cross-platform)

### AI Models

1. **Whisper** (`vaibhavs10/incredibly-fast-whisper`)
   - Version: 3-5x faster than base Whisper
   - Task: Audio transcription with timestamps
   - Cost: $0.000975 per second

2. **Claude 3.5 Haiku** (`anthropic/claude-3.5-haiku`)
   - Task: Generate SEO-optimized chapters
   - Input: $1 per 1M tokens
   - Output: $5 per 1M tokens

---

## Application Architecture

```
/src
├── /app
│   ├── /api
│   │   ├── /transcribe
│   │   │   └── route.ts          # API: Whisper transcription
│   │   └── /generate
│   │       └── route.ts          # API: Claude chapter generation
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page (workflow)
├── /components
│   ├── /ui                       # Base UI components
│   └── upload-zone.tsx           # Video upload component
├── /hooks
│   └── use-ffmpeg.ts             # FFmpeg hook (if needed)
└── /lib
    ├── utils.ts                  # Utilities (cn for className)
    └── ffmpeg.ts                 # FFmpeg wrapper with cross-platform support
```

### Workflow Diagram

```
1. UPLOAD
   ↓ (user uploads video)
2. TRANSCRIBING
   ↓ (FFmpeg extracts audio → Whisper transcribes)
3. REVIEW
   ↓ (user reviews/edits transcript)
4. GENERATING
   ↓ (Claude generates chapters)
5. DONE
   ↓ (user copies result)
```

---

## API Endpoints

### POST `/api/transcribe`
**Description:** Accepts audio file, sends to Replicate Whisper, returns transcript with timestamps.

**Input:**
- Video file uploaded via FormData

**Process:**
1. Save video to temporary file
2. Convert video → MP3 (mono, 16kHz, 48kbps) using FFmpeg
3. Send audio to Whisper on Replicate
4. Clean up temporary files

**Output:**
```json
{
  "transcript": {
    "chunks": [
      {
        "timestamp": [0, 5.2],
        "text": "Hello world"
      }
    ]
  }
}
```

**Client Processing:**
- Formats to string: `[0:00] Hello world\n[0:05] Next sentence...`

---

### POST `/api/generate`
**Description:** Accepts transcript, sends to Claude 3.5 Haiku, returns YouTube chapters.

**Input:**
```json
{
  "transcript": "[0:00] Hello world\n[0:05] Next sentence..."
}
```

**Output:**
```json
{
  "chapters": "00:00 Intro: The Main Topic\n00:05 Key Point #1\n01:23 How to Do Something"
}
```

**System Prompt:**
- Strict formatting rules (MM:SS with leading zeros)
- SEO-optimized chapter titles
- Action verbs usage
- 5-8 chapters per video

---

## Limitations and Performance

### Maximum Video Length
- **Optimal:** up to 1 hour
- **Technically possible:** up to 2-3 hours
- **Limitations:**
  - Whisper may produce OOM on very long files (batch_size reduced to 8)
  - Claude context window: 200K tokens ≈ 2-3 hours of transcript
  - Upload file size limited by Next.js settings (default ~50MB for body)

### Processing Cost

| Duration | Whisper | Claude Haiku | **TOTAL** |
|----------|---------|--------------|-----------|
| 1 minute | $0.059  | ~$0.001      | **$0.06** |
| 10 minutes | $0.59 | ~$0.004      | **$0.59** |
| 1 hour   | $3.51   | ~$0.02       | **$3.53** |

*95% of cost is Whisper, Claude adds pennies*

---

## Installation and Setup

### Requirements
- Node.js 20+
- npm or yarn
- Replicate API Token

### Installation Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd TIMECODER
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env.local`:
```bash
cp .env.example .env.local
```

Get your Replicate API token at [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)

Edit `.env.local`:
```env
REPLICATE_API_TOKEN=your_token_here
```

4. **Run the server**

**Option 1: npm**
```bash
npm run dev
```

**Option 2: Automated script (macOS)**
```bash
./start.command
```
Script automatically:
- Checks and frees ports 3000/3001
- Installs dependencies
- Starts dev server

5. **Open browser**
```
http://localhost:3000
```

---

## Implementation Details

### 1. FFmpeg on Server
- Uses `ffmpeg-static` (embedded binary, works on all platforms)
- Video processing happens server-side (not in browser)
- Fallback to system FFmpeg if available
- Out-of-the-box Windows/macOS/Linux support
- Priority order:
  1. `FFMPEG_PATH` environment variable
  2. System FFmpeg (if in PATH)
  3. ffmpeg-static (embedded binary)

### 2. Audio Optimization
- Converts to mono, 16kHz, 48kbps MP3
- 4 hours of video ≈ 80-90 MB audio
- Optimized for Whisper model requirements

### 3. Replicate API
- Whisper returns object with `chunks` (array of segments with timestamps)
- Claude returns array of strings (streaming), joined via `.join('')`
- Batch size set to 8 to avoid GPU memory issues

### 4. Error Handling
- Server logs detailed error information
- Client displays user-friendly messages
- 400 error if no transcript in `/api/generate`

### 5. UX/UI
- Drag & drop upload
- Framer Motion animations
- Progress bar during processing
- Gradient mesh background
- Editable textareas for transcript and chapters

---

## Known Issues and Solutions

### Issue 1: Claude doesn't create task on Replicate
**Cause:** Unsupported `temperature` parameter was used

**Solution:** Removed parameter from request (fixed in `src/app/api/generate/route.ts:76`)

Model `anthropic/claude-3.5-haiku` on Replicate accepts only:
- `prompt` (required)
- `system_prompt` (optional)
- `max_tokens` (optional)

### Issue 2: Port 3000 busy on startup
**Solution:** Use `start.command` - automatically kills processes on occupied ports

### Issue 3: FFmpeg not found on Windows
**Solution:** Now uses `ffmpeg-static` package with automatic fallback (fixed in `src/lib/ffmpeg.ts`)

---

## Potential Improvements

### Features
- [ ] Support video URLs (YouTube, Vimeo) instead of file upload
- [ ] Export to different formats (JSON, SRT, VTT)
- [ ] Multi-language support
- [ ] Automatic language detection
- [ ] Batch processing (multiple videos)
- [ ] Processing history (LocalStorage or DB)

### Technical
- [ ] Add rate limiting
- [ ] Result caching
- [ ] Progress bar for Replicate tasks (polling status)
- [ ] Server-Sent Events for real-time updates
- [ ] Chunked upload for large files
- [ ] Deploy to Vercel/Railway
- [ ] Docker containerization

### UI/UX
- [ ] Dark/light theme toggle
- [ ] Video preview
- [ ] Rich text editor for chapters
- [ ] Chapter style templates (formal, casual, technical)
- [ ] Export to styled PDF

---

## Dependencies

### Production
```json
{
  "ffmpeg-static": "^5.3.0",
  "framer-motion": "^12.23.26",
  "lucide-react": "^0.562.0",
  "next": "16.1.1",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "replicate": "^1.4.0",
  "tailwind-merge": "^3.4.0"
}
```

### Development
```json
{
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "16.1.1",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

---

## Project Structure

```
TIMECODER/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/route.ts    # Claude API
│   │   │   └── transcribe/route.ts  # Whisper API
│   │   ├── favicon.ico
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Main UI
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── progress.tsx
│   │   │   └── textarea.tsx
│   │   └── upload-zone.tsx          # Drag & drop component
│   └── lib/
│       ├── utils.ts
│       └── ffmpeg.ts                # FFmpeg wrapper
├── .env.local                        # API keys (DO NOT COMMIT!)
├── .env.example                      # Template for API keys
├── .gitignore                        # Git ignore rules
├── .next/                            # Build artifacts
├── node_modules/
├── package.json
├── next.config.ts                    # Next.js config
├── tailwind.config.ts
├── tsconfig.json
├── start.command                     # Startup script (macOS)
├── README.md                         # Quick start guide
└── PROJECT_OVERVIEW.md              # This file
```

---

## Security Notes

### Environment Variables
- **Never commit `.env.local`** with real API keys
- `.env*` is already in `.gitignore`
- Use `.env.example` as template

### If Keys Were Accidentally Committed
1. Immediately revoke keys on Replicate
2. Create new keys
3. Use `git filter-branch` or BFG Repo-Cleaner to remove from history

---

## License

MIT

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Last updated:** January 2026
