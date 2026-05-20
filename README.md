# SipherVault 🔒

SipherVault is a modern, high-performance, and secure cloud storage web application. It allows users to upload, manage, and share their files with ease. Built with a scalable architecture, SipherVault is designed to handle extremely large file uploads flawlessly, making it perfect for both personal and professional use.

## Features ✨
- **Direct-to-Cloud Uploads**: Upload files of any size (1GB+) directly to Firebase Storage without hitting server payload limits.
- **Lightning Fast**: Built on Vite and React for a blazing-fast user experience.
- **Secure File Sharing**: Generate secure, view-limited shareable links for your files.
- **Smart Storage Limits**: Enforces a 2GB free tier, with a premium subscription integration (Razorpay) for 100GB Pro plans.
- **Vercel Ready**: The backend is highly optimized for serverless environments with a unified `vercel.json` configuration.

## Tech Stack 🛠️
- **Frontend**: React 19, Vite, TailwindCSS (v4), Framer Motion, Lucide React
- **Backend**: Express.js, TypeScript, Node.js
- **Database**: Turso (LibSQL) for ultra-fast metadata storage
- **Storage & Auth**: Firebase (Authentication and Storage)
- **Payments**: Razorpay

## Quick Start 🚀

### 1. Clone the repository
```bash
git clone https://github.com/Chayapathi077/Siphervault.git
cd Siphervault
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (you can copy from `.env.example`).
Make sure to add your actual secret keys in `.env` (this file is git-ignored and will not be pushed).

```env
TURSO_DATABASE_URL="libsql://your-database-name.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"
RAZORPAY_KEY_ID="your_razorpay_key"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
```

> **Note**: The Firebase configuration is intentionally placed inside `firebase-applet-config.json`. These are public client-side identifiers and are safe to be exposed.

### 4. Run Locally
```bash
npm run dev
```
The application will start, serving both the Express API and the Vite frontend simultaneously.

## Deployment 🌍
This project is fully configured to be deployed on **Vercel**.
1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add your Environment Variables (from `.env`) in the Vercel Dashboard.
4. Deploy! The `vercel.json` file handles all the API routing routing automatically.
