import React from 'react';
import { FileMetadata } from '../types';
import { Download, Trash2, RotateCcw, File, Image as ImageIcon } from 'lucide-react';

interface FileCardProps {
  file: FileMetadata;
  onDelete: (id: string) => void;
  onDownload: (file: FileMetadata) => void;
  onViewDetails?: (file: FileMetadata) => void;
  isTrash?: boolean;
  onRestore?: (id: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onDelete, onDownload, onViewDetails, isTrash, onRestore }) => {
  const isImage = file.type.toLowerCase().includes('image') || file.downloadUrl?.startsWith('data:image');

  const getIcon = () => {
    if (isImage) return <ImageIcon className="w-12 h-12 text-white/50 group-hover:scale-110 transition-transform duration-300 drop-shadow-md" />;
    return <File className="w-12 h-12 text-white/50 group-hover:scale-110 transition-transform duration-300 drop-shadow-md" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const dateStr = file.createdAt ? new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now';

  return (
    <div 
      onClick={() => onViewDetails?.(file)}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:shadow-xl hover:bg-white/20 hover:scale-[1.02] transform transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-0"></div>
      
      <div className="aspect-[4/3] w-full bg-black/20 border-b border-white/10 flex items-center justify-center overflow-hidden relative z-10">
        {isImage && file.downloadUrl ? (
          <img src={file.downloadUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="opacity-80">{getIcon()}</div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-1 relative z-10">
        <div className="text-[14px] font-semibold mb-1 text-white truncate drop-shadow-sm" title={file.name}>
          {file.name}
        </div>
        
        <div className="text-[12px] text-white/60 mb-4 font-medium">
          {formatSize(file.size)} • {dateStr}
        </div>
        
        <div className="flex gap-2 mt-auto">
          {isTrash && onRestore ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onRestore(file.id); }}
              className="flex-1 flex justify-center items-center py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-200 active:scale-95"
              title="Restore"
            >
              <RotateCcw className="w-4 h-4 shadow-sm" />
            </button>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); onDownload(file); }}
              className="flex-[2] flex justify-center items-center py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-200 active:scale-95"
              title="Download"
            >
              <Download className="w-4 h-4 shadow-sm" />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
            className="flex-1 flex justify-center items-center py-2 border border-red-500/30 rounded-lg bg-red-500/10 backdrop-blur-md text-red-300 hover:bg-red-500/20 transition-all duration-200 active:scale-95"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 shadow-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};


