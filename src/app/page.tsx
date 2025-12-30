'use client';

import { useState } from "react";
import { UploadZone } from "@/components/upload-zone";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  const [step, setStep] = useState<'upload' | 'transcribing' | 'review' | 'generating' | 'done'>('upload');
  const [transcript, setTranscript] = useState<string>("");
  const [chapters, setChapters] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleVideoSelected = async (videoFile: File) => {
    setStep('transcribing');
    setError(null);

    try {
      // Create FormData and send video directly
      const formData = new FormData();
      formData.append('file', videoFile);

      // Send to API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();

      // Handle Replicate output structure
      let text = "";
      if (typeof data.transcript === 'string') {
        text = data.transcript;
      } else if (data.transcript && typeof data.transcript === 'object') {
        // Format chunks with timestamps if available
        if (data.transcript.chunks && Array.isArray(data.transcript.chunks)) {
          text = data.transcript.chunks.map((chunk: any) => {
            if (chunk.timestamp && Array.isArray(chunk.timestamp)) {
              const startTime = chunk.timestamp[0];
              const minutes = Math.floor(startTime / 60);
              const seconds = Math.floor(startTime % 60);
              const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
              return `[${timeStr}] ${chunk.text}`;
            }
            return chunk.text || '';
          }).join('\n');
        } else {
          // Fallback if no chunks
          text = JSON.stringify(data.transcript, null, 2);
        }
      }

      setTranscript(text);
      setStep('review');

    } catch (err) {
      console.error(err);
      setError('Failed to transcribe audio. Please try again.');
      setStep('upload');
    }
  };

  const handleGenerateChapters = async () => {
    setStep('generating');
    setError(null);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Generation failed');
      }

      setChapters(data.chapters);
      setStep('done');
    } catch (err) {
      console.error('Generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate chapters.';
      setError(errorMessage);
      setStep('review');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans selection:bg-primary/20">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-3xl opacity-50 mix-blend-multiply animate-blob" />
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-3xl opacity-50 mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] rounded-full bg-pink-500/10 blur-3xl opacity-50 mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <main className="max-w-4xl mx-auto space-y-8 relative z-10 py-12 px-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">YouTube Chapters Generator</h1>
          <p className="text-muted-foreground">Automatically generate timestamps for your videos using AI.</p>
        </div>

        {step === 'upload' && (
          <UploadZone onVideoSelected={handleVideoSelected} />
        )}

        {(step === 'transcribing' || step === 'generating') && (
          <Card>
            <CardHeader>
              <CardTitle>{step === 'transcribing' ? 'Transcribing Audio...' : 'Generating Chapters...'}</CardTitle>
              <CardDescription>This usually takes a minute or two depending on length.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-10">
              <div className="animate-pulse flex space-x-4">
                <div className="h-4 w-4 bg-primary rounded-full animate-bounce delay-0"></div>
                <div className="h-4 w-4 bg-primary rounded-full animate-bounce delay-150"></div>
                <div className="h-4 w-4 bg-primary rounded-full animate-bounce delay-300"></div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle>Transcript Review</CardTitle>
              <CardDescription>Review the transcribed text before generating chapters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="h-64 font-mono text-sm"
              />
              <div className="flex justify-end">
                <Button onClick={handleGenerateChapters}>Generate Chapters</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'done' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Chapters</CardTitle>
              <CardDescription>Copy and paste these into your video description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={chapters}
                onChange={(e) => setChapters(e.target.value)}
                className="h-64 font-mono text-sm"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setStep('upload')}>Start Over</Button>
                <Button onClick={() => navigator.clipboard.writeText(chapters)}>Copy to Clipboard</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="text-destructive text-center p-4 bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

      </main>
    </div>
  );
}
