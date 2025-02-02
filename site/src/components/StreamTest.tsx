import React, { useState, useCallback, useRef } from 'react';
import { ElevenLabsClient } from 'elevenlabs';
import { useSession } from 'next-auth/react';
import { useVoice } from './VoiceContext';

const StreamTest = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const lastProcessedTextRef = useRef<string | null>(null);
  const lastUsedVoiceRef = useRef<string | null>(null);

  const { 
    currentVoiceName, 
    currentVoiceId, 
    transcriptionQueue,
    clearProcessedTranscription 
  } = useVoice();
  
  const { data: session } = useSession();

  const processTranscription = useCallback(async () => {
    if (isProcessing || transcriptionQueue.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const currentText = transcriptionQueue[0];
      setCurrentlyPlaying(currentText);

      const client = new ElevenLabsClient({
        apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
      });

      // If voice has changed, don't use previous text for better transition
      const shouldUsePreviousText = lastUsedVoiceRef.current === currentVoiceId;
      
      const audioStream = await client.generate({
        voice: currentVoiceId,
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
      
      // Remove the processed transcription
      clearProcessedTranscription();
      
    } catch (error) {
      console.error('Error processing text stream:', error);
    } finally {
      setIsProcessing(false);
      setCurrentlyPlaying(null);
    }
  }, [isProcessing, transcriptionQueue, currentVoiceId, clearProcessedTranscription]);

  // Process queue whenever it changes or finishes processing
  React.useEffect(() => {
    processTranscription();
  }, [transcriptionQueue, isProcessing, processTranscription]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Status Display
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
          {transcriptionQueue.length > 0 && (
            <div className="mt-2">
              <p>In queue:</p>
              {transcriptionQueue.map((text, index) => (
                <p key={index} className="text-xs mt-1 opacity-75">• {text}</p>
              ))}
            </div>
          )}
        </div>
      </div> */}
    </div>
  );
};

export default StreamTest;