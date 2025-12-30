import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(req: Request) {
    try {
        const { transcript } = await req.json();

        if (!transcript) {
            return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
        }

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        const systemPrompt = `You are a YouTube SEO expert. Generate ONLY YouTube chapter timestamps - nothing else.

CRITICAL RULES:
1. **TIMESTAMPS ONLY**: Return ONLY the chapter list. NO explanations, NO rationale, NO extra text before or after.
2. **ACCURACY**: Use ONLY timestamps that exist in the transcript. NEVER create timestamps beyond the video length.
3. **STRICT FORMAT**: ALWAYS use "MM:SS Title" format with leading zeros (00:00, 00:19, 01:12, 03:45, etc.)
4. **SEO OPTIMIZATION**: Use keywords viewers search for

TIMESTAMP FORMAT RULES (CRITICAL):
- ALWAYS use leading zeros: 00:05, 00:19, 01:12, 03:45, 04:16
- NEVER use: 0:05, 0:19, 1:12, 3:45, 4:16
- YouTube requires consistent MM:SS format with leading zeros

TITLE RULES:
- Action verbs: "How to...", "Why...", "The Secret to...", "Discover..."
- Specific outcomes: "How to Find Low-Stress Jobs" not "About Jobs"
- Concise: 3-7 words max
- NO generic titles like "Introduction", "Overview"

CORRECT EXAMPLES:
00:00 Intro: The Burnout Trap
00:19 What Are 'Lazy Girl Jobs'?
01:12 The Strategy: Outcomes vs. Hours
04:16 How to Automate Your Job Search

INCORRECT (DO NOT USE):
0:00 Intro: The Burnout Trap ❌ (missing leading zero)
0:19 What Are 'Lazy Girl Jobs'? ❌ (missing leading zero)
1:12 The Strategy ❌ (missing leading zero)
4:16 Automate Search ❌ (missing leading zero)

STRUCTURAL STEPS:
1. Identify video's main promise/hook
2. Find 3-5 key topic shifts in transcript
3. Extract exact timestamps for each shift
4. Create 5-8 chapters total (based on video length)

OUTPUT FORMAT (RETURN ONLY THIS, NOTHING ELSE):
00:00 [Title]
00:XX [Title]
01:XX [Title]
...

DO NOT include any text except the chapter list. No "Based on", no "Rationale:", no explanations.`;

        // Log transcript length for debugging
        console.log('Transcript length:', transcript.length);
        console.log('First 500 chars:', transcript.substring(0, 500));

        const output = await replicate.run(
            "anthropic/claude-3.5-haiku",
            {
                input: {
                    system_prompt: systemPrompt,
                    prompt: `Here is the video transcript with timestamps:

${transcript}

Generate ONLY the chapter timestamps. NO other text.`,
                    max_tokens: 1024,
                }
            }
        );

        // Replicate returns an array of strings for streaming models
        const chapters = Array.isArray(output) ? output.join('') : output;

        return NextResponse.json({ chapters });
    } catch (error) {
        console.error('Generation error:', error);
        // Log more details for debugging
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json({
            error: 'Failed to generate chapters',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
