import React, { useState } from 'react';
import { ElevenLabsClient } from 'elevenlabs';

const StreamTest = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTest = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    
    try {
      const client = new ElevenLabsClient({
        apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
      });

      // Get the audio stream using the generate method
      const audioStream = await client.generate({
        voice: 'Rachel',
        model_id: 'eleven_flash_v2_5',
        text: 'Hi! This is a test stream.'
      });

      // Collect chunks into a buffer
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }

      // Concatenate all chunks
      const audioBuffer = Buffer.concat(chunks);
      
      // Create blob from buffer
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsPlaying(false);
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        URL.revokeObjectURL(url);
        setIsPlaying(false);
      };

      await audio.play();
      
    } catch (error) {
      console.error('Error playing audio stream:', error);
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <button
        onClick={handleTest}
        disabled={isPlaying}
        className={`px-6 py-3 rounded-lg font-medium transition-colors
          ${isPlaying 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
      >
        {isPlaying ? 'Playing...' : 'Test Stream'}
      </button>
    </div>
  );
};

export default StreamTest;