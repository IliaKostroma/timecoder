'use client';
import { motion } from "framer-motion";
import { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { Upload, FileAudio, FileVideo, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function UploadZone({ onAudioExtracted }: { onAudioExtracted: (blob: Blob) => void }) {
    const { extractAudio, isLoading: isFfmpegLoading, loaded, progress } = useFFmpeg();
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        setError(null);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('video/')) {
            setError("Please upload a video file.");
            return;
        }

        processFile(file);
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setError(null);
            const file = e.target.files[0];
            if (!file.type.startsWith('video/')) {
                setError("Please upload a video file.");
                return;
            }
            processFile(file);
        }
    }, []);

    const processFile = async (file: File) => {
        setIsProcessing(true);
        try {
            const audioBlob = await extractAudio(file);
            if (audioBlob) {
                onAudioExtracted(audioBlob);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to extract audio. See console for details.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className="w-full max-w-xl mx-auto border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center p-10 space-y-4">
                <motion.div
                    className={cn(
                        "w-full h-64 rounded-xl bg-muted/30 flex flex-col items-center justify-center cursor-pointer transition-all border-2 border-dashed relative overflow-hidden",
                        isDragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload')?.click()}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    animate={{ borderColor: isDragOver ? "var(--primary)" : "var(--border)" }}
                >
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept="video/*"
                        onChange={handleFileSelect}
                    />

                    {isProcessing ? (
                        <div className="w-full max-w-xs space-y-4 text-center z-10">
                            <motion.div
                                className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent mx-auto"
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            />
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Extracting Audio...</p>
                                <p className="text-xs text-muted-foreground">{progress}% Complete</p>
                            </div>
                            <Progress value={progress} className="h-2 w-full" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-4 text-center p-6 z-10">
                            <div className="p-4 rounded-full bg-background/80 shadow-sm ring-1 ring-border/50">
                                <Upload className="w-8 h-8 text-primary/80" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold tracking-tight">Upload Video File</h3>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    Drag and drop generic video files or click to browse.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-2 py-1 rounded-md bg-background/50 border text-[10px] uppercase text-muted-foreground font-medium">MP4</span>
                                <span className="px-2 py-1 rounded-md bg-background/50 border text-[10px] uppercase text-muted-foreground font-medium">MOV</span>
                                <span className="px-2 py-1 rounded-md bg-background/50 border text-[10px] uppercase text-muted-foreground font-medium">MKV</span>
                            </div>
                        </div>
                    )}
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md w-full"
                    >
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
