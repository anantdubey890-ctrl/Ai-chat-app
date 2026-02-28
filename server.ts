import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // DB Setup
  const db = new Database("chat.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, 
      name TEXT, 
      phoneNumber TEXT, 
      photoURL TEXT, 
      status TEXT, 
      personalityMode TEXT, 
      autoReplyEnabled INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY, 
      participants TEXT, 
      updatedAt INTEGER, 
      lastMessage TEXT, 
      autoReplyEnabled TEXT
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, 
      chatId TEXT, 
      senderId TEXT, 
      receiverId TEXT, 
      text TEXT, 
      type TEXT, 
      timestamp INTEGER, 
      status TEXT
    );
  `);

  // API Routes
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.post("/api/login", (req, res) => {
    const { id, name, phoneNumber, photoURL, status, personalityMode } = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO users (id, name, phoneNumber, photoURL, status, personalityMode) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, phoneNumber, photoURL, status, personalityMode);
    res.json({ success: true });
  });

  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  });

  app.get("/api/chats/:userId", (req, res) => {
    const userId = req.params.userId;
    const allChats = db.prepare("SELECT * FROM chats").all();
    const userChats = allChats.filter((c: any) => {
      const participants = JSON.parse(c.participants);
      return participants.includes(userId);
    });
    
    res.json(userChats.map((c: any) => ({
      ...c,
      participants: JSON.parse(c.participants),
      lastMessage: c.lastMessage ? JSON.parse(c.lastMessage) : null,
      autoReplyEnabled: c.autoReplyEnabled ? JSON.parse(c.autoReplyEnabled) : {}
    })));
  });

  app.get("/api/messages/:chatId", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC").all(req.params.chatId);
    res.json(messages);
  });

  app.post("/api/chats", (req, res) => {
    const { participants } = req.body;
    // Check if chat already exists between these participants
    const existingChats = db.prepare("SELECT * FROM chats").all();
    const existing = existingChats.find((c: any) => {
      const p = JSON.parse(c.participants);
      return p.length === participants.length && p.every((val: string) => participants.includes(val));
    });

    if (existing) {
      const e = existing as any;
      return res.json({
        ...e,
        participants: JSON.parse(e.participants),
        lastMessage: e.lastMessage ? JSON.parse(e.lastMessage) : null,
        autoReplyEnabled: e.autoReplyEnabled ? JSON.parse(e.autoReplyEnabled) : {}
      });
    }

    const id = `chat-${Date.now()}`;
    const updatedAt = Date.now();
    db.prepare("INSERT INTO chats (id, participants, updatedAt, autoReplyEnabled) VALUES (?, ?, ?, ?)").run(
      id, 
      JSON.stringify(participants), 
      updatedAt, 
      JSON.stringify({})
    );
    res.json({ id, participants, updatedAt, autoReplyEnabled: {} });
  });

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    });

    socket.on("sendMessage", (data) => {
      const { chatId, senderId, receiverId, text, type } = data;
      const msgId = `msg-${Date.now()}`;
      const timestamp = Date.now();
      const status = "sent";

      // Save message
      db.prepare(`
        INSERT INTO messages (id, chatId, senderId, receiverId, text, type, timestamp, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(msgId, chatId, senderId, receiverId, text, type, timestamp, status);

      const message = { id: msgId, chatId, senderId, receiverId, text, type, timestamp, status };

      // Update chat last message
      db.prepare("UPDATE chats SET lastMessage = ?, updatedAt = ? WHERE id = ?").run(
        JSON.stringify(message),
        timestamp,
        chatId
      );

      // Broadcast to chat room
      io.to(chatId).emit("message", message);
    });

    socket.on("toggleAutoReply", (data) => {
      const { chatId, userId, enabled } = data;
      const chat: any = db.prepare("SELECT * FROM chats WHERE id = ?").get(chatId);
      if (chat) {
        const autoReply = JSON.parse(chat.autoReplyEnabled || "{}");
        autoReply[userId] = enabled;
        db.prepare("UPDATE chats SET autoReplyEnabled = ? WHERE id = ?").run(
          JSON.stringify(autoReply),
          chatId
        );
        io.to(chatId).emit("autoReplyStatus", { chatId, userId, enabled });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite / Static
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
