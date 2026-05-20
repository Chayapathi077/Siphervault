import React, { useState, useRef, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import {
  Star,
  LogOut,
  User as UserIcon,
  Home,
  File as FileIcon,
  Settings,
  Zap,
  UploadCloud,
  Menu,
  X,
  Search,
  Key,
} from "lucide-react";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";

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

interface NavbarProps {
  user: FirebaseUser | null;
  userProfile?: UserProfile | null;
  totalStorage?: number;
  currentView?: string;
  onViewChange?: (view: string) => void;
  onHomeClick?: () => void;
  onLogout?: () => void;
  onUpgrade?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  userProfile,
  totalStorage = 0,
  currentView,
  onViewChange,
  onHomeClick,
  onLogout,
  onUpgrade,
  searchQuery,
  onSearchChange,
}) => {
  const isPro = totalStorage > 5368709120; // Greater than 5GB means Pro
  let photoUrl = userProfile?.photoURL || user?.photoURL;
  if (photoUrl && photoUrl.includes('=s96-c')) {
    photoUrl = photoUrl.replace('=s96-c', '=s400-c');
  }
  const displayName = userProfile?.displayName || user?.displayName || "User";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else if (!isSearchOpen && onSearchChange) {
      onSearchChange("");
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "all", label: "All Files", icon: FileIcon },
    { id: "redeem", label: "Access Link", icon: Key },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <nav className="px-4 sm:px-8 py-3 flex justify-between items-center sticky top-0 z-50 transition-all text-white">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center cursor-pointer outline-none border border-white/20 hover:bg-white/20 transition-all duration-200 p-0 md:hidden shadow-sm backdrop-blur-md active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div
              onClick={onHomeClick}
              className="hidden md:flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-white/20 to-white/5 rounded-xl text-white cursor-pointer hover:from-white/30 hover:to-white/10 transition-all select-none border border-white/30 shadow-[0_8px_32px_rgba(255,255,255,0.1)] backdrop-blur-xl"
            >
              <Logo />
            </div>
            <span
              onClick={onHomeClick}
              className="text-[20px] font-bold text-white hidden lg:block cursor-pointer hover:opacity-80 transition-opacity select-none drop-shadow-md"
            >
              Siphervault
            </span>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            {/* Desktop Navigation Icons */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center">
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 250, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="overflow-hidden mr-2"
                    >
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery || ""}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        placeholder="Search files..."
                        className="w-full h-11 px-4 bg-white/10 border border-white/20 rounded-2xl text-[14px] outline-none focus:bg-white/20 transition-all duration-200 text-white placeholder-white/60 shadow-sm backdrop-blur-xl"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  title="Search"
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-semibold overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/40 transition-all duration-200 active:scale-95 p-0 outline-none shadow-sm backdrop-blur-xl mr-3 ${
                    isSearchOpen
                      ? "bg-white/20 text-white ring-2 ring-white/30 border border-white/30"
                      : "bg-white/10 text-white/80 border border-white/20 hover:text-white"
                  }`}
                >
                  {isSearchOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>

              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange?.(item.id)}
                  title={item.label}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-semibold overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/40 transition-all duration-200 active:scale-95 p-0 outline-none shadow-sm backdrop-blur-xl ${
                    currentView === item.id
                      ? "bg-white/20 text-white ring-2 ring-white/30 border border-white/30"
                      : "bg-white/10 text-white/80 border border-white/20 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </button>
              ))}
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center font-semibold text-white overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/40 transition-all duration-200 active:scale-95 p-0 outline-none shadow-sm backdrop-blur-xl border border-white/20 ${isPro ? "ring-2 ring-[#00e5ff] border-none" : ""}`}
                title="Profile & More"
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (
                    displayName.charAt(0) ||
                    user.email?.charAt(0) ||
                    "U"
                  ).toUpperCase()
                )}
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-56 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col py-2"
                  >
                    <div className="px-4 py-3 border-b border-white/10 mb-1">
                      <p className="text-sm font-bold text-white truncate">
                        {displayName}
                      </p>
                      {isPro && (
                        <span className="inline-flex mt-1 relative overflow-hidden text-[9px] font-black text-[#00e5ff] uppercase tracking-wider items-center gap-1 bg-[#00e5ff]/10 px-1.5 py-0.5 rounded border border-[#00e5ff]/20 shadow-sm">
                          <Star className="w-2.5 h-2.5 fill-[#00e5ff]" /> PRO
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onViewChange?.("settings");
                      }}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/15 transition-colors text-white font-medium text-[14px]"
                    >
                      <UserIcon className="w-4 h-4 text-white/80" /> My Profile
                    </button>
                    {!isPro && (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          if (onUpgrade) onUpgrade();
                        }}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/15 transition-colors text-white font-medium text-[14px]"
                      >
                        <Zap className="w-4 h-4 text-[#00e5ff]" /> Upgrade Plan
                      </button>
                    )}
                    <div className="h-[1px] bg-white/10 my-1"></div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-red-500/20 transition-colors text-red-100 font-medium text-[14px]"
                    >
                      <LogOut className="w-4 h-4 text-red-300" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-black/40 backdrop-blur-2xl border-r border-white/10 z-[70] flex flex-col shadow-2xl"
            >
              <div className="p-5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white border border-white/30">
                    <Logo />
                  </div>
                  <span className="text-[18px] font-bold text-white">
                    Siphervault
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-4 flex flex-col gap-2">
                {[...navItems].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange?.(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-semibold transition-all ${
                      currentView === item.id
                        ? "bg-white/20 text-white shadow-md border border-white/10"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}

                {/* Mobile Usage Overview maybe here if needed */}
              </div>

              {!isPro && (
                <div className="p-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onUpgrade?.();
                    }}
                    className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#00e5ff]/20 to-[#b8008e]/20 hover:from-[#00e5ff]/30 hover:to-[#b8008e]/30 border border-white/20 text-white font-bold transition-all"
                  >
                    <Zap className="w-4 h-4 fill-[#00e5ff]" />
                    Upgrade to PRO
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
