// backend/src/routes/notify.js
import express from "express";
import User from "../models/User.js";
import SosModel from "../models/SosRequest.js";
import { sendPushNotifications } from "../utils/notify.js";

const router = express.Router();

/**
 * POST /notify/broadcast
 * Body: { title?, message, filter?: { region?: { coordinates: [lon,lat], radiusMeters } } }
 * - if filter.region provided, only notify users in that radius; otherwise notify all users with expoPushToken
 */
router.post("/broadcast", async (req, res) => {
    try {
        const { message, region } = req.body;
        if (!message) return res.status(400).json({ ok: false, error: "message required" });

        let users;

        if (region && region.coordinates && region.coordinates.length >= 2 && region.radiusMeters) {
            const [lon, lat] = region.coordinates.map(Number);
            users = await User.find({
                location: { $near: { $geometry: { type: "Point", coordinates: [lon, lat] }, $maxDistance: Number(region.radiusMeters) } },
                expoPushToken: { $exists: true, $ne: null },
            }).lean();
        } else {
            users = await User.find({ expoPushToken: { $exists: true, $ne: null } }).lean();
        }

        const tokens = users.map((u) => u.expoPushToken).filter(Boolean);
        await sendPushNotifications(tokens, message, { type: "BROADCAST" });

        res.json({ ok: true, notified: tokens.length });
    } catch (err) {
        console.error("POST /notify/broadcast error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * POST /notify/nearby
 * Body: { sosId?, coordinates?: [lon, lat], radiusMeters?: number, message? }
 * - If sosId provided, looks up SOS coordinates. If coordinates provided uses those.
 * - Notifies users within radius.
 */
router.post("/nearby", async (req, res) => {
    try {
        const { sosId, coordinates, radiusMeters = 5000, message } = req.body;

        let lon, lat;
        if (sosId) {
            const sos = await SosModel.findById(sosId).lean();
            if (!sos) return res.status(404).json({ ok: false, error: "SOS not found" });
            lon = sos.location?.coordinates?.[0];
            lat = sos.location?.coordinates?.[1];
        } else if (Array.isArray(coordinates) && coordinates.length >= 2) {
            lon = Number(coordinates[0]);
            lat = Number(coordinates[1]);
        } else {
            return res.status(400).json({ ok: false, error: "sosId or coordinates required" });
        }

        const users = await User.find({
            location: { $near: { $geometry: { type: "Point", coordinates: [lon, lat] }, $maxDistance: Number(radiusMeters) } },
            expoPushToken: { $exists: true, $ne: null },
        }).lean();

        const tokens = users.map((u) => u.expoPushToken).filter(Boolean);
        const msg = message || `🚨 Alert nearby (${Math.round(radiusMeters)}m)`;
        await sendPushNotifications(tokens, msg, { type: "NEARBY", lon, lat });

        res.json({ ok: true, notified: tokens.length });
    } catch (err) {
        console.error("POST /notify/nearby error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

export default router;
