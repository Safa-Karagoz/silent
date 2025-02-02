import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface VoiceContextType {
  currentVoice: string;
  updateVoice: (voiceName: string) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const [currentVoice, setCurrentVoice] = useState<string>(session?.user?.voiceName || 'Sarah');

  useEffect(() => {
    if (session?.user?.voiceName) {
      setCurrentVoice(session.user.voiceName);
    }
  }, [session?.user?.voiceName]);

  const updateVoice = (voiceName: string) => {
    setCurrentVoice(voiceName);
  };

  return (
    <VoiceContext.Provider value={{ currentVoice, updateVoice }}>
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