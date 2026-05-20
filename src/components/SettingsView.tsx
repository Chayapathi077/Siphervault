import React, { useState, useRef, useEffect } from 'react';
import { User, updatePassword, deleteUser, getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Camera, HardDrive, Monitor, Moon, Sun, Key, Mail, User as UserIcon, Menu } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsViewProps {
  user: User;
  userProfile?: UserProfile | null;
  storageUsed: number;
  totalStorage: number;
  onUpdateProfile: (displayName: string, photoBase64: string | null) => Promise<void>;
  onMenuClick?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  user, userProfile, storageUsed, totalStorage, onUpdateProfile, onMenuClick 
}) => {
  const defaultName = userProfile?.displayName || user.displayName || '';
  let defaultPhoto = userProfile?.photoURL || user.photoURL || null;
  if (defaultPhoto && defaultPhoto.includes('googleusercontent.com')) {
    defaultPhoto = defaultPhoto.replace('=s96-c', '=s400-c');
  }
  const [displayName, setDisplayName] = useState(defaultName);
  const [photoBase64, setPhotoBase64] = useState<string | null>(defaultPhoto);

  useEffect(() => {
    setDisplayName(defaultName);
    setPhotoBase64(defaultPhoto);
  }, [defaultName, defaultPhoto]);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const storagePercentage = Math.min((storageUsed / totalStorage) * 100, 100);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingPhoto(true);
      try {
        // Compress image using Canvas
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(resolve => img.onload = resolve);
        
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
        if (!blob) throw new Error("Compression failed");

        const formData = new FormData();
        formData.append("file", blob, "profile.jpg");
        formData.append("userId", user.uid);
        formData.append("parentId", "hidden_profile_photos");

        const res = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!res.ok) throw new Error("Upload failed");
        
        const data = await res.json();
        if (data.file && data.file.downloadUrl) {
          setPhotoBase64(data.file.downloadUrl);
        }
      } catch (err) {
        alert("Failed to upload profile photo.");
        console.error(err);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await onUpdateProfile(displayName, photoBase64);
      alert('Profile updated successfully');
    } catch (e: any) {
      alert('Error updating profile: ' + e.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      await updatePassword(user, newPassword);
      setNewPassword('');
      alert('Password updated successfully');
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        alert('Please log out and log back in to change your password for security reasons.');
      } else {
        alert(e.message);
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <h2 className="text-[20px] font-semibold text-white leading-none drop-shadow-md">Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          <h2 className="text-[18px] font-bold text-white mb-6 flex items-center gap-2 drop-shadow-md">
            <UserIcon className="w-5 h-5 text-white/80" />
            Profile Details
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start relative z-10">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden cursor-pointer hover:border-white/50 hover:scale-[1.02] active:scale-95 transition-all duration-300 relative group shadow-inner backdrop-blur-md"
              >
                {photoBase64 ? (
                  <img src={photoBase64} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[32px] font-bold text-white/70">
                    {(displayName.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                   <Camera className="w-6 h-6 text-white drop-shadow-md" />
                </div>
              </div>
              {photoBase64 && (
                <button 
                  onClick={() => setPhotoBase64(null)}
                  className="text-[12px] text-red-300 font-medium hover:text-red-200 transition-colors bg-white/10 px-3 py-1 rounded-full border border-white/10 hover:bg-white/20 cursor-pointer"
                >
                  Remove Photo
                </button>
              )}
            </div>

            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-white/70 mb-1.5 ml-1">Email</label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                  <Mail className="w-4 h-4 text-white/50" />
                  <span className="text-[14px] text-white/90 truncate w-full">{user.email}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-[13px] font-semibold text-white/70 mb-1.5 ml-1">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:bg-white/20 transition-all duration-200 text-[14px] text-white placeholder-white/40 shadow-inner"
                  placeholder="E.g. Jane Doe"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={saveProfile}
                  disabled={isSavingProfile || !displayName.trim()}
                  className="px-6 py-2.5 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl font-bold cursor-pointer hover:bg-white/30 disabled:opacity-50 transition-all duration-200 text-[14px] active:scale-95"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security / Password */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none"></div>
          <h2 className="text-[18px] font-bold text-white mb-6 flex items-center gap-2 drop-shadow-md relative z-10">
            <Key className="w-5 h-5 text-white/80" />
            Security
          </h2>
          
          <div className="space-y-4 relative z-10 flex-1 flex flex-col">
            <div>
              <label className="block text-[13px] font-semibold text-white/70 mb-1.5 ml-1">Update Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:bg-white/20 transition-all duration-200 text-[14px] text-white placeholder-white/40 shadow-inner"
                placeholder="At least 6 characters"
              />
            </div>
            
            <div className="mt-auto pt-2">
              <button 
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword || newPassword.length < 6}
                className="px-6 py-2.5 bg-white/20 text-white border border-white/30 hover:bg-white/30 rounded-xl font-bold cursor-pointer disabled:opacity-50 transition-all duration-200 active:scale-95 text-[14px] shadow-sm backdrop-blur-md"
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
          <h2 className="text-[18px] font-bold text-white mb-6 flex items-center gap-2 drop-shadow-md relative z-10">
            <HardDrive className="w-5 h-5 text-white/80" />
            Storage Usage
          </h2>
          
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-3">
              <div>
                <span className="text-[32px] font-black text-white leading-none drop-shadow-md">{formatSize(storageUsed)}</span>
                <span className="text-[14px] font-bold text-white/60 ml-2">used of {formatSize(totalStorage)}</span>
              </div>
              <span className="text-[16px] font-black text-white drop-shadow-sm">{storagePercentage.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/10 shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${storagePercentage > 90 ? 'bg-red-400' : storagePercentage > 75 ? 'bg-amber-400' : 'bg-gradient-to-r from-white/60 to-white'}`}
                style={{ width: `${storagePercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/20 backdrop-blur-xl border border-red-500/30 shadow-sm rounded-xl p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none"></div>
          <h2 className="text-[18px] font-bold text-red-400 mb-3 flex items-center gap-2 drop-shadow-md relative z-10">
            Danger Zone
          </h2>
          <p className="text-[14px] font-medium text-red-200/80 mb-5 relative z-10">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          {showDeleteConfirm ? (
            <div className="bg-red-950/50 backdrop-blur-md p-5 rounded-xl border border-red-500/20 relative z-10 shadow-inner">
              <p className="text-[14px] text-red-200 mb-5 font-medium leading-relaxed drop-shadow-sm">
                Are you absolutely sure you want to delete your account? This will permanently delete all your files and data. This action cannot be undone.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeletingAccount}
                  className="px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl font-bold cursor-pointer hover:bg-white/20 transition-all text-[14px] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    setIsDeletingAccount(true);
                    try {
                      const auth = getAuth();
                      if (auth.currentUser) {
                        const uid = auth.currentUser.uid;
                        
                        // Delete user's files from Firestore
                        const filesQuery = query(collection(db, 'files'), where('ownerId', '==', uid));
                        const fileSnaps = await getDocs(filesQuery);
                        const fileDeletePromises = fileSnaps.docs.map(d => deleteDoc(d.ref));
                        
                        // Delete user's folders from Firestore
                        const foldersQuery = query(collection(db, 'folders'), where('ownerId', '==', uid));
                        const folderSnaps = await getDocs(foldersQuery);
                        const folderDeletePromises = folderSnaps.docs.map(d => deleteDoc(d.ref));
                        
                        await Promise.all([...fileDeletePromises, ...folderDeletePromises]);
                        
                        // Delete user profile data
                        await deleteDoc(doc(db, 'users', uid));
                        
                        // Delete user from postgres
                        await fetch(`/api/users/${uid}`, { method: 'DELETE' });
                        
                        // Finally, delete the auth user
                        await deleteUser(auth.currentUser);
                        alert('Account and all files deleted successfully.');
                        window.location.href = '/';
                      }
                    } catch (error: any) {
                      console.error("Delete Account Error:", error);
                      let errMsg = error.message || 'Error deleting account';
                      try {
                        const parsed = JSON.parse(errMsg);
                        if (parsed.error) errMsg = parsed.error;
                      } catch(e) {}
                      
                      if (error.code === 'auth/requires-recent-login' || errMsg.includes('auth/requires-recent-login')) {
                        alert('Please log in again before deleting your account. This is required for security purposes.');
                        const { signOut, getAuth } = await import('firebase/auth');
                        await signOut(getAuth());
                      } else {
                        alert(`Error: ${errMsg}`);
                      }
                    } finally {
                      setIsDeletingAccount(false);
                      setShowDeleteConfirm(false);
                    }
                  }}
                  disabled={isDeletingAccount}
                  className="px-5 py-2.5 bg-red-500/20 backdrop-blur-md text-red-100 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-bold cursor-pointer transition-all duration-200 text-[14px] disabled:opacity-50 active:scale-95"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl font-bold cursor-pointer transition-all text-[14px] self-start shadow-sm hover:shadow-md"
            >
              Delete Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
