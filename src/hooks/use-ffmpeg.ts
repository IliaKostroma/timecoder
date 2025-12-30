import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export function useFFmpeg() {
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const messageRef = useRef<HTMLParagraphElement | null>(null);

    const load = async () => {
        setIsLoading(true);
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

        if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg();
        }
        const ffmpeg = ffmpegRef.current!;

        ffmpeg.on('log', ({ message }) => {
            console.log(message);
        });

        ffmpeg.on('progress', ({ progress }) => {
            setProgress(Math.round(progress * 100));
        });

        try {
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setLoaded(true);
        } catch (error) {
            console.error('Failed to load FFmpeg', error);
        } finally {
            setIsLoading(false);
        }
    };

    const extractAudio = async (file: File): Promise<Blob | null> => {
        if (!loaded) await load();
        const ffmpeg = ffmpegRef.current;
        if (!ffmpeg) return null;

        // Write the file to memory
        await ffmpeg.writeFile('input.mp4', await fetchFile(file));

        // Extract audio
        // -vn: disable video
        // -acodec: libmp3lame (or copy if source is compatible, but safer to re-encode to mp3/aac)
        // -b:a 128k: bitrate
        await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', '-b:a', '128k', 'output.mp3']);

        // Read the result
        const data = await ffmpeg.readFile('output.mp3');
        return new Blob([data as any], { type: 'audio/mp3' });
    };

    return { load, extractAudio, loaded, isLoading, progress };
}

// Helper to convert File to Uint8Array
async function fetchFile(file: File): Promise<Uint8Array> {
    return new Uint8Array(await file.arrayBuffer());
}
