import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import connectDB from "./config/db.js";

import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const httpServer = createServer(app);

// ─── WebSocket Server ─────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server: httpServer });

// Store all connected admin clients
const adminClients = new Set();

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");
  adminClients.add(ws);

  ws.on("close", () => {
    adminClients.delete(ws);
    console.log("WebSocket client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
    adminClients.delete(ws);
  });

  // Send welcome ping
  ws.send(JSON.stringify({ type: "connected", message: "WebSocket connected to CraveGrid server" }));
});

// Broadcast helper — call this to push events to all connected admins
export const broadcast = (eventType, payload) => {
  const message = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
  for (const client of adminClients) {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(message);
    }
  }
};

// ─── Express Middleware ───────────────────────────────────────────────────────
connectDB();
app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(5000, () => {
  console.log("Server running on port 5000  (HTTP + WebSocket)");
});