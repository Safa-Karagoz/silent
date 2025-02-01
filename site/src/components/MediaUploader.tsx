import React, { useState, useRef } from 'react';
import { FileUp, Trash, Upload, Loader } from 'lucide-react';

interface MediaUploaderProps {
  setVoiceId: (voiceId: string) => void;
}

interface MediaFile {
  url: string;
  file: File;
  duration: number;
}

const MediaUploader : React.FC<MediaUploaderProps> = ({ setVoiceId }) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MINIMUM_TOTAL_DURATION = 10; // Minimum total duration in seconds
  const MAXIMUM_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes
  const ALLOWED_TYPES = [
    'audio/wav',
    'audio/mpeg',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/ogg',
    'audio/webm',
    'video/mp4',
    'video/webm'
  ];

  const getMediaDuration = async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const element = file.type.startsWith('video/') 
        ? document.createElement('video')
        : document.createElement('audio');
      
      element.preload = 'metadata';
      
      element.onloadedmetadata = () => {
        window.URL.revokeObjectURL(element.src);
        resolve(element.duration);
      };

      element.onerror = () => {
        window.URL.revokeObjectURL(element.src);
        reject(new Error('Error loading media file'));
      };

      element.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    // Validate files
    for (const file of files) {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`File type ${file.type} is not supported. Please upload audio or video files.`);
        return;
      }

      // Check file size
      if (file.size > MAXIMUM_FILE_SIZE) {
        alert(`File ${file.name} is too large. Maximum size is 25MB.`);
        return;
      }
    }

    try {
      const newFiles: MediaFile[] = [];
      
      for (const file of files) {
        const duration = await getMediaDuration(file);
        const url = URL.createObjectURL(file);
        newFiles.push({ file, url, duration });
      }

      setMediaFiles(prev => {
        const updated = [...prev, ...newFiles].slice(0, 2); // Keep maximum 2 files
        const total = updated.reduce((sum, file) => sum + file.duration, 0);
        setTotalDuration(total);
        return updated;
      });
    } catch (error) {
      console.error('Error processing media file:', error);
      alert('Error processing media file. Please try another file.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (index: number) => {
    URL.revokeObjectURL(mediaFiles[index].url);
    setMediaFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      const total = newFiles.reduce((sum, file) => sum + file.duration, 0);
      setTotalDuration(total);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (totalDuration < MINIMUM_TOTAL_DURATION) {
      alert(`Total duration must be at least ${MINIMUM_TOTAL_DURATION} seconds. Current duration: ${totalDuration.toFixed(1)} seconds`);
      return;
    }

    setIsUploading(true);
    const form = new FormData();

    mediaFiles.forEach(({ file }, index) => {
      form.append('files', file);
    });

    try {
      const response = await fetch('/api/elevenlabs/upload-voice', {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      
      mediaFiles.forEach(file => URL.revokeObjectURL(file.url));
      setMediaFiles([]);
      setTotalDuration(0);
      setVoiceId(data.voice_id);

      alert('Media files uploaded successfully!');
    } catch (err) {
      console.error('Error uploading files:', err);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full rounded-lg">
      <div className="mb-6">
        <p className="text-sm text-text">
          Upload up to 2 audio or video files for voice cloning.
        </p>
        <p className="text-sm text-text">
          Files should contain clear speech with minimal background noise.
        </p>
        <p className="text-sm text-text mb-4">
          By uploading these files, you consent to the replication and use of the voice content for this product.
        </p>
        
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileSelect}
            disabled={mediaFiles.length >= 2 || isUploading}
            className="hidden"
            multiple
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={mediaFiles.length >= 2 || isUploading}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-secondary border hover:enabled:bg-primary hover:active:enabled:bg-secondary text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileUp size={16} />
            Select Files
          </button>
        </div>

        <div className="space-y-3">
          {mediaFiles.map(({ url, file }, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border border-secondary rounded-lg">
              {file.type.startsWith('video/') ? (
                <video 
                  src={url} 
                  controls 
                  className="flex-1 max-h-48" 
                  controlsList="nodownload"
                />
              ) : (
                <audio 
                  src={url} 
                  controls 
                  className="flex-1" 
                  controlsList="nodownload"
                />
              )}
              <button
                onClick={() => handleDelete(index)}
                className="p-2 text-red-500 hover:text-red-600 transition-colors"
                aria-label="Delete file"
                type="button"
              >
                <Trash size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleUpload}
        disabled={mediaFiles.length < 1 || totalDuration < MINIMUM_TOTAL_DURATION || isUploading}
        type="button"
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border-secondary border hover:enabled:bg-primary hover:active:enabled:bg-secondary text-text rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? (
          <>
            <Loader className="animate-spin" size={16} />
            Uploading...
          </>
        ) : (
          <>
            <Upload size={16} />
            Upload to ElevenLabs
          </>
        )}
      </button>

      <div className="mt-4 text-sm text-gray-500 text-center">
        {mediaFiles.length}/2 files saved
      </div>
    </div>
  );
};

export default MediaUploader;