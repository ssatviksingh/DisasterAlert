import express from "express";
import http from "http";
import { Server as SocketServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import sosRouter from "./routes/sos.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.set("io", io);

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// Routes
app.use("/sos", sosRouter);

io.on("connection", socket => {
    console.log("✅ Socket connected:", socket.id);
});

const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/disaster";
mongoose.connect(MONGO)
    .then(() => {
        console.log("✅ Mongo connected");
        const PORT = process.env.PORT || 4000;
        server.listen(PORT, () => console.log("🚀 Server running on port", PORT));
    })
    .catch(err => console.error("❌ Mongo error:", err));
