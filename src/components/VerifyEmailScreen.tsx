import React, { useState } from 'react';
import { Mail, ArrowRight, RefreshCw, LogOut } from 'lucide-react';
import { auth, logout } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';

export const VerifyEmailScreen: React.FC<{ onVerified?: () => void }> = ({ onVerified }) => {
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const handleResend = async () => {
    if (!auth.currentUser) return;
    setIsSending(true);
    setMessage('');
    setError('');
    
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage('Verification link sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification link. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    if (!auth.currentUser) return;
    setIsChecking(true);
    setError('');
    setMessage('');
    
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        if (onVerified) onVerified();
        else window.location.reload();
      } else {
        setError('Your email has not been verified yet. Please check your inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check verification status.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(184,0,142,0.15),rgba(255,255,255,0))] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0"></div>
      
      <div className="w-full max-w-[440px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative z-10 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-tl from-white/5 to-transparent pointer-events-none z-0"></div>
        
        <div className="w-20 h-20 bg-[#b8008e]/20 text-[#ffb3f0] border border-[#b8008e]/30 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner relative z-10">
          <Mail className="w-10 h-10 drop-shadow-md" />
        </div>
        
        <h1 className="text-[26px] font-black text-center text-white mb-4 drop-shadow-md relative z-10">
          Verify your email
        </h1>
        
        <p className="text-white/70 text-center text-[15px] mb-8 leading-relaxed font-medium relative z-10">
          We've sent a verification link to <span className="font-bold text-white drop-shadow-sm">{auth.currentUser?.email}</span>. 
          Please click the link to activate your account and securely store your files.
        </p>

        {message && (
          <div className="bg-green-500/10 text-green-300 p-4 rounded-xl text-[14px] font-medium mb-6 text-center border border-green-500/30 relative z-10 shadow-sm backdrop-blur-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 text-red-300 p-4 rounded-xl text-[14px] font-medium mb-6 text-center border border-red-500/30 relative z-10 shadow-sm backdrop-blur-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 relative z-10">
          <button 
            onClick={handleRefresh}
            disabled={isChecking}
            className="w-full py-4 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl font-bold cursor-pointer hover:bg-white/30 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 text-[16px]"
          >
            {isChecking ? <RefreshCw className="w-5 h-5 animate-spin shadow-sm" /> : null}
            {isChecking ? 'Checking...' : "I've verified my email"} {!isChecking && <ArrowRight className="w-5 h-5 shadow-sm" />}
          </button>
          
          <button 
            onClick={handleResend}
            disabled={isSending}
            className="w-full py-4 bg-white/10 backdrop-blur-md text-white rounded-xl font-bold cursor-pointer border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 text-[15px]"
          >
            <RefreshCw className={`w-5 h-5 ${isSending ? 'animate-spin' : ''}`} />
            {isSending ? 'Sending...' : 'Resend verification link'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center relative z-10">
          <button 
            onClick={logout}
            className="text-[14px] text-white/50 font-bold hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto bg-transparent border-none cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Use a different account
          </button>
        </div>
      </div>
    </div>
  );
};
