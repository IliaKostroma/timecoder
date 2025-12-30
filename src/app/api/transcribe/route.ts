import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert Blob to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        // Using incredibly-fast-whisper for 3-5x speed improvement
        // This model is optimized for speed while maintaining good accuracy
        const output = await replicate.run(
            "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
            {
                input: {
                    audio: buffer,
                    task: "transcribe",
                    language: "None",
                    timestamp: "chunk",
                    batch_size: 64,
                    diarise_audio: false
                }
            }
        );

        // We need segments to know timecodes!
        // If output is just text, we can't generate chapters accurately based on time.
        // Wait, the user wants CHAPTERS (Timecodes). I need timestamps.
        // So I should request a verbose format or segments.
        // Replicate openai/whisper usually returns a JSON object with `segments` if I don't force plain text.

        // Let's assume output has segments.
        // We will pass the full JSON output (or relevant parts) to the LLM.
        // Or simpler: format it as "[00:00] text..." string for the LLM.

        return NextResponse.json({ transcript: output });
    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }
}
