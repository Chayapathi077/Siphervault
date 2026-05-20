/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { onAuthStateChanged, updateProfile, User } from "firebase/auth";
import { auth, loginWithGoogle, logout } from "./lib/firebase";
import { FileMetadata, UserProfile } from "./types";
import { motion } from "motion/react";
import { Navbar } from "./components/Navbar";
import { FileCard } from "./components/FileCard";
import { LoginScreen } from "./components/LoginScreen";
import { VerifyEmailScreen } from "./components/VerifyEmailScreen";
import { UploadView } from "./components/UploadView";
import { FileDetailsView } from "./components/FileDetailsView";
import { SharedFileAccessView } from "./components/SharedFileAccessView";
import { SecureShareView } from "./components/SecureShareView";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { SettingsView } from "./components/SettingsView";
import { RedeemLinkView } from "./components/RedeemLinkView";
import { LandingPage } from "./components/LandingPage";
import { Menu, UploadCloud, Star } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentView, setCurrentView] = useState("landing");
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [isSharingFile, setIsSharingFile] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [filterCategory, setFilterCategory] = useState<
    "all" | "images" | "documents" | "videos" | "zip" | "others"
  >("all");
  const [emailVerifiedOverride, setEmailVerifiedOverride] = useState(false);
  const [sharedFileId, setSharedFileId] = useState<string | null>(() => {
    const p = window.location.pathname;
    if (p.startsWith("/s/")) {
      return p.substring(3);
    }
    return null;
  });
  const [sharedFileMeta, setSharedFileMeta] = useState<FileMetadata | null>(
    null,
  );
  const [paymentMessage, setPaymentMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    if (paymentStatus === "success") {
      setPaymentMessage({
        type: "success",
        text: "Payment successful! Your account has been upgraded.",
      });
      window.history.replaceState({}, "", window.location.pathname);
      // Auto dismiss after 5s
      setTimeout(() => setPaymentMessage(null), 5000);
    } else if (paymentStatus === "failed") {
      setPaymentMessage({
        type: "error",
        text: "Payment failed or was cancelled.",
      });
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setPaymentMessage(null), 5000);
    }
  }, []);

  useEffect(() => {
    setSelectedFile(null);
    setIsSharingFile(false);
  }, [currentView]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsReady(true);
      if (firebaseUser) {
        if (currentView === "landing") {
          setCurrentView("home");
        }
        try {
          const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoUrl: firebaseUser.photoURL,
            }),
          });
          const data = await res.json();
          setUserProfile({
            uid: data.id,
            email: data.email,
            displayName: data.display_name,
            photoURL: data.photo_url,
            storageUsed: Number(data.storage_used),
            totalStorage: Number(data.total_storage),
            createdAt: data.created_at,
          });
        } catch (error) {
          console.error("Error checking user:", error);
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PAYMENT_COMPLETE") {
        window.location.href = `/?payment_status=${event.data.status}`;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setUserProfile({
            uid: data.id,
            email: data.email,
            displayName: data.display_name,
            photoURL: data.photo_url,
            storageUsed: Number(data.storage_used),
            totalStorage: Number(data.total_storage),
            createdAt: data.created_at,
          });
        }
      } catch (err) {
        console.error("Error fetching user", err);
      }
    };
    fetchUser();
    // In a real app we'd want to poll or use websockets, here we'll just fetch occasionally
    const interval = setInterval(fetchUser, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    async function loadSharedFile() {
      if (sharedFileId && user) {
        try {
          const res = await fetch(`/api/files/${sharedFileId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.isShared || data.ownerId === user.uid) {
              setSharedFileMeta(data as FileMetadata);
            } else {
              setSharedFileId(null);
              window.history.replaceState({}, "", "/");
            }
          } else {
            setSharedFileId(null);
            window.history.replaceState({}, "", "/");
          }
        } catch (error) {
          console.error("Shared file load error:", error);
          setSharedFileId(null);
          window.history.replaceState({}, "", "/");
        }
      }
    }
    loadSharedFile();
  }, [sharedFileId, user]);

  const loadFiles = async () => {
    if (!user) {
      setFiles([]);
      return;
    }
    try {
      const res = await fetch(`/api/files?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        const filesList = data.files;
        setFiles(currentView === "home" ? filesList.slice(0, 12) : filesList);
        if (selectedFile) {
          const updated = filesList.find(
            (f: FileMetadata) => f.id === selectedFile.id,
          );
          if (!updated) {
            setSelectedFile(null);
            setIsSharingFile(false);
          } else {
            setSelectedFile(updated);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching files", e);
    }
  };

  useEffect(() => {
    loadFiles();
    const interval = setInterval(loadFiles, 5000); // Polling for updates
    return () => clearInterval(interval);
  }, [user, currentView]); // adding loadFiles logic

  const handleUpload = async (uploadedFiles: File[]) => {
    if (!user) return false;
    setIsUploading(true);

    try {
      const totalSize = uploadedFiles.reduce((acc, file) => acc + file.size, 0);
      const currentStorageUsed = userProfile?.storageUsed || 0;
      const currentTotalStorage = userProfile?.totalStorage || 1024 * 1024 * 1024 * 2;
      
      if (currentStorageUsed + totalSize > currentTotalStorage) {
        throw new Error("Storage limit exceeded. Please upgrade your plan.");
      }

      for (const file of uploadedFiles) {
        // Init upload
        const initRes = await fetch("/api/files/upload/init", { method: "POST" });
        if (!initRes.ok) throw new Error("Failed to initialize upload");
        const { id: fileId } = await initRes.json();
        
        const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        
        for (let i = 0; i < totalChunks; i++) {
          const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          const formData = new FormData();
          formData.append("fileId", fileId);
          formData.append("chunkIndex", i.toString());
          formData.append("chunk", chunk);
          
          const chunkRes = await fetch("/api/files/upload/chunk", {
            method: "POST",
            body: formData,
          });
          if (!chunkRes.ok) {
            const err = await chunkRes.json().catch(() => ({}));
            throw new Error(err.error || "Chunk upload failed");
          }
        }

        const payload = {
          id: fileId,
          userId: user.uid,
          parentId: "root",
          name: file.name,
          type: file.type,
          size: file.size
        };

        const res = await fetch("/api/files/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Upload complete failed");
        }
      }

      await loadFiles();
      setCurrentView("home");
      return true;
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Error uploading file: " + (error.message || String(error)));
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (id: string) => {
    const file = files.find((f: FileMetadata) => f.id === id);
    if (!file) return;
    try {
      await fetch(`/api/files/${id}`, { method: "DELETE" });
      await loadFiles();
      if (selectedFile?.id === id) {
        setSelectedFile(null);
        setIsSharingFile(false);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleDownload = async (file: FileMetadata) => {
    try {
      const filenameStr = encodeURIComponent(file.name || "download");
      const res = await fetch(
        `/api/files/download?id=${encodeURIComponent(file.id)}`,
      );
      if (!res.ok) throw new Error("Could not get download URL");
      const data = await res.json();
      window.location.href = data.url;
    } catch (err: any) {
      alert("Download error: " + err.message);
    }
  };

  const handleUpdateProfile = async (
    displayName: string,
    photoBase64: string | null,
  ) => {
    if (!user) return;

    try {
      await updateProfile(user, {
        displayName,
        ...(photoBase64 && photoBase64.length < 150000
          ? { photoURL: photoBase64 }
          : {}),
      });
    } catch (e) {
      console.warn("Could not update firebase auth profile", e);
    }

    await fetch(`/api/users/${user.uid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName,
        photoUrl: photoBase64,
      }),
    });

    if (userProfile) {
      setUserProfile({
        ...userProfile,
        displayName: displayName,
        photoURL: photoBase64,
      });
    }

    setUser({ ...user } as any); // Force re-render
  };

  if (!isReady) {
    return null;
  }

  if (!user) {
    return <LandingPage onLogin={() => {}} />;
  }

  if (
    !(user.emailVerified || emailVerifiedOverride) &&
    user.providerData.some((p: any) => p.providerId === "password")
  ) {
    return (
      <VerifyEmailScreen
        onVerified={() => {
          setEmailVerifiedOverride(true);
        }}
      />
    );
  }

  if (sharedFileId) {
    if (sharedFileMeta) {
      return (
        <div className="flex h-screen w-full bg-gradient-to-br from-[#6b00bd] via-[#b8008e] to-[#ec0058]">
          <SharedFileAccessView
            file={sharedFileMeta}
            onDownload={handleDownload}
            onBack={() => {
              setSharedFileId(null);
              setSharedFileMeta(null);
              window.history.replaceState({}, "", "/");
            }}
          />
        </div>
      );
    }
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#6b00bd] via-[#b8008e] to-[#ec0058]">
        <div className="text-white/80 font-medium animate-pulse">
          Loading secure file...
        </div>
      </div>
    );
  }

  let displayFiles = files.filter((f) => {
    if (
      searchQuery &&
      !f.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    if (currentView === "home") return true;
    if (filterCategory === "all") return true;
    if (filterCategory === "images") return f.type.startsWith("image/");
    if (filterCategory === "videos") return f.type.startsWith("video/");
    if (filterCategory === "documents")
      return (
        f.type.startsWith("application/pdf") ||
        f.type.startsWith("text/") ||
        f.type.includes("document")
      );
    if (filterCategory === "zip")
      return (
        f.type.includes("zip") ||
        f.type.includes("archive") ||
        f.type.includes("tar") ||
        f.type.includes("rar") ||
        f.name.endsWith(".zip") ||
        f.name.endsWith(".rar")
      );
    if (filterCategory === "others")
      return (
        !f.type.startsWith("image/") &&
        !f.type.startsWith("video/") &&
        !f.type.startsWith("application/pdf") &&
        !f.type.startsWith("text/") &&
        !f.type.includes("document") &&
        !f.type.includes("zip") &&
        !f.type.includes("archive") &&
        !f.type.includes("tar") &&
        !f.type.includes("rar") &&
        !f.name.endsWith(".zip") &&
        !f.name.endsWith(".rar")
      );
    return true;
  });

  if (currentView === "home") {
    displayFiles = displayFiles.slice(0, 10);
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const totalStorage = userProfile?.totalStorage || 1024 * 1024 * 1024 * 2;
  const storageUsed = userProfile?.storageUsed || 0;
  const storagePercentage = Math.min((storageUsed / totalStorage) * 100, 100);
  const isPro = totalStorage > 5368709120; // Greater than 5GB means Pro

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#6b00bd] via-[#b8008e] to-[#ec0058] text-white transition-colors relative font-sans">
      {paymentMessage && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl border text-sm font-semibold flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-4 ${paymentMessage.type === "success" ? "bg-green-500/20 text-green-200 border-green-500/30 backdrop-blur-md shadow-sm" : "bg-red-500/20 text-red-200 border-red-500/30 backdrop-blur-md shadow-sm"}`}
        >
          {paymentMessage.type === "success" ? "✅" : "❌"}{" "}
          {paymentMessage.text}
          <button
            onClick={() => setPaymentMessage(null)}
            className="ml-2 hover:opacity-70 text-current"
          >
            ✕
          </button>
        </div>
      )}
      <Navbar
        user={user}
        userProfile={userProfile}
        totalStorage={totalStorage}
        currentView={currentView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onViewChange={(v) => {
          if (v === "logout") {
            logout();
          } else {
            setCurrentView(v);
            setSelectedFile(null);
            setIsSharingFile(false);
          }
        }}
        onHomeClick={() => {
          setCurrentView("home");
          setSelectedFile(null);
          setIsSharingFile(false);
        }}
        onUpgrade={() => setIsSubModalOpen(true)}
        onLogout={logout}
      />

      <div className="flex flex-1 overflow-hidden h-full relative">
        <main className="flex-1 w-full mt-0 overflow-y-auto overflow-x-hidden relative h-full">
          <div className="p-[16px] sm:p-[32px] max-w-[1400px] mx-auto min-h-full">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              {selectedFile ? (
                isSharingFile ? (
                  <SecureShareView
                    file={selectedFile}
                    onBack={() => setIsSharingFile(false)}
                  />
                ) : (
                  <FileDetailsView
                    file={selectedFile}
                    onBack={() => {
                      setSelectedFile(null);
                      setIsSharingFile(false);
                    }}
                    onDownload={handleDownload}
                    onDelete={deleteFile}
                    onGenerateShareLink={() => setIsSharingFile(true)}
                  />
                )
              ) : currentView === "upload" ? (
                <UploadView onUpload={handleUpload} isUploading={isUploading} />
              ) : currentView === "redeem" ? (
                <RedeemLinkView onBack={() => setCurrentView("home")} />
              ) : currentView === "settings" ? (
                <SettingsView
                  user={user}
                  userProfile={userProfile}
                  storageUsed={storageUsed}
                  totalStorage={totalStorage}
                  onUpdateProfile={handleUpdateProfile}
                />
              ) : (
                <div className="max-w-[1200px] mx-auto pb-10">
                  {/* Storage overview removed as requested */}

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <h2 className="text-[20px] font-semibold text-white shrink-0 drop-shadow-md">
                        {currentView === "home" ? "Recent Files" : "All Files"}
                      </h2>

                      {currentView === "all" && (
                        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                          {(
                            [
                              "all",
                              "images",
                              "documents",
                              "videos",
                              "zip",
                              "others",
                            ] as const
                          ).map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setFilterCategory(cat)}
                              className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-200 backdrop-blur-sm active:scale-95 border ${
                                filterCategory === cat
                                  ? "bg-white/30 border-white/40 text-white shadow-sm"
                                  : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:text-white"
                              }`}
                            >
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setCurrentView("upload")}
                      title="Upload Files"
                      className="w-11 h-11 rounded-2xl bg-white/10 text-white/80 border border-white/20 flex items-center justify-center font-semibold overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/40 hover:text-white transition-all p-0 outline-none shadow-lg backdrop-blur-xl shrink-0"
                    >
                      <UploadCloud className="w-5 h-5" />
                    </button>
                  </div>

                  {displayFiles.length === 0 ? (
                    <div className="text-center py-20 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl text-white/80 font-medium">
                      No files found in this category. Go to Upload to get
                      started!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5 pb-10 px-[1px]">
                      {displayFiles.map((file) => (
                        <FileCard
                          key={file.id}
                          file={file}
                          onDelete={deleteFile}
                          onDownload={handleDownload}
                          onViewDetails={setSelectedFile}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>

      {isSubModalOpen && (
        <SubscriptionModal
          onClose={() => setIsSubModalOpen(false)}
          onSubscribe={async (plan) => {
            try {
              if (!user) return;

              // Load Razorpay script dynamically
              const loadRazorpay = () => {
                return new Promise((resolve) => {
                  const script = document.createElement("script");
                  script.src = "https://checkout.razorpay.com/v1/checkout.js";
                  script.onload = () => resolve(true);
                  script.onerror = () => resolve(false);
                  document.body.appendChild(script);
                });
              };

              const isLoaded = await loadRazorpay();
              if (!isLoaded) {
                alert("Razorpay SDK failed to load. Are you offline?");
                return;
              }

              const response = await fetch(
                "/api/payments/create-razorpay-subscription",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: user.uid }),
                },
              );
              const data = await response.json();

              if (!data.subscriptionId) {
                alert(
                  "Failed to initiate subscription: " +
                    (data.error || "Unknown"),
                );
                return;
              }

              if (data.isMock) {
                try {
                  const verifyRes = await fetch(
                    "/api/payments/verify-razorpay-subscription",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: user.uid,
                        isMock: true,
                        razorpay_subscription_id: data.subscriptionId,
                      }),
                    },
                  );
                  const verifyData = await verifyRes.json();
                  if (verifyData.success) {
                    window.location.href = "/?payment_status=success";
                  } else {
                    window.location.href = "/?payment_status=failed";
                  }
                } catch (err) {
                  window.location.href = "/?payment_status=failed";
                }
                return;
              }

              const options = {
                key: data.keyId,
                name: "Siphervault",
                description: "Pro Monthly Subscription",
                subscription_id: data.subscriptionId,
                handler: async function (response: any) {
                  try {
                    const verifyRes = await fetch(
                      "/api/payments/verify-razorpay-subscription",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId: user.uid,
                          razorpay_subscription_id:
                            response.razorpay_subscription_id,
                          razorpay_payment_id: response.razorpay_payment_id,
                          razorpay_signature: response.razorpay_signature,
                        }),
                      },
                    );
                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                      window.location.href = "/?payment_status=success";
                    } else {
                      window.location.href = "/?payment_status=failed";
                    }
                  } catch (err) {
                    window.location.href = "/?payment_status=failed";
                  }
                },
                prefill: {
                  name: userProfile?.displayName || user.email || "",
                  email: user.email || "",
                },
                theme: {
                  color: "#0f172a",
                },
              };

              const rzp1 = new (window as any).Razorpay(options);
              rzp1.on("payment.failed", function () {
                window.location.href = "/?payment_status=failed";
              });
              rzp1.open();
            } catch (e: any) {
              console.error("Payment initiation failed:", e);
              alert("Payment initiation failed");
            }
          }}
        />
      )}
    </div>
  );
}
