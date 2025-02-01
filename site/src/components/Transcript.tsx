import React, { useEffect, useRef } from 'react';
import { FileText, Download } from 'lucide-react';

const TranscriptView = () => {
  const transcriptRef = useRef<HTMLDivElement>(null);
  
  const mockTranscript = [
    { time: '00:00', text: 'Hello, this is a sample transcript.' },
    { time: '00:05', text: 'It will show the conversation in real-time.' },
    { time: '00:10', text: 'Each entry will have a timestamp and the spoken text.' },
    { time: '00:10', text: 'Each entry will have a timestamp and the spoken text.' },
    { time: '00:10', text: 'Each entry will have a timestamp and the spoken text.' }
  ];

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [mockTranscript]); // Scroll when transcript updates

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="p-4 border-b border-[hsl(73,17%,74%)] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[hsl(33,70%,63%,0.1)] rounded-full">
            <FileText className="h-5 w-5 text-[hsl(33,70%,63%)]" />
          </div>
          <h3 className="text-lg font-bold text-[hsl(240,36%,4%)]">Transcript</h3>
        </div>
        <button 
          className="p-2 hover:bg-[hsl(73,17%,74%,0.2)] rounded-full transition-colors"
          title="Download transcript"
        >
          <Download className="h-5 w-5 text-[hsl(33,70%,63%)]" />
        </button>
      </div>
      
      <div 
        ref={transcriptRef}
        className="flex-1 overflow-y-auto p-4"
      >
        {mockTranscript.map((entry, index) => (
          <div 
            key={index} 
            className="mb-4 last:mb-0"
          >
            <span className="text-sm text-[hsl(33,70%,63%)] font-mono">
              {entry.time}
            </span>
            <p className="text-[hsl(240,36%,4%)] mt-1">
              {entry.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TranscriptView;  