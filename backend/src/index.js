// backend/index.js
import express from "express";
import http from "http";
import { Server as SocketServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";

import sosRouter from "./routes/sos.js";
import tokenRouter from "./routes/token.js";
import notifyRouter from "./routes/notify.js";

import SosModel from "./models/SosRequest.js";
import User from "./models/User.js";
import chatRouter from "./routes/chat.js";
import authRouter from "./routes/auth.js";

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
app.use("/token", tokenRouter);
app.use("/notify", notifyRouter);
app.use("/chat", chatRouter);
app.use("/auth", authRouter);

io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);
});

const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/disaster";
mongoose
    .connect(MONGO)
    .then(() => {
        console.log("✅ Mongo connected");
        const PORT = process.env.PORT || 4000;
        server.listen(PORT, () => console.log("🚀 Server running on port", PORT));

        // Start cron jobs AFTER DB is connected
        startCronJobs();
    })
    .catch((err) => console.error("❌ Mongo error:", err));

/**
 * Cron jobs
 * - Reminder job: runs every minute (customize) and sends reminders for pending SOS older than threshold.
 * - NOTE: In production prefer a queue/worker and more robust scheduling (this is a simple approach).
 */
function startCronJobs() {
    // Run every minute
    cron.schedule("* * * * *", async () => {
        try {
            console.log("⏱️ Running SOS reminder job");

            // configuration (you can move to env)
            const REMINDER_THRESHOLD_MINUTES = Number(process.env.REMINDER_THRESHOLD_MINUTES || 15); // send reminders for SOS older than this
            const REMINDER_MAX_PER_SOS = Number(process.env.REMINDER_MAX_PER_SOS || 3);
            const RADIUS_METERS = Number(process.env.REMINDER_RADIUS_METERS || 5000);

            const cutoff = new Date(Date.now() - REMINDER_THRESHOLD_MINUTES * 60 * 1000);

            // find pending SOS older than threshold and not exceeded reminder max
            const sosList = await SosModel.find({
                status: "pending",
                createdAt: { $lte: cutoff },
                $or: [{ reminderCount: { $lt: REMINDER_MAX_PER_SOS } }, { reminderCount: { $exists: false } }],
            }).lean();

            console.log(`🔔 Found ${sosList.length} SOS to consider for reminder`);

            for (const sos of sosList) {
                const lon = sos.location?.coordinates?.[0];
                const lat = sos.location?.coordinates?.[1];
                if (lon == null || lat == null) continue;

                // find nearby users (exclude the issuer if possible)
                const users = await User.find({
                    location: { $near: { $geometry: { type: "Point", coordinates: [lon, lat] }, $maxDistance: RADIUS_METERS } },
                    expoPushToken: { $exists: true, $ne: null },
                }).lean();

                const tokens = users.map((u) => u.expoPushToken).filter(Boolean);
                if (tokens.length === 0) {
                    // still update reminderCount so we don't retry forever
                    await SosModel.findByIdAndUpdate(sos._id, { $inc: { reminderCount: 1 }, lastReminderAt: new Date() });
                    continue;
                }

                const message = `⏳ Reminder: ${sos.title || "SOS"} needs attention (severity: ${sos.severity || "N/A"})`;
                await sendPushNotifications(tokens, message, { sosId: sos._id, severity: sos.severity });

                // update reminder count & lastReminderAt
                await SosModel.findByIdAndUpdate(sos._id, { $inc: { reminderCount: 1 }, lastReminderAt: new Date() });

                console.log(`🔔 Sent reminder for SOS ${sos._id} to ${tokens.length} users`);
            }
        } catch (err) {
            console.error("Cron job error:", err);
        }
    });
}
