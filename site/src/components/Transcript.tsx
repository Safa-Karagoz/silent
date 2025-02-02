import React, { useEffect, useRef, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { useVoice } from './VoiceContext';

const TranscriptView = () => {
  const transcriptRef = useRef<HTMLDivElement>(null);
  const { transcriptionQueue } = useVoice();
  const [transcript, setTranscript] = useState<Array<{ time: string, text: string }>>([]);

  useEffect(() => {
    if (transcriptionQueue.length > 0) {
      const currentTime = new Date();
      const timeString = currentTime.toTimeString().split(' ')[0];
      
      const newEntry = {
        time: timeString,
        text: transcriptionQueue[transcriptionQueue.length - 1]
      };
      
      setTranscript(prev => [...prev, newEntry]);
    }
  }, [transcriptionQueue]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white rounded-lg shadow-md flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-full">
              <FileText className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Transcript</h3>
          </div>
          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Download transcript"
          >
            <Download className="h-5 w-5 text-orange-400" />
          </button>
        </div>
        
        <div 
          ref={transcriptRef}
          className="overflow-y-auto max-h-[calc(100vh-520px)]"
        >
          <div className="p-4">
            {transcript.map((entry, index) => (
              <div 
                key={index} 
                className="mb-4 last:mb-0"
              >
                <p className="text-gray-900 mt-1 border-b-2 border-primary">
                  {entry.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptView;