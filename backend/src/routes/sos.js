// backend/src/routes/sos.js
import express from "express";
import SosModel from "../models/SosRequest.js";
import User from "../models/User.js";
import { sendPushNotification } from "../utils/notify.js";
const router = express.Router();

/**
 * POST /sos
 * Body: { title, description, location: { coordinates: [lon, lat] }, severity, userId, notifyRadiusMeters? }
 *
 * - Saves SOS with lat/lon
 * - Emits `sos:new`
 * - Notifies nearby users within notifyRadiusMeters (default 5000m)
 */
router.post("/", async (req, res) => {
    try {
        const { title, description, location, severity = "Medium", userId, notifyRadiusMeters } = req.body;

        if (!location || !Array.isArray(location.coordinates) || location.coordinates.length < 2) {
            return res.status(400).json({ ok: false, error: "Invalid location" });
        }

        const lon = Number(location.coordinates[0]);
        const lat = Number(location.coordinates[1]);

        if (Number.isNaN(lon) || Number.isNaN(lat)) {
            return res.status(400).json({ ok: false, error: "Invalid numeric coordinates" });
        }

        const sos = await SosModel.create({
            title,
            description,
            severity,
            location: { type: "Point", coordinates: [lon, lat] },
            lat,
            lon,
            userId: userId || null,
        });

        // Emit socket event for realtime clients
        req.app.get("io").emit("sos:new", sos);

        // Notify nearby users
        const RADIUS_METERS = typeof notifyRadiusMeters === "number" ? notifyRadiusMeters : 5000;

        // Query users within radius who have expoPushToken
        const nearbyUsers = await User.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [lon, lat] },
                    $maxDistance: RADIUS_METERS,
                },
            },
            expoPushToken: { $exists: true, $ne: null },
        });

        console.log(`📡 notify: found ${nearbyUsers.length} nearby users (radius ${RADIUS_METERS}m)`);

        // Exclude the sender (if a userId is provided and present in nearbyUsers)
        const targets = nearbyUsers.filter(u => !userId || String(u._id) !== String(userId));

        // send push notifications in parallel (limit or queue in production)
        await Promise.all(
            targets.map((u) =>
                sendPushNotification(
                    u.expoPushToken,
                    `🚨 ${severity} SOS nearby: ${title || "SOS"}`,
                    { sosId: sos._id, severity, latitude: lat, longitude: lon }
                )
            )
        );

        res.status(201).json({ ok: true, sos });
    } catch (err) {
        console.error("POST /sos error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * GET /sos
 * Returns latest SOS list (basic)
 */
router.get("/", async (req, res) => {
    try {
        const sosList = await SosModel.find().sort({ createdAt: -1 }).lean();
        res.json({ ok: true, sos: sosList });
    } catch (err) {
        console.error("GET /sos error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * GET /sos/:id
 */
router.get("/:id", async (req, res) => {
    try {
        const sos = await SosModel.findById(req.params.id).lean();
        if (!sos) return res.status(404).json({ ok: false, error: "SOS not found" });
        res.json({ ok: true, sos });
    } catch (err) {
        console.error("GET /sos/:id error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * DELETE /sos/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await SosModel.findByIdAndDelete(id);
        req.app.get("io").emit("removeSOS", { _id: id });
        res.json({ ok: true });
    } catch (err) {
        console.error("DELETE /sos/:id error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * POST /sos/filter
 * Body: {
 *   center?: { coordinates: [lon, lat] },
 *   radiusMeters?: number,
 *   severity?: "Critical" | "High" | "Medium" | "Low" | "All",
 *   from?: ISODateString,
 *   to?: ISODateString,
 *   limit?: number
 * }
 *
 * Returns filtered SOS list.
 */
router.post("/filter", async (req, res) => {
    try {
        const { center, radiusMeters = 5000, severity = "All", from, to, limit = 50 } = req.body;

        const query = {};

        // time range
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        // severity
        if (severity && severity !== "All") {
            query.severity = severity;
        }

        // geo
        if (center && Array.isArray(center.coordinates) && center.coordinates.length >= 2) {
            const lon = Number(center.coordinates[0]);
            const lat = Number(center.coordinates[1]);
            query.location = {
                $near: {
                    $geometry: { type: "Point", coordinates: [lon, lat] },
                    $maxDistance: Number(radiusMeters),
                },
            };
        }

        const sosList = await SosModel.find(query).sort({ createdAt: -1 }).limit(Number(limit)).lean();
        res.json({ ok: true, sos: sosList });
    } catch (err) {
        console.error("POST /sos/filter error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

export default router;
