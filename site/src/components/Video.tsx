// components/VideoFeed.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Video } from 'lucide-react';

interface MediaStreamError {
  name: string;
  message: string;
}

const VideoFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      // Cleanup video stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
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

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg');
      });
      
      const formData = new FormData();
      formData.append('video', blob, 'capture.jpg');
      
      const response = await fetch('/api/capture-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error sending capture:', err);
    }
  };

  const toggleCapture = () => {
    if (isCapturing) {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    } else {
      captureIntervalRef.current = setInterval(captureFrame, 3000);
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
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-lg transform scale-x-[-1]"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
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
          {isCapturing ? 'Stop Capturing' : 'Start Capturing'}
        </button>
      </div>
    </div>
  );
};

export default VideoFeed;