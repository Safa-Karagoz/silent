import React, { useState, useRef, useEffect } from 'react';

// Simple icon components
const MicIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const StopIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="red" strokeWidth="0">
    <rect x="6" y="6" width="12" height="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
    <path d="M3 6h18"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
    <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10"/>
  </svg>
);

interface AudioRecorderProps {
  setVoiceId: (voiceId: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ setVoiceId }) => {
  const HIGH_QUALITY_AUDIO_CONSTRAINTS = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 2, // Stereo recording
      sampleRate: 96000, // Increased from 48000 for higher quality
      sampleSize: 32, // Increased from 24 for higher bit depth
      latency: 0, // Lowest possible latency
      volume: 1.0, // Maximum volume
      // Advanced constraints for better quality
      advanced: [
        {
          channelMode: 'stereo',
          sampleSize: 32,
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true }
        }
      ]
    }
  };

  interface Recording {
    url: string;
    blob: Blob;
    duration: number;
  }
  
  // Define recorder options with higher bitrate
  const HIGH_QUALITY_RECORDER_OPTIONS = {
    audioBitsPerSecond: 320000, // 320kbps for high quality audio
    mimeType: '' // Will be set dynamically based on browser support
  };

  const MINIMUM_TOTAL_DURATION = 10; // Minimum total duration in seconds

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext | null>(null);

  const getBestMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/mpeg'
  ];

  return types.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
  };

  // Helper function to get audio duration from blob
  const getAudioDuration = async (blob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = async () => {
      try {
        const arrayBuffer = fileReader.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        resolve(audioBuffer.duration);
        audioContext.close();
      } catch (error) {
        reject(error);
        audioContext.close();
      }
    };

    fileReader.onerror = (error) => {
      reject(error);
      audioContext.close();
    };

    fileReader.readAsArrayBuffer(blob);
  });
  };

  const updateTotalDuration = (recordings: Recording[]) => {
  const total = recordings.reduce((sum, recording) => sum + recording.duration, 0);
  setTotalDuration(total);
  return total;
  };

  const handleStartRecording = async () => {
  try {
    chunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia(HIGH_QUALITY_AUDIO_CONSTRAINTS);
    streamRef.current = stream;

    const recorderOptions = {
      ...HIGH_QUALITY_RECORDER_OPTIONS,
      mimeType: getBestMimeType()
    };

    const mediaRecorder = new MediaRecorder(stream, recorderOptions);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const mimeType = mediaRecorder.mimeType;
      const audioBlob = new Blob(chunksRef.current, { type: mimeType });
      
      try {
        // Get the actual duration of the recorded audio
        const duration = await getAudioDuration(audioBlob);
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setRecordings(prev => {
          const newRecordings = [...prev, { url: audioUrl, blob: audioBlob, duration }];
          updateTotalDuration(newRecordings);
          return newRecordings;
        });
      } catch (error) {
        console.error('Error getting audio duration:', error);
        alert('Error processing the recording. Please try again.');
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      streamRef.current = null;
      mediaRecorderRef.current = null;
      chunksRef.current = [];
    };

    mediaRecorder.start(50);
    setIsRecording(true);

    setRecordingDuration(0);
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        if (prev >= 60) {
          handleStopRecording();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    setTimeout(() => {
        handleStopRecording();
      }, 60000);

      } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please ensure you have granted permission and your device supports high-quality audio recording.');
      }
    };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingDuration(0);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }
  }
  };

  const handleDeleteRecording = (index: number) => {
    URL.revokeObjectURL(recordings[index].url);
    setRecordings(prev => {
      const newRecordings = prev.filter((_, i) => i !== index);
      updateTotalDuration(newRecordings);
      return newRecordings;
    });
  };

  const handleUpload = async () => {
  
  const totalDuration = recordings.reduce((sum, recording) => sum + recording.duration, 0);
  if (totalDuration < MINIMUM_TOTAL_DURATION) {
    alert(`Total recording duration must be at least ${MINIMUM_TOTAL_DURATION} seconds. Current duration: ${totalDuration.toFixed(1)} seconds`);
    return;
  }

  setIsUploading(true);
  const form = new FormData();
  form.append('name', 'High Quality Voice Sample');

  recordings.forEach(({ blob }, index) => {
    const extension = blob.type.includes('webm') ? 'webm' : 
                      blob.type.includes('ogg') ? 'ogg' : 
                      blob.type.includes('mp4') ? 'm4a' : 'mp3';
    form.append('files', blob, `high_quality_sample${index + 1}.${extension}`);
  });

  form.append('remove_background_noise', 'false');
  form.append('description', 'High quality voice samples for voice cloning');
  form.append('labels', '{}');

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Upload successful:', data);
    
    recordings.forEach(recording => URL.revokeObjectURL(recording.url));
    setRecordings([]);
    setTotalDuration(0);
    setVoiceId(data.voice_id);

    alert('High quality voice samples uploaded successfully!');
  } catch (err) {
    console.error('Error uploading to ElevenLabs:', err);
    alert('Failed to upload voice samples. Please try again.');
  } finally {
    setIsUploading(false);
  }
  };

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop any ongoing recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop and disable all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Clean up URLs
      recordings.forEach(recording => URL.revokeObjectURL(recording.url));
      
      // Clear refs
      mediaRecorderRef.current = null;
      streamRef.current = null;
      chunksRef.current = [];
    };
  }, [recordings]);

  return (
    <div className="w-full rounded-lg">
      <div className="mb-6">
        <p className="text-sm text-text">
          Record 2 samples of up to 60 seconds each for voice cloning. 
        </p>
        <p className="text-sm text-text">
          Please speak clearly and in a normal tone with no background noise.
        </p>
        <p className="text-sm text-text mb-4">
          By recording these samples, you consent to the replication and use of your voice for this product.
        </p>
        
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={recordings.length >= 2 || isUploading}
            type='button'
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-secondary border hover:enabled:bg-primary hover:active:enabled:bg-secondary text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRecording ? (
              <>
                <StopIcon />
                Stop Recording
              </>
            ) : (
              <>
                <MicIcon />
                Start Recording
              </>
            )}
          </button>
          {isRecording && (
            <div className="text-sm font-medium animate-pulse text-red-500">
              Recording: {recordingDuration}s / 60s
            </div>
          )}
        </div>

        <div className="space-y-3">
          {recordings.map(({ url }, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border border-secondary rounded-lg">
              <audio 
                src={url} 
                controls 
                className="flex-1" 
                controlsList="nodownload"
              />
              <button
                onClick={() => handleDeleteRecording(index)}
                className="p-2 text-red-500 hover:text-red-600 transition-colors"
                aria-label="Delete recording"
                type='button'
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleUpload}
        disabled={recordings.length < 1 || totalDuration < MINIMUM_TOTAL_DURATION || isUploading}
        type='button'
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border-secondary border hover:enabled:bg-primary hover:active:enabled:bg-secondary text-text rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? (
          <>
            <SpinnerIcon />
            Uploading...
          </>
        ) : (
          <>
            <UploadIcon />
            Upload to ElevenLabs
          </>
        )}
      </button>

      <div className="mt-4 text-sm text-gray-500 text-center">
        {recordings.length}/2 recordings saved
      </div>
    </div>
  );
};

export default AudioRecorder;