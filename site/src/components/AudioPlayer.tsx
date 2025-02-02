import React, { useRef, useEffect } from 'react';

interface AudioPlayerProps {
  streamUrl: string;
  text: string;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
}

const AudioPlayer = ({ streamUrl, text, onPlaybackStart, onPlaybackEnd }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    audio.src = streamUrl;
    
    const handlePlay = () => {
      onPlaybackStart?.();
    };

    const handleEnded = () => {
      onPlaybackEnd?.();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [streamUrl, onPlaybackStart, onPlaybackEnd]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <p className="mb-3 text-sm text-gray-600">{text}</p>
      <audio ref={audioRef} controls className="w-full" />
    </div>
  );
};

export default AudioPlayer;