// backend/src/routes/token.js
import express from "express";
import User from "../models/User.js";

const router = express.Router();

/**
 * POST /token/register
 * Body: { userId, expoPushToken, location?: { coordinates: [lon, lat] }, name?, email? }
 *
 * - Saves or updates the user's expoPushToken and optional location.
 * - If userId exists, updates that user. If not found, creates a user doc with provided userId (useful for quick testing).
 */
router.post("/register", async (req, res) => {
    try {
        const { userId, expoPushToken, location, name, email } = req.body;

        if (!expoPushToken) {
            return res.status(400).json({ ok: false, error: "expoPushToken required" });
        }

        if (!userId) {
            // If you don't have auth yet, create a lightweight user doc so token can be associated
            const newUser = await User.create({
                name: name || "Anonymous",
                email: email || undefined,
                expoPushToken,
                location: location && Array.isArray(location.coordinates) ? { type: "Point", coordinates: location.coordinates } : undefined,
            });
            return res.json({ ok: true, user: newUser });
        }

        // Update existing user or create if not exist (upsert)
        const update = {
            expoPushToken,
        };

        if (location && Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
            update.location = { type: "Point", coordinates: location.coordinates.map(Number) };
        }

        if (name) update.name = name;
        if (email) update.email = email;

        const user = await User.findOneAndUpdate(
            { _id: userId },
            { $set: update },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({ ok: true, user });
    } catch (err) {
        console.error("POST /token/register error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

export default router;
