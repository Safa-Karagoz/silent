import React, { useState, useEffect } from 'react';
import { Mic, Volume2, VolumeX, X, ChevronLeft, ChevronRight, Trash2, RefreshCw } from 'lucide-react';
import MediaUploader from './MediaUploader';
import { useVoice } from './VoiceContext';

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

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
   if (!isOpen) return null;

   return (
      <>
         <div
            className="fixed inset-0 bg-[hsl(240,36%,4%,0.7)] backdrop-blur-sm z-50"
            onClick={onClose}
         />
         <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[85vh] max-w-2xl bg-[hsl(240,60%,99%)] rounded-xl shadow-xl p-6 z-50 overflow-auto">
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
        p-4 rounded-lg cursor-pointer transition-all duration-200 bg-secondary
        ${isSelected
               ? 'bg-[hsl(33,70%,63%,0.1)] border-2 border-[hsl(33,70%,63%)]'
               : 'bg-[hsl(240,60%,99%)] border-2 border-transparent hover:border-[hsl(33,70%,63%)]'}
      `}
      >
         <div className="flex justify-between items-center ">
            <div>
               <h4 className="font-medium text-[hsl(240,36%,4%)]">{voice.name}</h4>
               <p className="text-sm text-[hsl(240,36%,4%,0.7)] capitalize">{voice.gender}</p>
            </div>
            {voice.preview_url && (
               <button
                  onClick={(e) => {
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
            )}
         </div>
      </div>
   );
};

const VoiceSettings: React.FC = () => {
   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
   const [voices, setVoices] = useState<Voice[]>([]);
   const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
   const [isPlaying, setIsPlaying] = useState<string>('');
   const [customVoiceId, setCustomVoiceId] = useState<string | null>(null);
   const [showRecorder, setShowRecorder] = useState<boolean>(false);
   const [currentPage, setCurrentPage] = useState<number>(1);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [error, setError] = useState<string>('');

   const { updateVoice } = useVoice();

   const VOICES_PER_PAGE = 4;

   useEffect(() => {
      const fetchSavedVoiceSettings = async () => {
         try {
            const response = await fetch('/api/user/voice-settings');
            if (!response.ok) throw new Error('Failed to fetch voice settings');

            const data = await response.json();
            if (data.voiceId && data.voiceName) {
               setSelectedVoice({
                  id: data.voiceId,
                  name: data.voiceName,
                  gender: 'unknown' as 'male' | 'female',
                  preview_url: ''
               });
            }
            if (data.customVoiceId) {
               setCustomVoiceId(data.customVoiceId);
            }
         } catch (error) {
            console.error('Error fetching saved voice settings:', error);
         }
      };

      fetchSavedVoiceSettings();
   }, []);

   useEffect(() => {
      const fetchVoices = async () => {
         try {
            setIsLoading(true);
            const response = await fetch('/api/elevenlabs/fetch-available-voices');

            if (!response.ok) {
               throw new Error(`Failed to fetch voices: ${response.status}`);
            }

            const data = await response.json();
            const voicesArray = data?.voices || data?.data?.voices || data;

            if (!voicesArray || !Array.isArray(voicesArray)) {
               throw new Error('Invalid API response format');
            }

            const formattedVoices: Voice[] = voicesArray.map((voice: any) => ({
               id: voice?.voice_id || `invalid-${Math.random()}`,
               name: voice?.name || 'Unnamed Voice',
               gender: ((voice?.labels?.gender?.toLowerCase() || 'unknown') as 'male' | 'female'),
               preview_url: voice?.preview_url || ''
            }));

            setVoices(formattedVoices);

            if (selectedVoice) {
               const completeVoice = formattedVoices.find(v => v.id === selectedVoice.id);
               if (completeVoice) {
                  setSelectedVoice(completeVoice);
               }
            }
         } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load voices';
            setError(`Error: ${errorMessage}`);
         } finally {
            setIsLoading(false);
         }
      };

      fetchVoices();
   }, []);

   const handleVoiceSelect = async (voice: Voice) => {
      try {
        const response = await fetch('/api/user/voice-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voiceId: voice.id,
            voiceName: voice.name
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to save voice settings');
        }
  
        setSelectedVoice(voice);
        updateVoice(voice.name, voice.id); // Update both name and ID in the context
      } catch (error) {
        console.error('Error saving voice settings:', error);
        setError('Failed to save voice settings');
      }
    };

    const handleCustomVoiceUploadSuccess = async (voiceId: string) => {
      setCustomVoiceId(voiceId);
      const customVoice: Voice = {
        id: voiceId,
        name: `Custom Voice (${voiceId.slice(0, 6)}...)`, // Create a readable name with truncated ID
        gender: 'unknown' as 'male' | 'female',
        preview_url: ''
      };
      await handleVoiceSelect(customVoice);
      setShowRecorder(false);
    };

   const handleRemoveCustomVoice = async () => {
      try {
         const response = await fetch('/api/user/voice-settings', {
            method: 'DELETE'
         });

         if (!response.ok) {
            throw new Error('Failed to remove custom voice');
         }

         setCustomVoiceId(null);
         if (selectedVoice?.id === customVoiceId) {
            setSelectedVoice(null);
         }
      } catch (error) {
         console.error('Error removing custom voice:', error);
         setError('Failed to remove custom voice');
      }
   };

   const handlePlayPreview = (voiceId: string, previewUrl: string) => {
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

   const totalPages = Math.ceil(voices.length / VOICES_PER_PAGE);
   const paginatedVoices = voices.slice(
      (currentPage - 1) * VOICES_PER_PAGE,
      currentPage * VOICES_PER_PAGE
   );

   const CurrentVoiceDisplay: React.FC = () => (
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-[hsl(240,60%,99%)] rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
      >
        <div className="p-6 border-2 border-transparent hover:border-[hsl(33,70%,63%)] rounded-lg transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[hsl(33,70%,63%,0.1)] rounded-full">
              <Mic className="h-6 w-6 text-[hsl(33,70%,63%)]" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-[hsl(240,36%,4%)]">Voice Model</h3>
              <p className="text-[hsl(240,36%,4%,0.7)]">
                {isLoading ? (
                  <span className="inline-block animate-pulse">Loading voice settings...</span>
                ) : selectedVoice ? (
                  <>Currently using: <span className="font-bold italic text-black">{selectedVoice.name}</span></>
                ) : (
                  <span className="text-[hsl(33,70%,63%)]">Please select a voice model</span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-[hsl(33,45%,49%)] group">
            <span>Customize voice settings</span>
            <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
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
                     <h3 className="text-lg font-bold text-[hsl(240,36%,4%)] mb-4">Default Voices</h3>
                     {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                           <RefreshCw className="w-8 h-8 text-[hsl(33,70%,63%)] animate-spin" />
                        </div>
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

                        {totalPages > 1 && (
                           <div className="flex justify-center items-center space-x-4 mt-6">
                              <button
                                 onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                 disabled={currentPage === 1}
                                 className="p-2 rounded-full hover:bg-[hsl(73,17%,74%,0.2)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                 <ChevronLeft className="h-5 w-5 text-[hsl(240,36%,4%)]" />
                              </button>
                              <span className="text-sm text-[hsl(240,36%,4%)]">
                                 Page {currentPage} of {totalPages}
                              </span>
                              <button
                                 onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                 disabled={currentPage === totalPages}
                                 className="p-2 rounded-full hover:bg-[hsl(73,17%,74%,0.2)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                 <ChevronRight className="h-5 w-5 text-[hsl(240,36%,4%)]" />
                              </button>
                           </div>
                        )}
                     </>
             )}
                  </div>

                  <div>
                     <h3 className="text-lg font-bold text-[hsl(240,36%,4%)] mb-4">Custom Voice</h3>
                     {customVoiceId ? (
                        <div className="p-4 bg-secondary rounded-lg border-2 border-secondary">
                           <div className="flex justify-between items-center">
                              <div>
                                 <h4 className="font-medium text-[hsl(240,36%,4%)]">Your Custom Voice</h4>
                                 <p className="text-sm text-[hsl(240,36%,4%,0.7)]">Voice ID: {customVoiceId}</p>
                              </div>
                              <div className="flex gap-2">
                                 <button
                                    onClick={() => handleVoiceSelect({
                                       id: customVoiceId,
                                       name: 'Custom Voice',
                                       gender: 'unknown' as 'male' | 'female',
                                       preview_url: ''
                                    })}
                                    className={`px-3 py-1 rounded-md transition-colors ${selectedVoice?.id === customVoiceId
                                          ? 'bg-[hsl(33,70%,63%)] text-white'
                                          : 'hover:bg-[hsl(33,70%,63%,0.1)] text-[hsl(33,70%,63%)]'
                                       }`}
                                 >
                                    {selectedVoice?.id === customVoiceId ? 'Selected' : 'Use Voice'}
                                 </button>
                                 <button
                                    onClick={handleRemoveCustomVoice}
                                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                           </div>
                        </div>
                     ) : showRecorder ? (
                        <MediaUploader
                           setVoiceId={(voiceId: string) => {
                              handleVoiceSelect({
                                 id: voiceId,
                                 name: 'Custom Voice',
                                 gender: 'unknown' as 'male' | 'female',
                                 preview_url: ''
                              });
                           }}
                           onUploadSuccess={handleCustomVoiceUploadSuccess}
                        />
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

