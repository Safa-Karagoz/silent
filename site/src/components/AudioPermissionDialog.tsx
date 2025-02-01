import React from 'react';

interface AudioPermissionDialogProps {
  onAllow: () => void;
  onDeny: () => void;
}

const AudioPermissionDialog: React.FC<AudioPermissionDialogProps> = ({ onAllow, onDeny }) => {
  
  
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50" />
      
      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
        <div className="bg-background border border-accent/50 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-text mb-4">Enable Voice Responses?</h2>
          
          <p className="text-text mb-6">
            Would you like to enable voice responses from your companion? 
            This will allow them to speak their messages to you.
          </p>
          
          <div className="flex justify-end gap-4">
            <button
              onClick={onDeny}
              className="px-4 py-2 text-text hover:bg-primary rounded-lg transition-colors"
            >
              No Thanks
            </button>
            <button
              onClick={onAllow}
              className="px-4 py-2 bg-accent text-text hover:bg-secondary rounded-lg transition-colors"
            >
              Enable Voice
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AudioPermissionDialog;