import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { auth, loginWithGoogle } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, updateProfile, sendPasswordResetEmail } from 'firebase/auth';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isForgotPassword) {
      if (!email) {
        setError('Please enter your email address to reset your password.');
        return;
      }
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Please check your inbox.');
      } catch (err: any) {
        setError(err.message || 'Error sending password reset email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password || (isSignUp && !name)) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await sendEmailVerification(userCredential.user);
        // App.tsx will now catch the unverified state and show the VerifyEmailScreen
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // App.tsx handles email verified check
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>
      
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl p-10 sm:p-12 w-full max-w-[440px] relative z-10 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-0"></div>
        <div className="relative z-10 text-center mb-10">
          <div className="w-14 h-14 bg-white/10 border border-white/20 shadow-inner rounded-2xl flex items-center justify-center text-white mb-6 mx-auto">
            <Lock size={28} className="drop-shadow-md" />
          </div>
          <div className="text-[32px] font-black text-white drop-shadow-md tracking-tight">Siphervault</div>
          <p className="text-[15px] font-medium text-white/80 mt-2">
            {isForgotPassword ? 'Reset your password' : isSignUp ? 'Create your account to get started' : 'Welcome back! Please login to your account'}
          </p>
        </div>

        <div className="relative z-10">
          {error && (
            <div className="bg-red-500/10 text-red-300 p-4 rounded-xl text-[14px] font-medium mb-6 text-center border border-red-500/30 backdrop-blur-sm shadow-sm">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-500/10 text-green-300 p-4 rounded-xl text-[14px] font-medium mb-6 text-center border border-green-500/30 backdrop-blur-sm shadow-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isSignUp && !isForgotPassword && (
              <div className="mb-5 text-left">
                <label className="block text-[14px] font-bold text-white mb-2 drop-shadow-sm">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Enter your full name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-[14px_16px] border border-white/20 rounded-xl text-[15px] bg-black/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-black/30 transition-all shadow-inner" 
                />
              </div>
            )}

            <div className="mb-5 text-left">
              <label className="block text-[14px] font-bold text-white mb-2 drop-shadow-sm">Email Address</label>
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-[14px_16px] border border-white/20 rounded-xl text-[15px] bg-black/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-black/30 transition-all shadow-inner" 
              />
            </div>

            {!isForgotPassword && (
              <>
                <div className="mb-5 text-left">
                  <label className="block text-[14px] font-bold text-white mb-2 drop-shadow-sm">Password</label>
                  <input 
                    type="password" 
                    placeholder={isSignUp ? "Create a password" : "Enter your password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-[14px_16px] border border-white/20 rounded-xl text-[15px] bg-black/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-black/30 transition-all shadow-inner" 
                  />
                </div>

                {!isSignUp && (
                  <div className="text-right mb-6">
                    <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); setMessage(''); }} className="text-[13px] font-medium text-white/70 hover:text-white bg-transparent border-none cursor-pointer transition-colors">Forgot Password?</button>
                  </div>
                )}
              </>
            )}

            <button disabled={loading} type="submit" className="w-full p-4 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl text-[16px] font-bold cursor-pointer hover:bg-white/30 transition-all duration-200 active:scale-95 disabled:opacity-50 my-2">
              {loading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Sign Up' : 'Login')}
            </button>

            {isSignUp && !isForgotPassword && (
               <p className="text-[12px] font-medium text-white/60 text-center mt-5 leading-relaxed">
                 By signing up, you agree to our <a href="#" className="flex-1 text-white hover:underline drop-shadow-md">Terms of Service</a> and <a href="#" className="text-white hover:underline drop-shadow-md">Privacy Policy</a>
               </p>
            )}
            
            {isForgotPassword && (
              <div className="text-center mt-5 text-[14px] font-medium text-white/70">
                Remember your password? <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); setMessage(''); }} className="ml-1 text-white font-bold hover:underline bg-transparent border-none cursor-pointer">Login</button>
              </div>
            )}

            {!isForgotPassword && (
              <>
                <div className="flex items-center my-8 text-[13px] font-bold text-white/50">
                  <div className="flex-1 h-[1px] bg-white/20"></div>
                  <span className="px-4 tracking-wider">OR</span>
                  <div className="flex-1 h-[1px] bg-white/20"></div>
                </div>

                <button onClick={loginWithGoogle} type="button" className="w-full p-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl text-[15px] font-bold cursor-pointer flex items-center justify-center gap-3 hover:bg-white/20 transition-all duration-200 active:scale-95">
                  <svg width="22" height="22" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>

                </svg>
                Continue with Google
              </button>
            </>
          )}
        </form>

        {!isForgotPassword && (
          <div className="text-center mt-7 text-[14px] text-white/70">
            {isSignUp ? (
              <>Already have an account? <button onClick={() => { setIsSignUp(false); setError(''); }} className="ml-1 text-white font-bold hover:underline bg-transparent border-none cursor-pointer">Login</button></>
            ) : (
              <>Don't have an account? <button onClick={() => { setIsSignUp(true); setError(''); }} className="ml-1 text-white font-bold hover:underline bg-transparent border-none cursor-pointer">Sign Up</button></>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

