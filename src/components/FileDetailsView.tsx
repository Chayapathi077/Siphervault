import React from 'react';
import { FileMetadata } from '../types';
import { 
  ArrowLeft, Download, Link as LinkIcon, Share2, Trash2, 
  Copy, Package, Calendar, FileText, File, Image as ImageIcon,
  Menu
} from 'lucide-react';

interface FileDetailsViewProps {
  file: FileMetadata;
  onBack: () => void;
  onDownload: (file: FileMetadata) => void;
  onDelete: (id: string) => void;
  onGenerateShareLink: () => void;
  onMenuClick?: () => void;
}

export const FileDetailsView: React.FC<FileDetailsViewProps> = ({ file, onBack, onDownload, onDelete, onGenerateShareLink, onMenuClick }) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isImage = file.type.toLowerCase().includes('image') || file.downloadUrl?.startsWith('data:image');

  const getIcon = () => {
    const type = file.type.toLowerCase();
    if (isImage) return <ImageIcon className="w-8 h-8 text-white/50 drop-shadow-md" />;
    return <File className="w-8 h-8 text-white/50 drop-shadow-md" />;
  };

  const dateStr = file.createdAt ? new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date';

  return (
    <div className="max-w-[1000px] w-full mx-auto h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 cursor-pointer outline-none transition-all duration-200 active:scale-95 shrink-0 flex items-center justify-center shadow-sm"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer transition-colors bg-transparent border-none text-[14px] font-bold p-0 drop-shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 flex-1 min-h-0 flex flex-col sm:flex-row gap-8 shadow-2xl relative overflow-hidden group/container">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-0"></div>
        {/* Left Column: Visual & Basic Info */}
        <div className="w-full sm:w-[320px] shrink-0 flex flex-col h-full overflow-y-auto relative z-10">
          <div className="w-full aspect-square bg-black/20 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden mb-6 shrink-0 shadow-inner group">
            {isImage && file.downloadUrl ? (
              <img src={file.downloadUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              getIcon()
            )}
          </div>
          
          <h1 className="text-[22px] font-black mb-3 text-white truncate drop-shadow-md" title={file.name}>
            {file.name}
          </h1>
          
          <div className="flex flex-col gap-3 text-[14px] text-white/70 mb-6 shrink-0 font-medium">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-lg shadow-sm">
              <Package className="w-5 h-5 text-white/50" />
              <span>{formatSize(file.size)}</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-lg shadow-sm">
              <Calendar className="w-5 h-5 text-white/50" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-lg shadow-sm">
              <FileText className="w-5 h-5 text-white/50" />
              <span className="truncate">{file.type || 'Unknown'}</span>
            </div>
          </div>
          
          <div className="mt-auto shrink-0 flex flex-col gap-3">
            <button onClick={() => onDownload(file)} className="w-full flex items-center justify-center gap-2 p-3.5 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl text-[15px] font-bold cursor-pointer hover:bg-white/30 transition-all duration-200 active:scale-95">
              <Download className="w-5 h-5 shadow-sm" /> Download
            </button>
            <button onClick={() => { onDelete(file.id); onBack(); }} className="w-full flex items-center justify-center gap-2 p-3.5 bg-red-500/10 backdrop-blur-md text-red-300 border border-red-500/30 rounded-xl text-[15px] font-bold cursor-pointer hover:bg-red-500/20 transition-all duration-200 active:scale-95">
              <Trash2 className="w-5 h-5 shadow-sm" /> Delete File
            </button>
          </div>
        </div>

        {/* Right Column: Actions & Details */}
        <div className="flex-1 flex flex-col pt-6 sm:pt-0 sm:pl-8 h-full overflow-y-auto relative z-10 border-t sm:border-t-0 sm:border-l border-white/10">
          <h3 className="text-[18px] font-bold text-white mb-5 drop-shadow-md">Sharing</h3>

          <div className="flex flex-col gap-4 mb-8 flex-1">
            <button onClick={onGenerateShareLink} className="flex flex-col items-center justify-center p-8 bg-[#00e5ff]/10 backdrop-blur-md border border-[#00e5ff]/30 text-white rounded-2xl cursor-pointer hover:bg-[#00e5ff]/20 hover:border-[#00e5ff]/50 transition-all duration-300 active:scale-[0.98] group">
              <div className="w-16 h-16 bg-[#00e5ff]/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <LinkIcon className="w-8 h-8 text-[#00e5ff] shadow-sm" />
              </div>
              <span className="text-[18px] font-black mb-2 tracking-wide">Generate Secure Share Code</span>
              <span className="text-[14px] text-white/70 text-center font-medium max-w-[250px]">Create a secure time-limited code to share this file with others.</span>
            </button>
          </div>

          <h3 className="text-[18px] font-bold text-white mb-4 mt-auto drop-shadow-md">Details</h3>
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 text-[14px] border border-white/10 shadow-sm">
            <div className="flex justify-between py-3 border-b border-white/10 last:border-0 last:pb-0">
              <span className="text-white/60 font-medium">Owner</span>
              <span className="font-bold text-white">You</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-white/60 font-medium">Created</span>
              <span className="font-bold text-white">{dateStr}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-white/60 font-medium">Type</span>
              <span className="font-bold text-white truncate max-w-[160px] text-right">{file.type}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
