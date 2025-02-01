import React, { useState, useEffect } from 'react';
import { Mic, Volume2, VolumeX, X, ChevronLeft, ChevronRight } from 'lucide-react';
import MediaUploader from './MediaUploader';

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

// Modal Component remains the same
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

// Voice Preview Card Component remains the same
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
          ? 'bg-[hsl(33,70%,63%,0.1)] border-2 border-primary' 
          : 'bg-background border-2 border-transparent hover:border-primary'}
      `}
    >
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium text-text">{voice.name}</h4>
          <p className="text-sm text-text capitalize">{voice.gender}</p>
        </div>
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onPlayToggle();
          }}
          className="p-2 hover:bg-[hsl(73,17%,74%,0.2)] rounded-full transition-colors"
        >
          {isPlaying 
            ? <VolumeX className="h-5 w-5 text-text" /> 
            : <Volume2 className="h-5 w-5 " />
          }
        </button>
      </div>
    </div>
  );
};

const VoiceSettings: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [isPlaying, setIsPlaying] = useState<string>('');
  const [customVoiceId, setCustomVoiceId] = useState<string>('');
  const [showRecorder, setShowRecorder] = useState<boolean>(false);

  // TODO --> Save voice to db for this user (voice selected)   
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const VOICES_PER_PAGE = 4;

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/elevenlabs/fetch-available-voices');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch voices: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Log the response to help debug
        console.log('API Response:', data);
        
        // Handle different possible response structures
        const voicesArray = data?.voices || data?.data?.voices || data;
        
        if (!voicesArray || !Array.isArray(voicesArray)) {
          console.error('Unexpected API response structure:', data);
          throw new Error('Invalid API response format');
        }
        
        const formattedVoices: Voice[] = voicesArray.map((voice: any) => {
          // Validate required fields
          if (!voice?.voice_id || !voice?.name) {
            console.warn('Voice missing required fields:', voice);
          }
          
          return {
            id: voice?.voice_id || `invalid-${Math.random()}`,
            name: voice?.name || 'Unnamed Voice',
            gender: ((voice?.labels?.gender?.toLowerCase() || 'unknown') as 'male' | 'female'),
            preview_url: voice?.preview_url || ''
          };
        });
        
        if (formattedVoices.length === 0) {
          throw new Error('No valid voices found in response');
        }
        
        setVoices(formattedVoices);
        
        // Only set selected voice if none is currently selected
        if (!selectedVoice && formattedVoices.length > 0) {
          setSelectedVoice(formattedVoices[0]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load voices';
        setError(`Error: ${errorMessage}. Please try again later.`);
        console.error('Error fetching voices:', err);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchVoices();
  }, [selectedVoice]);
  
  const totalPages = Math.ceil(voices.length / VOICES_PER_PAGE);
  const paginatedVoices = voices.slice(
    (currentPage - 1) * VOICES_PER_PAGE,
    currentPage * VOICES_PER_PAGE
  );

  const handleVoiceSelect = (voice: Voice): void => {
    setSelectedVoice(voice);
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
      className="bg-white rounded-lg shadow-md hover:shadow-sm transition-shadow duration-200 cursor-pointer bg-[hsl(33,70%,63%,0.1)]"
    >
      <div className="p-6 border-2 border-transparent hover:border-[hsl(33,70%,63%)] rounded-lg transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[hsl(33,70%,63%,0.1)] rounded-full">
            <Mic className="h-6 w-6 text-[hsl(33,70%,63%)]" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-[hsl(240,36%,4%)]">Voice Model</h3>
            <p className="text-[hsl(240,36%,4%,0.7)]">
              Currently using: <span className="font-medium">{selectedVoice?.name ?? "Loading..."}</span>
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
            <p className="text-text">Choose a voice model or create your own</p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-[hsl(240,36%,4%)] mb-4">Available Voices</h3>
              {isLoading ? (
                <div className="text-center py-8">Loading voices...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paginatedVoices.map((voice) => (
                      <VoicePreviewCard 
                        key={voice.id}
                        voice={voice}
                        isSelected={selectedVoice?.id === voice.id}
                        onSelect={() => handleVoiceSelect(voice)}
                        isPlaying={isPlaying === voice.id}
                        onPlayToggle={() => handlePlayPreview(voice.id, voice.preview_url)}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex justify-center items-center space-x-4 mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-full hover:bg-[hsl(73,17%,74%,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-full hover:bg-[hsl(73,17%,74%,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </>
              )}
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
                <MediaUploader setVoiceId={handleCustomVoiceCreated} />
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