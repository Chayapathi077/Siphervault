import React from 'react';
import { Download, FileText, Package, Calendar } from 'lucide-react';
import { FileMetadata } from '../types';

interface SharedFileAccessViewProps {
  file: FileMetadata;
  onBack: () => void;
  onDownload: (file: FileMetadata) => void;
}

export const SharedFileAccessView: React.FC<SharedFileAccessViewProps> = ({ file, onBack, onDownload }) => {
  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = file.type?.startsWith('image/');
  const dateStr = file.createdAt ? new Date(file.createdAt).toLocaleDateString('en-US') : 'Unknown date';

  return (
    <div className="max-w-[800px] w-full mx-auto h-full flex flex-col items-center justify-center p-4">
      <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 sm:p-12 shadow-2xl flex flex-col items-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-tl from-white/5 to-transparent pointer-events-none z-0"></div>
        
        <div className="w-[140px] h-[140px] bg-black/20 border border-white/10 rounded-3xl flex items-center justify-center overflow-hidden mb-8 shadow-inner relative z-10">
          {isImage && file.downloadUrl ? (
            <img src={file.downloadUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <FileText className="w-16 h-16 text-white/50 drop-shadow-md" />
          )}
        </div>
        
        <h1 className="text-[26px] font-black text-white mb-6 text-center break-all drop-shadow-md relative z-10 leading-tight">
          {file.name}
        </h1>
        
        <div className="flex items-center gap-6 text-[15px] font-medium text-white/80 mb-10 bg-white/5 border border-white/10 py-4 px-8 rounded-2xl shadow-sm relative z-10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-white/50" />
            <span>{formatSize(file.size)}</span>
          </div>
          <div className="w-[1px] h-6 bg-white/20"></div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-white/50" />
            <span>{dateStr}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative z-10">
          <button 
            onClick={() => onDownload(file)}
            className="px-10 py-4 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-white/30 transition-all duration-200 cursor-pointer active:scale-95 text-[16px]"
          >
            <Download className="w-6 h-6 shadow-sm" /> Download File
          </button>
          
          <button 
            onClick={onBack}
            className="px-10 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-white/20 transition-all duration-200 cursor-pointer active:scale-95 text-[16px]"
          >
             Go to My App
          </button>
        </div>
      </div>
    </div>
  );
};
