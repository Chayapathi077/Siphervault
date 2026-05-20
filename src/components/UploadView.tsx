import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Menu } from 'lucide-react';

interface UploadViewProps {
  onUpload: (files: File[]) => Promise<boolean | void> | void;
  isUploading: boolean;
  onMenuClick?: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onUpload, isUploading, onMenuClick }) => {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => setPendingFiles(prev => [...prev, ...acceptedFiles]),
  } as any);

  const handleUploadClick = async () => {
    const success = await onUpload(pendingFiles);
    if (success !== false) {
      setPendingFiles([]);
    }
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-[12px] bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 cursor-pointer outline-none transition-all duration-200 active:scale-95 shrink-0 flex items-center justify-center shadow-sm"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-[20px] font-semibold text-white drop-shadow-md">Upload Files</h2>
      </div>

      <div className="max-w-[800px]">
        <div 
          {...getRootProps()}
          className="bg-white/5 backdrop-blur-xl border-2 border-dashed border-white/30 rounded-xl p-[30px_20px] sm:p-[60px_40px] text-center mb-8 transition-all cursor-pointer hover:border-white/60 hover:bg-white/10 shadow-xl group"
        >
          <input {...getInputProps()} />
          <div className="text-[48px] mb-4 group-hover:scale-110 transition-transform">☁️</div>
          <div className="text-[18px] font-semibold mb-2 text-white drop-shadow-sm">Drag and drop files here</div>
          <div className="text-[14px] text-white/70 mb-6">or click to select files from your computer</div>
          <button className="px-8 py-3 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl text-[15px] font-bold cursor-pointer hover:bg-white/30 transition-all duration-200 active:scale-95">
            Select Files
          </button>
        </div>

        {pendingFiles.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-xl relative overflow-hidden">
            <h3 className="text-[16px] font-bold mb-4 text-white relative z-10">Files to Upload ({pendingFiles.length})</h3>
            
            <div className="relative z-10">
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center p-4 bg-white/5 backdrop-blur-sm rounded-xl mb-3 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-[20px] mr-4 border border-white/20 shadow-sm">
                    📄
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold mb-1 text-white">{f.name}</div>
                    <div className="text-[13px] text-white/60">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button onClick={() => removeFile(i)} className="bg-white/10 hover:bg-red-500/30 border border-transparent hover:border-red-500/40 text-white/70 hover:text-white transition-all duration-200 cursor-pointer text-[24px] px-3 py-1 rounded-lg active:scale-90">
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 relative z-10">
              <button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className="flex-[2] p-[14px] bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl text-[15px] font-bold disabled:opacity-50 cursor-pointer transition-all duration-200 hover:bg-white/30 active:scale-95"
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </button>
              <button 
                onClick={() => setPendingFiles([])}
                disabled={isUploading}
                className="flex-1 p-[14px] bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl text-[15px] font-bold hover:bg-white/20 disabled:opacity-50 cursor-pointer transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
