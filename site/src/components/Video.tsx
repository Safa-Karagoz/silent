import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

const VideoFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    startCamera();
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
      setError('Unable to access camera. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[hsl(240,60%,99%)] shadow-lg h-full flex flex-col border-2 border-[hsl(33,70%,63%)] rounded-lg p-2">
      
      <div className="relative flex-1 w-full bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-[hsl(33,70%,63%)] animate-spin" />
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 text-center">
            {error}
            <button 
              onClick={startCamera}
              className="ml-2 text-[hsl(33,70%,63%)] hover:underline"
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
    </div>
  );
};

export default VideoFeed;