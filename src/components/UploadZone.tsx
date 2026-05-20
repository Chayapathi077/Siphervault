import React, { useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  isUploading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload, isUploading }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => onUpload(acceptedFiles),
    disabled: isUploading
  } as any);

  return (
    <div
      {...getRootProps()}
      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-4
        ${isDragActive ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      
      <div className={`p-4 rounded-full transition-transform duration-300 ${isDragActive ? 'bg-accent text-white scale-110' : 'bg-slate-100 text-slate-400 group-hover:scale-105'}`}>
        <Upload size={32} />
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700">
          {isDragActive ? 'Drop your files here' : 'Click or drag files to upload'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Support for images, docs, and PDFs
        </p>
      </div>

      {isUploading && (
        <div className="absolute inset-x-8 bottom-4">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-full bg-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
};
