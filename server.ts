import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import Database from "better-sqlite3";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("Server starting...");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

// DB Setup
let db: any;
try {
  db = new Database("chat.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, phoneNumber TEXT, photoURL TEXT, status TEXT, personalityMode TEXT, autoReplyEnabled INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS chats (id TEXT PRIMARY KEY, participants TEXT, updatedAt INTEGER, lastMessage TEXT, autoReplyEnabled TEXT);
    CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, chatId TEXT, senderId TEXT, receiverId TEXT, text TEXT, type TEXT, timestamp INTEGER, status TEXT);
  `);
  console.log("DB Initialized");
} catch (e) {
  console.error("DB Error", e);
}

// Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/test", (req, res) => res.send("Server is working"));

app.post("/api/login", (req, res) => {
  const { id, name, phoneNumber, photoURL, status, personalityMode } = req.body;
  db.prepare("INSERT OR REPLACE INTO users (id, name, phoneNumber, photoURL, status, personalityMode) VALUES (?, ?, ?, ?, ?, ?)").run(id, name, phoneNumber, photoURL, status, personalityMode);
  res.json({ success: true });
});

app.get("/api/users", (req, res) => res.json(db.prepare("SELECT * FROM users").all()));

app.get("/api/chats/:userId", (req, res) => {
  const chats = db.prepare("SELECT * FROM chats WHERE participants LIKE ?").all(`%${req.params.userId}%`);
  res.json(chats.map((c: any) => ({
    ...c,
    participants: JSON.parse(c.participants),
    lastMessage: c.lastMessage ? JSON.parse(c.lastMessage) : null,
    autoReplyEnabled: c.autoReplyEnabled ? JSON.parse(c.autoReplyEnabled) : {}
  })));
});

app.get("/api/messages/:chatId", (req, res) => res.json(db.prepare("SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC").all(req.params.chatId)));

app.post("/api/chats", (req, res) => {
  const { participants } = req.body;
  const id = `chat-${Date.now()}`;
  const updatedAt = Date.now();
  db.prepare("INSERT INTO chats (id, participants, updatedAt, autoReplyEnabled) VALUES (?, ?, ?, ?)").run(id, JSON.stringify(participants), updatedAt, JSON.stringify({}));
  res.json({ id, participants, updatedAt });
});

// Sockets
io.on("connection", (socket) => {
  socket.on("join", (id) => socket.join(id));
  socket.on("sendMessage", (data) => {
    const { chatId, senderId, receiverId, text, type } = data;
    const id = `msg-${Date.now()}`;
    const timestamp = Date.now();
    db.prepare("INSERT INTO messages (id, chatId, senderId, receiverId, text, type, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, chatId, senderId, receiverId, text, type, timestamp, "sent");
    db.prepare("UPDATE chats SET lastMessage = ?, updatedAt = ? WHERE id = ?").run(JSON.stringify({ id, senderId, receiverId, text, type, timestamp, status: "sent" }), timestamp, chatId);
    io.to(chatId).emit("message", { id, chatId, senderId, receiverId, text, type, timestamp, status: "sent" });
  });
});

// Vite / Static
const distPath = join(__dirname, "dist");
if (process.env.VITE_DEV === "true") {
  console.log("Dev Mode");
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
} else {
  console.log("Prod Mode");
  app.use(express.static(distPath));
  app.get("*", (req, res) => res.sendFile(join(distPath, "index.html")));
}

httpServer.listen(3000, "0.0.0.0", () => console.log("Listening on 3000"));
