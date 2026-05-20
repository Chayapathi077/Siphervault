import React, { useState } from 'react';
import { ArrowLeft, Key, Lock, Loader2 } from 'lucide-react';
import { FileMetadata } from '../types';
import { SharedFileAccessView } from './SharedFileAccessView';

interface RedeemLinkViewProps {
  onBack: () => void;
}

export const RedeemLinkView: React.FC<RedeemLinkViewProps> = ({ onBack }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sharedFile, setSharedFile] = useState<FileMetadata | null>(null);
  const [canDownload, setCanDownload] = useState(true);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/links/${code}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired code.');
      }
      
      setCanDownload(data.canDownload);
      setSharedFile({
        id: data.fileId,
        name: data.fileName,
        type: data.fileType,
        size: data.fileSize,
        ownerId: '',
        parentId: '',
        downloadUrl: data.downloadUrl,
        isStarred: false,
        isDeleted: false,
        isShared: true
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (file: FileMetadata) => {
    if (!canDownload) {
      alert("The sender disabled downloading for this file.");
      return;
    }
    const link = document.createElement("a");
    link.href = file.downloadUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (sharedFile) {
    return (
      <SharedFileAccessView 
        file={sharedFile} 
        onBack={() => setSharedFile(null)} 
        onDownload={handleDownload} 
      />
    );
  }

  return (
    <div className="max-w-[700px] w-full mx-auto h-full flex flex-col justify-center px-4">
      <div className="flex items-center gap-3 mb-8 shrink-0">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer transition-colors bg-transparent border-none text-[14px] font-bold p-0 drop-shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-0"></div>
        
        <div className="w-16 h-16 bg-[#00e5ff]/20 border border-[#00e5ff]/30 rounded-2xl flex items-center justify-center mb-6 relative z-10 mx-auto shadow-[0_0_15px_rgba(0,229,255,0.3)]">
          <Key className="w-8 h-8 text-[#00e5ff]" />
        </div>
        
        <h1 className="text-3xl font-black text-white text-center mb-3 drop-shadow-md relative z-10">
          Access Shared File
        </h1>
        <p className="text-white/70 text-center mb-8 font-medium">
          Enter the secure 6-character code provided by the sender.
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-100 p-4 rounded-xl mb-6 text-sm font-bold relative z-10 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRedeem} className="relative z-10 space-y-6">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 1a2b3c"
              className="w-full bg-black/20 border border-white/20 rounded-xl px-5 py-4 text-white text-center text-xl font-mono tracking-widest placeholder-white/30 focus:outline-none focus:border-[#00e5ff]/50 focus:bg-black/30 transition-all uppercase"
              maxLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-4 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl text-lg font-bold flex items-center justify-center gap-3 hover:bg-white/30 transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Lock className="w-5 h-5 shadow-sm" /> Unlock File</>}
          </button>
        </form>
      </div>
    </div>
  );
};
