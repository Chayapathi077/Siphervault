import React, { useState } from 'react';
import { ArrowLeft, Copy, FileText, Shield, Menu, Package, Calendar } from 'lucide-react';
import { FileMetadata } from '../types';

interface SecureShareViewProps {
  file: FileMetadata;
  onBack: () => void;
  onMenuClick?: () => void;
}

export const SecureShareView: React.FC<SecureShareViewProps> = ({ file, onBack, onMenuClick }) => {
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewsAllowed, setViewsAllowed] = useState<number | ''>('');
  const [canDownload, setCanDownload] = useState(true);

  const handleGenerate = async () => {
    try {
      const res = await fetch(`/api/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId: file.id, 
          viewsAllowed: viewsAllowed === '' ? null : Number(viewsAllowed),
          canDownload 
        })
      });
      if (!res.ok) throw new Error('Failed to create link');
      const data = await res.json();
      
      setGeneratedLink(data.linkId);
      setCopied(false);
    } catch (error) {
      console.error('Failed to generate secure link:', error);
      alert('Failed to generate secure link.');
    }
  };

  const shareLink = generatedLink || `[Generate to see code]`;

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert("Failed to copy link. Please select and copy manually.");
    }
  };

  const formatSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const dateStr = file.createdAt ? new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date';
  const isImage = file.type?.startsWith('image/');

  return (
    <div className="max-w-[1000px] w-full mx-auto h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 cursor-pointer outline-none transition-all duration-200 active:scale-95 shadow-sm shrink-0 flex items-center justify-center"
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
        {/* Left Column: Visual Info & Form */}
        <div className="w-full sm:w-[320px] shrink-0 flex flex-col h-full overflow-y-auto relative z-10">
          <div className="w-full aspect-square bg-black/20 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden mb-6 shrink-0 shadow-inner group">
            {isImage && file.downloadUrl ? (
              <img src={file.downloadUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <FileText className="w-12 h-12 text-white/50 drop-shadow-md" />
            )}
          </div>
          
          <h1 className="text-[22px] font-black mb-3 text-white truncate drop-shadow-md" title={file.name}>
            {file.name}
          </h1>
          
          <div className="flex flex-col gap-3 text-[14px] text-white/70 mb-8 shrink-0 font-medium">
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
          
          <div className="mt-auto shrink-0 flex flex-col gap-2 bg-[#6b00bd]/20 border border-[#b8008e]/30 backdrop-blur-md rounded-xl p-5 shadow-sm relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-0"></div>
            <div className="flex items-center gap-2 text-[14px] font-bold text-white mb-3 relative z-10">
              <Shield className="w-5 h-5 text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" /> Secure Link
            </div>
            <p className="text-[13px] font-medium text-white/80 leading-relaxed mb-0 relative z-10">
              Generated links are encrypted and provide direct access to this file according to your selected security policies.
            </p>
          </div>
        </div>

        {/* Right Column: Settings & Generation */}
        <div className="flex-1 flex flex-col pt-6 sm:pt-0 sm:pl-8 h-full overflow-y-auto relative z-10 border-t sm:border-t-0 sm:border-l border-white/10">
          <h2 className="text-[22px] sm:text-[26px] font-black text-white mb-3 drop-shadow-md leading-tight">
            Share Configuration
          </h2>
          <p className="text-white/70 text-[14px] font-medium mb-8">
            Generate a secure code to share this file directly. The receiver must enter this code in the SipherVault application.
          </p>

          <div className="flex flex-col gap-4 mb-8">
            <div>
              <label className="block text-white text-[14px] font-bold mb-2">Max Views (leave blank for unlimited)</label>
              <input 
                type="number"
                min="1"
                value={viewsAllowed}
                onChange={(e) => setViewsAllowed(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/50"
                placeholder="e.g. 1"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <input 
                type="checkbox"
                id="canDownload"
                checked={canDownload}
                onChange={(e) => setCanDownload(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/20 accent-[#00e5ff]"
              />
              <label htmlFor="canDownload" className="text-white text-[14px] font-bold">Allow receiver to download file</label>
            </div>
          </div>

          <div className="mt-auto shrink-0 flex flex-col gap-4">
            {generatedLink && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 mb-2 shadow-inner">
                <div className="flex gap-3">
                  <div className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-[14px] font-mono text-white/90 truncate outline-none select-all shadow-inner">
                    {shareLink}
                  </div>
                  <button 
                    onClick={handleCopyLink}
                    className="px-4 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer shrink-0 shadow-sm"
                    title="Copy Link"
                  >
                    <Copy className="w-5 h-5 shadow-sm" />
                  </button>
                </div>
                {copied && <p className="text-[13px] font-bold text-[#00e5ff] mt-3 ml-1 drop-shadow-sm">Copied to clipboard!</p>}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleGenerate}
                className="flex-[2] px-6 py-4 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl text-[15px] font-bold cursor-pointer hover:bg-white/30 transition-all duration-200 whitespace-nowrap text-center active:scale-95"
              >
                {generatedLink ? 'Generate Another Link' : 'Generate Secure Link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
