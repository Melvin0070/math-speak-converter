
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';

interface AudioInputProps {
  onAudioRecorded: (blob: Blob) => void;
  isProcessing: boolean;
}

const AudioInput: React.FC<AudioInputProps> = ({ onAudioRecorded, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      // Reset recording state
      audioChunksRef.current = [];
      setRecordingTime(0);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onAudioRecorded(audioBlob);
        
        // Stop all audio tracks
        stream.getAudioTracks().forEach(track => track.stop());
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card p-6 rounded-2xl animate-fade-in">
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-medium mb-5">Speak Math</h2>
        
        <div className="mb-4 flex justify-center items-center h-16">
          {isRecording ? (
            <div className="flex items-end h-8 space-x-1">
              <div className="audio-wave-bar animate-wave1"></div>
              <div className="audio-wave-bar animate-wave2"></div>
              <div className="audio-wave-bar animate-wave3"></div>
              <div className="audio-wave-bar animate-wave2"></div>
              <div className="audio-wave-bar animate-wave1"></div>
            </div>
          ) : isProcessing ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <Mic className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        
        {isRecording && (
          <div className="text-sm font-medium mb-5 text-primary">
            {formatTime(recordingTime)}
          </div>
        )}
        
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          className="w-full transition-all duration-300 ease-in-out"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          {isRecording ? (
            <>
              <Square className="mr-2 h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </>
          )}
        </Button>
        
        <p className="mt-4 text-xs text-center text-muted-foreground">
          {isRecording
            ? "Recording... Click Stop when finished."
            : "Click Start and speak a mathematical expression clearly."}
        </p>
      </div>
    </div>
  );
};

export default AudioInput;
