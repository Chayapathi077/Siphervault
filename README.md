# Siphervault — Premium Cloud File Storage Platform

<img width="2468" height="1936" alt="siphervault1" src="https://github.com/user-attachments/assets/8a9d3722-c3dd-4f6f-9e3a-7cdcf914bdb9" />


## Project Overview

**What is Siphervault?**
Siphervault is a premium, full-stack cloud file storage platform that lets users securely upload, organise, manage, and share files — all from a sleek browser interface. Think of it like a private, self-hosted Google Drive with a glassmorphic dark design.

Users sign in with Google or Email/Password, are assigned a personal 2GB storage vault, and can upload any file type — documents, images, videos, ZIPs, and more. Files are stored either directly in the database (small files & profile photos) or via a chunked upload system for large files. Every file can be securely shared with anyone via a unique link, with optional view count limits and download restrictions.

The entire system is powered by **React + TypeScript** on the frontend, **Express (Node.js + TypeScript)** on the backend, **Firebase Authentication** for identity, and **Turso (libSQL)** as a cloud-hosted, edge-native database — deployed globally on **Vercel**.

---

## How Does It Work?

### For Users (People Who Want to Store Files)

1. **Open the App** — The user visits the Siphervault URL. They're greeted with a stunning dark glassmorphic landing page explaining the product.
2. **Sign In** — The user signs in using Google OAuth (one click, no password) or Email/Password (with email verification link).

<img width="2468" height="1936" alt="siphervault2" src="https://github.com/user-attachments/assets/89b399d3-b341-47c0-94a9-ec48d4ea9c02" />



3. **View the Dashboard** — After logging in, the user sees their personal vault:
   * A searchable file grid sorted by recency
   * Category filters: Images, Documents, Videos, ZIP, Others
   * A storage usage bar (e.g., "1.2 GB used of 2 GB")
4. **Upload Files** — The user clicks the Upload button and either drag-and-drops or selects files. The system checks storage quota before uploading, slices large files into 2MB chunks, fires all chunks in parallel using `Promise.all` for maximum speed, and saves metadata and binary data to Turso.
5. **View & Download** — Every uploaded file appears as a card in the grid. Clicking a file opens a detailed view with metadata, a download button, and a share option.
6. **Secure Sharing** — The user can generate a shareable link for any file. They can set a maximum view count (e.g., link expires after 5 views) and toggle whether the recipient can download the file. The link is a short, unique 6-character code (e.g., `/s/a3f9k2`).

<img width="2468" height="1936" alt="siphervault4" src="https://github.com/user-attachments/assets/5ac3b117-b119-4c1f-ab98-771258657f60" />


7. **Access a Shared File** — Anyone with the link visits `/s/<linkId>`. The system validates the link, increments the view counter, and shows the file — without requiring login.

<img width="2468" height="1936" alt="siphervault3" src="https://github.com/user-attachments/assets/ce61f112-fa34-402a-9119-65a6c00f4ad0" />


8. **Settings** — Users can update their Display Name and Profile Photo. The photo is compressed client-side to a 400×400 JPEG before uploading.
9. **Upgrade to Pro** — Users can upgrade their vault to 100GB via Razorpay subscription. The system validates the payment on the backend before granting the upgrade.

---

## The Key Architecture Idea

Siphervault uses a **split storage strategy** to bypass Vercel's Serverless payload limits:

| File Type | Storage Method |
| :--- | :--- |
| **Profile Photos (tiny)** | Stored as raw `BLOB` directly in the `files` table |
| **Large Files (any size)** | Sliced into 2MB chunks → stored in `file_chunks` table → reassembled on download |

This entirely bypasses Vercel's 4.5MB Serverless payload limit. Each individual chunk is only 2MB — well under the limit — so 500MB files upload just as reliably as 1MB files.

---

## Technologies Used

### Frontend (What You See)
| Technology | What It Does |
| :--- | :--- |
| **React 19** | The entire UI is a React Single-Page Application (SPA). Components handle routing, state, and rendering. |
| **TypeScript** | Strict typing across all components, types, and API calls — catches errors at compile time. |
| **Vanilla CSS + Glassmorphism** | A custom `index.css` delivers the premium dark glassmorphic design — frosted card backgrounds, gradient overlays, smooth transitions. |
| **Framer Motion** | Powers page-transition animations and view-change fade effects. |
| **Lucide React** | The icon library used for all UI icons — upload, star, search, settings, share. |
| **React Dropzone** | Handles drag-and-drop file selection in the upload view. |
| **Recharts** | Renders the storage usage and analytics charts in the dashboard. |
| **Google Fonts (Inter)** | The premium sans-serif typeface used throughout the app. |

### Backend (Behind the Scenes)
| Technology | What It Does |
| :--- | :--- |
| **Express (Node.js)** | The web framework powering all API routes — file uploads, user management, payments, sharing. |
| **TypeScript (tsx)** | The backend is written in TypeScript and executed directly using `tsx` — no compile step needed locally. |
| **Multer** | Handles multipart form data for file and chunk uploads, keeping binary data in memory. |
| **Turso (libSQL)** | A globally distributed, edge-native SQLite database that stores all users, files, chunks, transactions, and shared links. |
| **crypto** | Node's built-in module generates UUID file IDs and the 6-character shared link codes. |

### Authentication & Payments
| Technology | What It Does |
| :--- | :--- |
| **Firebase Auth** | Manages all user authentication — Google OAuth, Email/Password sign-up, and email verification. The Firebase UID is used as the primary key. |
| **Razorpay** | Handles Pro subscription payments via server-side subscription orders and client-side checkout popups. Verified server-side using HMAC-SHA256 signatures. |

### Deployment (Vercel)
| Technology | What It Does |
| :--- | :--- |
| **Vercel** | Hosts both the static React frontend (built by Vite) and the Express backend (as a Serverless Function via `@vercel/node`). |
| **Vite** | Bundles the React frontend for production. Also provides the development HMR server locally. |
| **vercel.json** | Routes all `/api/*` requests to the Express `server.ts` backend, and all other requests to the static frontend. |

---

## API Endpoints

### User Management
| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/users` | `POST` | Create or sync a user record after Firebase login |
| `/api/users/:id` | `GET` | Fetch a user's profile and storage quota |
| `/api/users/:id` | `PUT` | Update display name and profile photo URL |
| `/api/users/:id` | `DELETE` | Delete a user and all their files and transactions |

### File Management
| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/files` | `GET` | List all files for a given userId |
| `/api/files/upload` | `POST` | Upload a small file (e.g., profile photo) directly as multipart form data |
| `/api/files/upload/init` | `POST` | Initialise a chunked upload — returns a unique fileId |
| `/api/files/upload/chunk` | `POST` | Upload a single 2MB chunk for a given fileId and chunkIndex |
| `/api/files/upload/complete`| `POST` | Finalise a chunked upload — saves metadata and updates storage quota |
| `/api/files/media` | `GET` | Stream a file's binary data back to the browser |
| `/api/files/download` | `GET` | Returns a download URL for a given file ID |
| `/api/files/:id` | `GET` | Get full metadata for a single file |
| `/api/files/:id` | `DELETE` | Delete a file and its chunks, and free up user storage |
| `/api/files/:id/share` | `PATCH` | Toggle a file's shared status |
| `/api/files/:id/star` | `PATCH` | Toggle a file's starred (favourited) status |

### Secure Sharing & Payments
| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/links` | `POST` | Generate a new shareable link for a file |
| `/api/links/:id` | `GET` | Validate a shared link, increment view counter, return file metadata |
| `/api/payments/create-razorpay-subscription` | `POST` | Create a Razorpay subscription order |
| `/api/payments/verify-razorpay-subscription` | `POST` | Verify signature and upgrade user storage to 100GB |
| `/api/health` | `GET` | Returns `{ status: "ok" }` — used to verify the backend is alive |

---

## Architecture Diagram

```text
┌──────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                        │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐  │
│  │   React SPA    │  │ Framer Motion  │  │ Lucide /   │  │
│  │  (App.tsx +    │  │  (Animations)  │  │ Dropzone   │  │
│  │  Components)   │  │                │  │            │  │
│  └───────┬────────┘  └────────────────┘  └────────────┘  │
│          │  Firebase Auth (Google / Email)               │
│          │  HTTP fetch() to /api/* │
└──────────┼───────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│         VERCEL HOSTING (Global Edge Network)             │
│                                                          │
│  ┌──────────────────────┐   ┌──────────────────────────┐ │
│  │  Static Frontend     │   │  Serverless Function     │ │
│  │  (Vite-built React)  │   │  (Express — server.ts)   │ │
│  │  Served from CDN     │   │  Handles all /api/* reqs │ │
│  └──────────────────────┘   └──────────┬───────────────┘ │
│                                        │                 │
└────────────────────────────────────────┼─────────────────┘
                                         │
                    ┌────────────────────┼─────────────────┐
                    │                    │                 │
                    ▼                    ▼                 ▼
          ┌──────────────┐    ┌──────────────────┐  ┌──────────────┐
          │  Turso DB    │    │  Firebase Auth   │  │  Razorpay    │
          │  (libSQL)    │    │  (Identity &     │  │  (Payments   │
          │  users       │    │   Email Verify)  │  │   & Subs)    │
          │  files       │    └──────────────────┘  └──────────────┘
          │  file_chunks │
          │  shared_links│
          │  transactions│
          └──────────────┘
```

---

## Database Schema

### `users`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | Firebase UID |
| `email` | TEXT | User's email |
| `display_name` | TEXT | User's display name |
| `photo_url` | TEXT | Profile photo URL or base64 |
| `storage_used` | REAL | Bytes currently used |
| `total_storage` | REAL | Quota — 2GB (free) or 100GB (pro) |
| `created_at` | DATETIME | Account creation timestamp |

### `files`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | UUID |
| `name` | TEXT | Original filename |
| `type` | TEXT | MIME type |
| `size` | REAL | File size in bytes |
| `owner_id` | TEXT | FK → users.id |
| `parent_id` | TEXT | Folder ID (root for top-level) |
| `file_data` | BLOB | Binary data (for small files) |
| `is_starred` | INTEGER | 0 or 1 |
| `is_deleted` | INTEGER | 0 or 1 |
| `is_shared` | INTEGER | 0 or 1 |

### `file_chunks`
| Column | Type | Description |
| :--- | :--- | :--- |
| `file_id` | TEXT | FK → files.id |
| `chunk_index` | INTEGER | Order of the chunk (0, 1, 2…) |
| `data` | BLOB | 2MB binary chunk |

### `shared_links`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | 6-character random code |
| `file_id` | TEXT | FK → files.id |
| `views_allowed` | INTEGER | Max allowed views (null = unlimited) |
| `views_count` | INTEGER | Number of times viewed |
| `can_download` | INTEGER | 0 or 1 |

### `transactions`
| Column | Type | Description |
| :--- | :--- | :--- |
| `transaction_id`| TEXT (PK) | Razorpay payment ID |
| `user_id` | TEXT | FK → users.id |
| `amount` | REAL | Payment amount |
| `status` | TEXT | SUCCESS or FAILED |

---

## Project File Structure

```text
Siphervault/
│
├── server.ts                    ← Express backend — all API routes
├── index.html                   ← Root HTML entry point for Vite
├── vite.config.ts               ← Vite bundler configuration
├── vercel.json                  ← Vercel routing — /api/* → server.ts
├── package.json                 ← Dependencies and scripts
├── tsconfig.json                ← TypeScript compiler config
├── .env                         ← Secret keys (never committed to Git)
├── .env.example                 ← Template showing required env vars
├── .gitignore                   ← Excludes .env, node_modules, dist
├── README.md                    ← Project introduction and setup guide
├── init-db.mjs                  ← Standalone script to initialise DB tables
│
├── src/
│   ├── main.tsx                 ← React app entry point
│   ├── App.tsx                  ← Root component — routing, state, upload logic
│   ├── index.css                ← Global design system — glassmorphism, gradients
│   ├── types.ts                 ← Shared TypeScript interfaces
│   │
│   ├── components/
│   │   ├── LandingPage.tsx      ← Marketing landing page
│   │   ├── LoginScreen.tsx      ← Sign in / Sign up form with Google OAuth
│   │   ├── VerifyEmailScreen.tsx← Email verification prompt
│   │   ├── Navbar.tsx           ← Top navigation bar with search and user menu
│   │   ├── FileCard.tsx         ← Individual file card component in the grid
│   │   ├── FileDetailsView.tsx  ← Full file detail panel
│   │   ├── UploadView.tsx       ← Upload page — file picker and upload queue
│   │   ├── UploadZone.tsx       ← Drag-and-drop zone component
│   │   ├── SecureShareView.tsx  ← UI to generate and configure shareable links
│   │   ├── SharedFileAccessView.tsx ← Public view for shared link access
│   │   ├── RedeemLinkView.tsx   ← UI to enter and redeem a share code
│   │   ├── SettingsView.tsx     ← Profile settings, storage, password
│   │   └── SubscriptionModal.tsx← Razorpay Pro upgrade modal
│   │
│   └── lib/
│       └── firebase.ts          ← Firebase app initialisation
│
└── public/                      ← Static assets served as-is
```

---

## Environment Variables Required
Create a `.env` file in the root of the project with the following variables:

```env
# Turso Database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Firebase (Authentication)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Razorpay (Payments - optional for local dev)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## Summary
Siphervault is a production-grade, full-stack encrypted cloud storage platform. Users log in via Firebase, upload any file type into a personal 2GB vault powered by Turso's edge database, and can share files with anyone via short, controlled-access links — all wrapped in a premium glassmorphic dark UI. 

**Deployment Magic:** Large files are chunked client-side and uploaded in parallel to bypass Vercel serverless limits. Pro users can expand to 100GB via Razorpay. The entire stack — React, Express, Turso, Firebase, Razorpay — is deployed globally on **Vercel** with zero infrastructure to manage.

## 📄 License
© 2026 Siphervault. All rights reserved.
