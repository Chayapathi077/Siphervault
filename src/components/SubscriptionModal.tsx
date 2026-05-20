import React, { useState } from 'react';

interface SubscriptionModalProps {
  onClose: () => void;
  onSubscribe: (plan: string) => Promise<void> | void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, onSubscribe }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async (plan: string) => {
    setIsProcessing(true);
    try {
      await onSubscribe(plan);
    } finally {
      // It will either redirect or fail
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col relative group"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-tl from-white/5 to-transparent pointer-events-none z-0"></div>
        <div className="p-8 text-center border-b border-white/10 relative z-10 mt-4">
          <h2 className="text-2xl font-black text-white mb-2 drop-shadow-md">Upgrade your storage</h2>
          <p className="text-white/70 font-medium text-sm">Get more space for your important files and collaborate seamlessly.</p>
        </div>
        
        <button 
          onClick={onClose}
          type="button"
          disabled={isProcessing}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-transparent border-none cursor-pointer z-[100] hover:bg-white/10 rounded-xl transition-all duration-200 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {/* Free Plan */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col transition-all hover:bg-white/10 shadow-inner group/plan">
            <h3 className="text-lg font-bold text-white mb-1 drop-shadow-sm">Basic plan</h3>
            <p className="text-sm text-white/60 mb-4 font-medium">For organizing personal files.</p>
            <div className="text-3xl font-black text-white mb-6 drop-shadow-sm">Free</div>
            
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                <svg className="w-5 h-5 text-green-400 shrink-0 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                5 GB of secure cloud storage
              </li>
              <li className="flex items-center gap-3 text-sm text-white/80 font-medium">
                <svg className="w-5 h-5 text-green-400 shrink-0 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                Basic file sharing capabilities
              </li>
            </ul>
            <button 
              disabled 
              className="w-full py-4 bg-white/5 text-white/40 rounded-xl text-[15px] font-bold border border-white/10"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-[#6b00bd]/30 border border-[#b8008e]/40 backdrop-blur-md rounded-2xl p-6 flex flex-col text-white relative shadow-lg overflow-hidden group/plan">
            <div className="absolute top-0 right-0 bg-[#b8008e]/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 uppercase rounded-bl-lg tracking-wider border-b border-l border-white/20 shadow-sm">Most Popular</div>
            <h3 className="text-lg font-bold text-white mb-1 drop-shadow-sm">Pro Storage</h3>
            <p className="text-sm text-white/70 mb-4 font-medium">For power users and small teams.</p>
            <div className="flex items-end gap-1 mb-6">
              <div className="text-4xl font-black text-white drop-shadow-md">₹99</div>
              <div className="text-sm text-white/60 pb-1 font-medium">/ month</div>
            </div>
            
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-white font-medium">
                <svg className="w-5 h-5 text-[#00e5ff] shrink-0 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                100 GB of secure cloud storage
              </li>
              <li className="flex items-center gap-3 text-sm text-white font-medium">
                <svg className="w-5 h-5 text-[#00e5ff] shrink-0 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                Advanced link sharing & passwords
              </li>
              <li className="flex items-center gap-3 text-sm text-white font-medium">
                <svg className="w-5 h-5 text-[#00e5ff] shrink-0 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                Priority 24/7 customer support
              </li>
            </ul>
            <button 
              onClick={() => handleSubscribe('pro')}
              disabled={isProcessing}
              className="w-full py-4 bg-[#00e5ff]/20 backdrop-blur-md border border-[#00e5ff]/40 text-[#00e5ff] hover:bg-[#00e5ff]/30 rounded-xl text-[16px] font-bold flex items-center justify-center gap-3 cursor-pointer transition-all duration-200 active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed"
            >
               {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-[#00e5ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Upgrade to Pro'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
