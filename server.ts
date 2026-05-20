import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import cors from "cors";
import crypto from "crypto";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Set up Turso Client
let tursoUrl = process.env.TURSO_DATABASE_URL || "file:local.db";
let tursoAuth = process.env.TURSO_AUTH_TOKEN;

// Auto-correct if the user swapped the URL and Auth Token
if (tursoUrl && !tursoUrl.startsWith("libsql://") && !tursoUrl.startsWith("https://") && !tursoUrl.startsWith("http://") && !tursoUrl.startsWith("file:")) {
  if (tursoAuth && (tursoAuth.startsWith("libsql://") || tursoAuth.startsWith("https://"))) {
    console.warn("Notice: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN appear to be swapped. Automatically switching them.");
    const temp = tursoUrl;
    tursoUrl = tursoAuth;
    tursoAuth = temp;
  } else {
    console.warn("Notice: TURSO_DATABASE_URL is invalid (appears to be a JWT or random string). Falling back to local file.");
    tursoUrl = "file:local.db";
  }
}

const db = createClient({
  url: tursoUrl,
  authToken: tursoAuth,
});

async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      display_name TEXT,
      photo_url TEXT,
      storage_used REAL DEFAULT 0,
      total_storage REAL DEFAULT 2147483648,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      size REAL,
      owner_id TEXT,
      parent_id TEXT,
      file_data BLOB,
      is_starred INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      is_shared INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id TEXT PRIMARY KEY,
      user_id TEXT,
      amount REAL,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS shared_links (
      id TEXT PRIMARY KEY,
      file_id TEXT,
      views_allowed INTEGER,
      views_count INTEGER DEFAULT 0,
      can_download INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await db.execute("ALTER TABLE files ADD COLUMN firebase_url TEXT");
  } catch (e) {
    // Column already exists
  }

  // Set default storage limit to 2GB for existing users without successful transactions
  try {
    await db.execute("UPDATE users SET total_storage = 2147483648 WHERE total_storage = 107374182400 AND id NOT IN (SELECT user_id FROM transactions WHERE status = 'SUCCESS')");
  } catch (e) {
    console.error("Migration error:", e);
  }
}

initDb().catch(console.error);

// Razorpay Config
function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!key_id || !key_secret || key_id.includes('YourTestKey')) {
    throw new Error("Razorpay credentials are not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the settings.");
  }
  
  return new Razorpay({ key_id, key_secret });
}

// Multer for handling file uploads in memory for DB insert
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
});

// ==========================================
// API Routes
// ==========================================

app.get("/api/health", async (req, res) => {
  try {
    const result = await db.execute("SELECT CURRENT_TIMESTAMP as now");
    res.json({ status: "ok", db_time: result.rows[0].now, message: "System is healthy" });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Sync User to DB
app.post("/api/users", async (req, res) => {
  try {
    const { id, email, displayName, photoUrl } = req.body;
    if (!id) return res.status(400).json({ error: "Missing user ID" });

    const result = await db.execute({
      sql: `
        INSERT INTO users (id, email, display_name, photo_url)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET 
          email = excluded.email, 
          display_name = COALESCE(users.display_name, excluded.display_name), 
          photo_url = COALESCE(users.photo_url, excluded.photo_url)
        RETURNING *
      `,
      args: [id, email, displayName || null, photoUrl || null]
    });

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, photoUrl } = req.body;
    
    const result = await db.execute({
      sql: `
        UPDATE users 
        SET display_name = ?, photo_url = ?
        WHERE id = ?
        RETURNING *
      `,
      args: [displayName || null, photoUrl || null, id]
    });

    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] });
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({ sql: "DELETE FROM files WHERE owner_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM transactions WHERE user_id = ?", args: [id] });
    const result = await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });
    if (result.rowsAffected === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List Files for user
app.get("/api/files", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const result = await db.execute({ 
      sql: "SELECT id, name, type, size, owner_id, parent_id, firebase_url, is_starred, is_deleted, is_shared, created_at, updated_at FROM files WHERE owner_id = ? ORDER BY created_at DESC", 
      args: [userId as string] 
    });
    
    // Format response to match frontend expectations (camelCase)
    const formattedFiles = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      size: Number(row.size),
      ownerId: row.owner_id,
      parentId: row.parent_id,
      downloadUrl: row.firebase_url ? (row.firebase_url as string) : `/api/files/media?id=${encodeURIComponent(row.id as string)}`,
      firebaseUrl: row.firebase_url,
      isStarred: Boolean(row.is_starred),
      isDeleted: Boolean(row.is_deleted),
      isShared: Boolean(row.is_shared),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({ files: formattedFiles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file metadata to DB (Actual file uploaded directly to Firebase Storage by client)
app.post("/api/files/upload", async (req, res) => {
  try {
    const { userId, parentId, file } = req.body;
    
    if (!file || !file.name || !file.size) return res.status(400).json({ error: "No file metadata provided" });
    if (!userId) return res.status(400).json({ error: "No userId provided" });

    // Validate storage limit
    const userResult = await db.execute({ sql: "SELECT storage_used, total_storage FROM users WHERE id = ?", args: [userId] });
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      if (Number(user.storage_used) + file.size > Number(user.total_storage)) {
        return res.status(400).json({ error: "Storage limit exceeded. Please upgrade your plan." });
      }
    }

    const id = crypto.randomUUID();

    const result = await db.execute({
      sql: `
        INSERT INTO files (id, name, type, size, owner_id, parent_id, firebase_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING id, name, type, size, owner_id, parent_id, firebase_url, is_starred, is_deleted, is_shared, created_at, updated_at
      `, 
      args: [id, file.name, file.type || 'application/octet-stream', file.size, userId, parentId || 'root', file.firebaseUrl || null]
    });

    // Update user storage
    await db.execute({ sql: "UPDATE users SET storage_used = storage_used + ? WHERE id = ?", args: [file.size, userId] });

    const row = result.rows[0];
    const formattedFile = {
      id: row.id,
      name: row.name,
      type: row.type,
      size: Number(row.size),
      ownerId: row.owner_id,
      parentId: row.parent_id,
      downloadUrl: row.firebase_url ? (row.firebase_url as string) : `/api/files/media?id=${encodeURIComponent(row.id as string)}`,
      firebaseUrl: row.firebase_url,
      isStarred: Boolean(row.is_starred),
      isDeleted: Boolean(row.is_deleted),
      isShared: Boolean(row.is_shared),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.json({ message: "File uploaded successfully", file: formattedFile });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update share status
app.patch("/api/files/:id/share", async (req, res) => {
  try {
    const { id } = req.params;
    const { isShared } = req.body;
    await db.execute({ sql: "UPDATE files SET is_shared = ? WHERE id = ?", args: [isShared ? 1 : 0, id] });
    res.json({ message: "Share status updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get download url link
app.get("/api/files/download", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing id" });

    const url = `/api/files/media?id=${encodeURIComponent(id)}`;
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create shared link
app.post("/api/links", async (req, res) => {
  try {
    const { fileId, viewsAllowed, canDownload } = req.body;
    if (!fileId) return res.status(400).json({ error: "Missing fileId" });
    
    // Check if file exists
    const fileResult = await db.execute({ sql: "SELECT id FROM files WHERE id = ?", args: [fileId] });
    if (fileResult.rows.length === 0) return res.status(404).json({ error: "File not found" });

    // Generate short random code (6 chars)
    const linkId = crypto.randomBytes(4).toString("hex").slice(0, 6);
    
    await db.execute({
      sql: `INSERT INTO shared_links (id, file_id, views_allowed, can_download) VALUES (?, ?, ?, ?)`,
      args: [linkId, fileId, viewsAllowed || null, canDownload ? 1 : 0]
    });
    
    res.json({ linkId });
  } catch (error: any) {
    console.error("Create link error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get shared link info and increment view
app.get("/api/links/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const linkResult = await db.execute({ sql: "SELECT * FROM shared_links WHERE id = ?", args: [id] });
    
    if (linkResult.rows.length === 0) return res.status(404).json({ error: "Link not found or expired" });
    const link = linkResult.rows[0];
    
    if (link.views_allowed && (link.views_count as number) >= (link.views_allowed as number)) {
      return res.status(403).json({ error: "This link has reached its maximum view limit." });
    }
    
    // Increment view count
    await db.execute({ sql: "UPDATE shared_links SET views_count = views_count + 1 WHERE id = ?", args: [id] });
    
    // Get file info
    const fileResult = await db.execute({ sql: "SELECT id, name, type, size, created_at FROM files WHERE id = ?", args: [link.file_id as string] });
    if (fileResult.rows.length === 0) return res.status(404).json({ error: "Original file has been deleted." });
    const file = fileResult.rows[0];
    
    res.json({
      id: link.id,
      fileId: file.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      canDownload: Boolean(link.can_download),
      downloadUrl: `/api/files/media?id=${encodeURIComponent(file.id as string)}&linkId=${encodeURIComponent(link.id as string)}`
    });
  } catch (error: any) {
    console.error("Get link error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Download/Stream file directly
app.get("/api/files/media", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing id parameter" });

    const result = await db.execute({ sql: "SELECT file_data, firebase_url, type FROM files WHERE id = ?", args: [id] });
    
    if (result.rows.length === 0) return res.status(404).json({ error: "File not found" });

    const file = result.rows[0];
    
    if (file.firebase_url) {
      return res.redirect(file.firebase_url as string);
    }
    
    if (!file.file_data) {
       return res.status(404).json({ error: "File data is empty" });
    }
    
    const buffer = file.file_data as ArrayBuffer;
    
    res.setHeader('Content-Type', file.type as string);
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single file
app.get("/api/files/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.execute({ sql: "SELECT id, name, type, size, owner_id, parent_id, firebase_url, is_starred, is_deleted, is_shared, created_at, updated_at FROM files WHERE id = ?", args: [id] });
    
    if (result.rows.length === 0) return res.status(404).json({ error: "File not found" });
    
    const row = result.rows[0];
    const formattedFile = {
      id: row.id,
      name: row.name,
      type: row.type,
      size: Number(row.size),
      ownerId: row.owner_id,
      parentId: row.parent_id,
      downloadUrl: row.firebase_url ? (row.firebase_url as string) : `/api/files/media?id=${encodeURIComponent(row.id as string)}`,
      firebaseUrl: row.firebase_url,
      isStarred: Boolean(row.is_starred),
      isDeleted: Boolean(row.is_deleted),
      isShared: Boolean(row.is_shared),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.json(formattedFile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file
app.delete("/api/files/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get file info first
    const fileResult = await db.execute({ sql: "SELECT * FROM files WHERE id = ?", args: [id] });
    if (fileResult.rows.length === 0) return res.status(404).json({ error: "File not found" });
    
    const file = fileResult.rows[0];

    // Delete from DB
    await db.execute({ sql: "DELETE FROM files WHERE id = ?", args: [id] });
    
    // Update user storage
    await db.execute({ sql: "UPDATE users SET storage_used = MAX(0, storage_used - ?) WHERE id = ?", args: [file.size, file.owner_id] });
    
    res.json({ message: "File deleted successfully" });
  } catch (error: any) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Razorpay API endpoints
app.post("/api/payments/create-razorpay-subscription", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_ID.includes('YourTestKey')) {
      const mockSubId = "sub_mock_" + Date.now();
      await db.execute({
        sql: "INSERT INTO transactions (transaction_id, user_id, amount, status) VALUES (?, ?, ?, 'PENDING')",
        args: [mockSubId, userId, 99.00]
      });
      return res.json({
        isMock: true,
        subscriptionId: mockSubId,
        amount: 9900,
        currency: "INR",
        keyId: "mock_key"
      });
    }

    let planId = null;
    const razorpay = getRazorpay();
    const plansResponse = await razorpay.plans.all();
    const existingPlan = plansResponse.items.find(
      (p: any) => p.item.name === "SipherVault Pro Monthly" && p.item.amount === 9900
    );

    if (existingPlan) {
      planId = existingPlan.id;
    } else {
      const plan = await razorpay.plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name: "SipherVault Pro Monthly",
          amount: 9900,
          currency: "INR",
          description: "Monthly subscription for SipherVault Pro with 100GB storage"
        }
      });
      planId = plan.id;
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120 
    });

    await db.execute({
      sql: "INSERT INTO transactions (transaction_id, user_id, amount, status) VALUES (?, ?, ?, 'PENDING')",
      args: [subscription.id, userId, 99.00]
    });

    res.json({
      subscriptionId: subscription.id,
      amount: 9900,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error: any) {
    console.error("Razorpay subscription creation error:", error);
    res.status(500).json({ error: error?.error?.description || error?.message || "Razorpay API error", details: error });
  }
});

app.post("/api/payments/verify-razorpay-subscription", async (req, res) => {
  try {
    const { userId, razorpay_subscription_id, razorpay_payment_id, razorpay_signature, isMock } = req.body;

    if (isMock || razorpay_subscription_id?.startsWith('sub_mock_')) {
      await db.execute({ sql: "UPDATE transactions SET status = 'SUCCESS' WHERE transaction_id = ?", args: [razorpay_subscription_id] });
      await db.execute({ sql: "UPDATE users SET total_storage = 107374182400 WHERE id = ?", args: [userId] });
      return res.json({ success: true, message: "Mock Subscription verified successfully" });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
        throw new Error("Razorpay secret not configured.");
    }

    const sign = razorpay_payment_id + "|" + razorpay_subscription_id;
    const expectedSign = crypto
      .createHmac("sha256", key_secret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      await db.execute({ sql: "UPDATE transactions SET status = 'SUCCESS' WHERE transaction_id = ?", args: [razorpay_subscription_id] });
      await db.execute({ sql: "UPDATE users SET total_storage = 107374182400 WHERE id = ?", args: [userId] });
      res.json({ success: true, message: "Subscription verified successfully" });
    } else {
      await db.execute({ sql: "UPDATE transactions SET status = 'FAILED' WHERE transaction_id = ?", args: [razorpay_subscription_id] });
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// Vite Integration
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite HM(R disabled in platform) and middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode serving static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
