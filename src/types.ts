export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  storageUsed: number;
  totalStorage: number;
  createdAt: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  ownerId: string;
  parentId: string;
  downloadUrl: string;
  firebaseUrl?: string;
  isStarred: boolean;
  isDeleted: boolean;
  isShared: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
}

export interface FolderMetadata {
  id: string;
  name: string;
  ownerId: string;
  parentId: string;
  isStarred: boolean;
  isDeleted: boolean;
  createdAt: any;
}
