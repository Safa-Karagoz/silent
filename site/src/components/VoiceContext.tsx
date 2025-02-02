import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface VoiceContextType {
  currentVoiceName: string;
  currentVoiceId: string;
  updateVoice: (voiceName: string, voiceId: string) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const [currentVoiceName, setCurrentVoiceName] = useState<string>(session?.user?.voiceName || 'Sarah');
  const [currentVoiceId, setCurrentVoiceId] = useState<string>(session?.user?.voiceId || 'default');

  useEffect(() => {
    if (session?.user?.voiceName && session?.user?.voiceId) {
      setCurrentVoiceName(session.user.voiceName);
      setCurrentVoiceId(session.user.voiceId);
    }
  }, [session?.user?.voiceName, session?.user?.voiceId]);

  const updateVoice = (voiceName: string, voiceId: string) => {
    setCurrentVoiceName(voiceName);
    setCurrentVoiceId(voiceId);
  };

  return (
    <VoiceContext.Provider value={{ currentVoiceName, currentVoiceId, updateVoice }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};