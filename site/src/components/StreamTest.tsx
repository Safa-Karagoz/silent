import React, { useState, useCallback, useRef } from 'react';
import { ElevenLabsClient } from 'elevenlabs';
import { useSession } from 'next-auth/react';
import { useVoice } from './VoiceContext';

const StreamTest = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [textQueue, setTextQueue] = useState<string[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const lastProcessedTextRef = useRef<string | null>(null);
  const lastUsedVoiceRef = useRef<string | null>(null);

  const { currentVoiceName, currentVoiceId } = useVoice();
  const { data: session } = useSession();

  const processQueue = useCallback(async () => {
    if (isProcessing || textQueue.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const currentText = textQueue[0];
      setCurrentlyPlaying(currentText);

      const client = new ElevenLabsClient({
        apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
      });

      // If voice has changed, don't use previous text for better transition
      const shouldUsePreviousText = lastUsedVoiceRef.current === currentVoiceId;
      
      const audioStream = await client.generate({
        voice: currentVoiceId, // Use the voice ID for API calls
        model_id: 'eleven_flash_v2_5',
        text: currentText,
        previous_text: shouldUsePreviousText ? (lastProcessedTextRef.current ?? undefined) : undefined
      });

      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }

      const audioBuffer = Buffer.concat(chunks);
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      await new Promise((resolve, reject) => {
        const audio = new Audio(url);
        
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };

        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          URL.revokeObjectURL(url);
          reject(error);
        };

        audio.play();
      });

      // Update refs for next generation
      lastProcessedTextRef.current = currentText;
      lastUsedVoiceRef.current = currentVoiceId;
      
      // Remove the processed text from queue
      setTextQueue(prev => prev.slice(1));
      
    } catch (error) {
      console.error('Error processing text stream:', error);
    } finally {
      setIsProcessing(false);
      setCurrentlyPlaying(null);
    }
  }, [isProcessing, textQueue, currentVoiceId]);

  // Process queue whenever it changes or finishes processing
  React.useEffect(() => {
    processQueue();
  }, [textQueue, isProcessing, processQueue]);

  // Test texts that would naturally flow together
  const testTexts = [
    "Hi! How are you",
    "doing today? Do you have anything planned for the evening?"
  ];

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="flex gap-4">
        <button
          onClick={() => setTextQueue(prev => [...prev, testTexts[0]])}
          className="px-6 py-3 rounded-lg font-medium transition-colors
            bg-blue-500 hover:bg-blue-600 text-white"
        >
          Send First Part
        </button>

        <button
          onClick={() => setTextQueue(prev => [...prev, testTexts[1]])}
          className="px-6 py-3 rounded-lg font-medium transition-colors
            bg-green-500 hover:bg-green-600 text-white"
        >
          Send Second Part
        </button>
      </div>

      {/* Status Display */}
      <div className="text-sm text-gray-600 mt-4">
        <div>
          <p>Current Voice: <span className="font-medium">{currentVoiceName}</span></p>
          <p>Voice ID: <span className="font-medium">{currentVoiceId}</span></p>
          
          {lastProcessedTextRef.current && (
            <div className="mb-2 mt-4">
              <p>Previous text:</p>
              <p className="text-xs mt-1 opacity-75">{lastProcessedTextRef.current}</p>
            </div>
          )}
          {currentlyPlaying && (
            <div>
              <p>Currently playing:</p>
              <p className="font-medium mt-1">{currentlyPlaying}</p>
            </div>
          )}
          {textQueue.length > 0 && (
            <div className="mt-2">
              <p>In queue:</p>
              {textQueue.map((text, index) => (
                <p key={index} className="text-xs mt-1 opacity-75">• {text}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamTest;