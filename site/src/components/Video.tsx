// components/VideoFeed.tsx
import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Video } from 'lucide-react';

interface MediaStreamError {
  name: string;
  message: string;
}

const VideoFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const recordingSessionId = useRef<string>('');
  const timerId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopAndCleanup();
    };
  }, []);

  const stopAndCleanup = () => {
    if (timerId.current) {
      clearInterval(timerId.current);
      timerId.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setError('');
    } catch (err) {
      const error = err as MediaStreamError;
      setError(`Unable to access camera: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewRecording = () => {
    if (!streamRef.current) return;

    // Stop any existing recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Create a new MediaRecorder instance
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm'
    });

    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = async () => {
      if (chunks.length === 0) return;

      const blob = new Blob(chunks, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('video', blob, `chunk_${Date.now()}.webm`);
      formData.append('sessionId', recordingSessionId.current);

      try {
        const response = await fetch('/api/capture-video', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Successfully sent chunk of size:', blob.size);
      } catch (err) {
        console.error('Error sending video chunk:', err);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();

    // Stop recording after 3 seconds
    setTimeout(() => {
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    }, 3000);
  };

  const toggleCapture = () => {
    if (isCapturing) {
      // Stop capturing
      if (timerId.current) {
        clearInterval(timerId.current);
        timerId.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      recordingSessionId.current = '';
    } else {
      // Start capturing
      recordingSessionId.current = `session_${Date.now()}`;
      startNewRecording();
      // Start a new recording every 3 seconds
      timerId.current = setInterval(startNewRecording, 3000);
    }
    setIsCapturing(!isCapturing);
  };

  return (
    <div className="bg-slate-50 shadow-lg h-full flex flex-col border-2 border-orange-300 rounded-lg p-2">
      <div className="relative flex-1 w-full bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-orange-300 animate-spin" />
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 text-center">
            {error}
            <button 
              onClick={startCamera}
              className="ml-2 text-orange-300 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-lg transform scale-x-[-1]"
          />
        )}
      </div>
      
      <div className="mt-4 flex justify-center">
        <button
          onClick={toggleCapture}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isCapturing 
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-orange-300 hover:bg-orange-400 text-white'
          }`}
          disabled={!!error || isLoading}
        >
          <Video className="w-5 h-5" />
          {isCapturing ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
    </div>
  );
};

export default VideoFeed;