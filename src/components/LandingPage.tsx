import React, { useState } from "react";
import { LogIn, UserPlus, Zap, Flame, Phone, Info, X, MessageCircle, Mail } from "lucide-react";
import { auth } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { motion } from "motion/react";

const Logo = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 40 40"
    fill="none"
    className="w-7 h-7 text-white"
  >
    <path d="M20 2 L36 10 V30 L20 38 L4 30 V10 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M20 10 L29 14.5 V25.5 L20 30 L11 25.5 V14.5 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M20 16 L24 18 V22 L20 24 L16 22 V18 Z" fill="currentColor" />
  </svg>
);

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (isRegistering: boolean) => {
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await sendEmailVerification(userCredential.user);
        setMessage("Account created! Please verify your email.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // App.tsx handles the actual routing by detecting auth state change
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotAccount = async () => {
    if (!email) {
      setError("Please enter your email to reset password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent");
    } catch (err: any) {
      setError(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6b00bd] via-[#b8008e] to-[#ec0058] flex flex-col font-sans">
      {/* Intro Text */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 2.8 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 translate-y-[50px] z-[100] flex flex-col items-center pointer-events-none"
      >
        <div className="flex text-white text-2xl font-bold tracking-tight mb-2">
          {"Spirit Services".split("").map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0px" }}
          animate={{ opacity: 1, letterSpacing: "0.5em" }}
          transition={{ duration: 2, delay: 0.4, ease: "easeOut" }}
          className="text-white/60 text-[11px] font-light uppercase ml-[0.5em]"
        >
          Presents
        </motion.div>
      </motion.div>

      {/* Header */}
      <div className="p-6 flex items-center justify-start gap-2 h-20 relative">
        <motion.div
          initial={{
            position: "fixed",
            top: "50%",
            left: "50%",
            x: "-50%",
            y: "-50%",
            scale: 2,
          }}
          animate={{ top: "20px", left: "24px", x: "0%", y: "0%", scale: 1 }}
          transition={{
            duration: 0.8,
            delay: 3.5,
            type: "spring",
            bounce: 0.2,
          }}
          style={{ zIndex: 100 }}
          className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 relative overflow-hidden"
        >
          {/* Flame Logo */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 2.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Flame
              className="w-[20px] h-[20px] text-[#00e5ff]"
              fill="currentColor"
            />
          </motion.div>
          {/* Main Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Logo />
          </motion.div>
        </motion.div>

        <div className="pl-14 flex h-full items-center">
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ duration: 0.5, delay: 4.2, ease: "easeOut" }}
            className="text-white text-2xl font-bold tracking-tight inline-flex whitespace-nowrap overflow-hidden"
          >
            {"Siphervault".split("").map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.05, delay: 4.2 + index * 0.05 }}
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 4.6, ease: "easeOut" }}
        className="flex-1 flex items-center justify-center p-4"
      >
        {/* The "Bar" - made smaller */}
        <div className="w-full max-w-[850px] bg-white/20 border border-white/30 rounded-[28px] p-2 flex flex-col md:flex-row backdrop-blur-md shadow-2xl">
          {/* Left Side */}
          <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">
            <h1 className="text-white text-3xl lg:text-4xl font-bold leading-tight max-w-[340px]">
              The ultimate fortress for your digital world.
            </h1>
          </div>

          {/* Right Side */}
          <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
            <div className="w-full max-w-[320px] mx-auto text-center">
              <h2 className="text-white text-3xl font-bold mb-1">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-white/80 text-[14px] mb-6 relative z-10">
                {isSignUp
                  ? "Sign up to secure your files"
                  : "Sign in with your credentials"}
              </p>

              {(error || message) && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs font-medium text-left ${error ? "bg-red-500/20 text-red-100 border border-red-500/30" : "bg-green-500/20 text-green-100 border border-green-500/30"}`}
                >
                  {error || message}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleAuth(isSignUp); }} className="space-y-3 relative z-10">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  className="w-full bg-white/20 border border-white/40 rounded-xl px-4 py-3 text-white placeholder-white/80 focus:outline-none focus:bg-white/30 focus:border-white/50 transition-all text-sm font-medium"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="w-full bg-white/20 border border-white/40 rounded-xl px-4 py-3 text-white placeholder-white/80 focus:outline-none focus:bg-white/30 focus:border-white/50 transition-all text-sm font-medium"
                />

                {!isSignUp && (
                  <div className="text-right pt-0.5 pb-2">
                    <button
                      type="button"
                      onClick={handleForgotAccount}
                      className="text-white/70 hover:text-white text-xs font-medium transition-colors"
                    >
                      Forgot account?
                    </button>
                  </div>
                )}
                {isSignUp && <div className="h-4"></div>}

                <div className="flex gap-4 mt-6">
                  {isSignUp ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(false);
                          setError("");
                          setMessage("");
                        }}
                        disabled={loading}
                        className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl py-3 text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
                      >
                        <Zap className="w-4 h-4 shadow-sm" /> Sign In
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl py-3 text-white font-medium flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 text-sm shadow-sm"
                      >
                        <Zap className="w-4 h-4 shadow-sm" /> Sign Up
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl py-3 text-white font-medium flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 text-sm shadow-sm"
                      >
                        <Zap className="w-4 h-4 shadow-sm" /> Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(true);
                          setError("");
                          setMessage("");
                        }}
                        disabled={loading}
                        className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl py-3 text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
                      >
                        <Zap className="w-4 h-4 shadow-sm" /> Sign Up
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="w-full px-8 py-6 flex justify-between items-center text-white/70 text-sm z-10 relative mt-auto hidden sm:flex">
        <div className="flex gap-6">
          <button
            onClick={() => setShowContact(true)}
            className="flex items-center gap-2 hover:text-white transition-colors font-medium"
          >
            <Phone size={16} /> Contact
          </button>
          <button
            onClick={() => setShowPrivacy(true)}
            className="flex items-center gap-2 hover:text-white transition-colors font-medium"
          >
            <Info size={16} /> Privacy Policy
          </button>
        </div>
        <div className="font-medium">
          &copy; {new Date().getFullYear()} Siphervault. All rights reserved.
        </div>
      </div>
      <div className="w-full px-6 py-6 flex flex-col gap-4 items-center text-white/70 text-sm z-10 relative mt-auto sm:hidden">
        <div className="flex gap-6">
          <button
            onClick={() => setShowContact(true)}
            className="flex items-center gap-2 hover:text-white transition-colors font-medium"
          >
            <Phone size={16} /> Contact
          </button>
          <button
            onClick={() => setShowPrivacy(true)}
            className="flex items-center gap-2 hover:text-white transition-colors font-medium"
          >
            <Info size={16} /> Privacy Policy
          </button>
        </div>
        <div className="font-medium text-center">
          &copy; {new Date().getFullYear()} Siphervault. All rights reserved.
        </div>
      </div>

      {/* Privacy Modal */}
      {showPrivacy && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowPrivacy(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/20 backdrop-blur-2xl p-10 rounded-[2rem] max-w-2xl w-full shadow-2xl border border-white/10 text-left text-white relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowPrivacy(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
            >
              <X size={16} />
            </button>
            <h3 className="text-2xl font-bold mb-6">Privacy Policy</h3>
            <div className="text-white/80 space-y-6 text-[15px] leading-relaxed">
              <p>
                Welcome to Siphervault. Your privacy is critically important to us. This policy outlines how we handle your data.
              </p>
              
              <div>
                <strong>1. Data Encryption:</strong> All files are encrypted to ensure maximum security. We do not have access to the raw data you store.
              </div>
              
              <div>
                <strong>2. Authentication:</strong> We use industry-standard security to manage your login credentials.
              </div>
              
              <div>
                <strong>3. Use of Data:</strong> Your data is solely used to provide the storage and encryption features of this application.
              </div>
              
              <div>
                <strong>4. Local Storage:</strong> Certain data may be cached on your device to improve performance. This is also secured and bound to your authentication scope.
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowContact(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/20 backdrop-blur-2xl p-8 sm:p-10 rounded-[2rem] max-w-md w-full shadow-2xl border border-white/10 text-left text-white relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowContact(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
            >
              <X size={16} />
            </button>
            <h3 className="text-2xl font-bold mb-8">Get in Touch</h3>
            
            <div className="space-y-4">
              <a 
                href="https://wa.me/918310260713" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-5 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/5 group"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-[#00E676] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <div>
                  <div className="font-bold text-white text-[17px]">WhatsApp</div>
                  <div className="text-white/60 text-[13px]">+91 8310260713</div>
                </div>
              </a>

              <a 
                href="mailto:prajwaltex@gmail.com" 
                className="flex items-center gap-5 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/5 group"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-[#EA4335] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-[17px]">Email Support</div>
                  <div className="text-white/60 text-[13px]">prajwaltex@gmail.com</div>
                </div>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
