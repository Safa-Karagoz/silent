import React, { useState, useEffect } from 'react';
import { Mic, Volume2, VolumeX, X } from 'lucide-react';
import AudioRecorder from './AudioRecorder';

interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  preview_url: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

interface VoicePreviewCardProps {
  voice: Voice;
  isSelected: boolean;
  onSelect: () => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
}

// Modal Component
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-[hsl(240,36%,4%,0.7)] backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[hsl(240,60%,99%)] rounded-xl shadow-xl p-6 z-50">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[hsl(73,17%,74%,0.2)] rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-[hsl(240,36%,4%)]" />
        </button>
        {children}
      </div>
    </>
  );
};

// Voice Preview Card Component
const VoicePreviewCard: React.FC<VoicePreviewCardProps> = ({ 
  voice, 
  isSelected, 
  onSelect, 
  isPlaying, 
  onPlayToggle 
}) => {
  return (
    <div 
      onClick={onSelect}
      className={`
        p-4 rounded-lg cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'bg-[hsl(33,70%,63%,0.1)] border-2 border-[hsl(33,70%,63%)]' 
          : 'bg-white border-2 border-transparent hover:border-[hsl(73,17%,74%)]'}
      `}
    >
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium text-[hsl(240,36%,4%)]">{voice.name}</h4>
          <p className="text-sm text-[hsl(240,36%,4%,0.7)] capitalize">{voice.gender}</p>
        </div>
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onPlayToggle();
          }}
          className="p-2 hover:bg-[hsl(73,17%,74%,0.2)] rounded-full transition-colors"
        >
          {isPlaying 
            ? <VolumeX className="h-5 w-5 text-[hsl(240,36%,4%)]" /> 
            : <Volume2 className="h-5 w-5 text-[hsl(240,36%,4%)]" />
          }
        </button>
      </div>
    </div>
  );
};

// Default voice options
const DEFAULT_VOICES: Voice[] = [
  { id: 'default-1', name: 'Adam', gender: 'male', preview_url: '/previews/adam.mp3' },
  { id: 'default-2', name: 'Sarah', gender: 'female', preview_url: '/previews/sarah.mp3' },
  { id: 'default-3', name: 'Michael', gender: 'male', preview_url: '/previews/michael.mp3' },
  { id: 'default-4', name: 'Emma', gender: 'female', preview_url: '/previews/emma.mp3' },
];

const VoiceSettings: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(DEFAULT_VOICES[0]);
  const [isPlaying, setIsPlaying] = useState<string>('');
  const [customVoiceId, setCustomVoiceId] = useState<string>('');
  const [showRecorder, setShowRecorder] = useState<boolean>(false);

  const handleVoiceSelect = (voice: Voice): void => {
    setSelectedVoice(voice);
    // Here you would save this preference to your backend
  };

  const handlePlayPreview = (voiceId: string, previewUrl: string): void => {
    if (isPlaying === voiceId) {
      const audio = document.getElementById('previewAudio') as HTMLAudioElement;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setIsPlaying('');
    } else {
      const audio = document.getElementById('previewAudio') as HTMLAudioElement;
      if (audio) {
        audio.src = previewUrl;
        audio.play();
        setIsPlaying(voiceId);
      }
    }
  };

  const handleCustomVoiceCreated = (voiceId: string): void => {
    setCustomVoiceId(voiceId);
    setShowRecorder(false);
  };

  // Current voice display component for dashboard
  const CurrentVoiceDisplay: React.FC = () => (
    <div 
      onClick={() => setIsModalOpen(true)}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
    >
      <div className="p-6 border-2 border-transparent hover:border-[hsl(33,70%,63%)] rounded-lg transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[hsl(33,70%,63%,0.1)] rounded-full">
            <Mic className="h-6 w-6 text-[hsl(33,70%,63%)]" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-[hsl(240,36%,4%)]">Voice Model</h3>
            <p className="text-[hsl(240,36%,4%,0.7)]">
              Currently using: <span className="font-medium">{selectedVoice.name}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-[hsl(33,70%,63%)]">
          <span>Click to change voice settings</span>
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <CurrentVoiceDisplay />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-[hsl(240,36%,4%)] mb-1">Voice Settings</h2>
            <p className="text-[hsl(240,36%,4%,0.7)]">Choose a voice model or create your own</p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[hsl(240,36%,4%)] mb-4">Default Voices</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEFAULT_VOICES.map((voice) => (
                  <VoicePreviewCard 
                    key={voice.id}
                    voice={voice}
                    isSelected={selectedVoice.id === voice.id}
                    onSelect={() => handleVoiceSelect(voice)}
                    isPlaying={isPlaying === voice.id}
                    onPlayToggle={() => handlePlayPreview(voice.id, voice.preview_url)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-[hsl(240,36%,4%)] mb-4">Custom Voice</h3>
              {customVoiceId ? (
                <div className="p-4 bg-white rounded-lg border-2 border-[hsl(135,17%,63%)]">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-[hsl(240,36%,4%)]">Your Custom Voice</h4>
                      <p className="text-sm text-[hsl(240,36%,4%,0.7)]">Trained with your voice samples</p>
                    </div>
                    <button
                      onClick={() => setCustomVoiceId('')}
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : showRecorder ? (
                <AudioRecorder setVoiceId={handleCustomVoiceCreated} />
              ) : (
                <button
                  onClick={() => setShowRecorder(true)}
                  className="w-full p-6 border-2 border-dashed border-[hsl(73,17%,74%)] rounded-lg 
                           hover:border-[hsl(33,70%,63%)] hover:bg-[hsl(33,70%,63%,0.05)] transition-all duration-200"
                >
                  <Mic className="mx-auto h-6 w-6 mb-2 text-[hsl(33,70%,63%)]" />
                  <p className="text-[hsl(240,36%,4%)]">Create Custom Voice</p>
                </button>
              )}
            </div>
          </div>
        </div>

        <audio 
          id="previewAudio" 
          onEnded={() => setIsPlaying('')}
          className="hidden"
        />
      </Modal>
    </>
  );
};

export default VoiceSettings;