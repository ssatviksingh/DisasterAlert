import express from "express";
import ChatMessage from "../models/ChatMessage.js";

const router = express.Router();

// Get messages for an SOS alert
router.get("/:sosId", async (req, res) => {
    try {
        const messages = await ChatMessage.find({ sosId: req.params.sosId })
            .populate("userId", "name role")
            .sort({ createdAt: 1 })
            .lean();
        res.json({ ok: true, messages });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// Post a new message
router.post("/", async (req, res) => {
    try {
        const { sosId, userId, message } = req.body;
        if (!sosId || !userId || !message)
            return res.status(400).json({ ok: false, error: "Missing fields" });

        const msg = await ChatMessage.create({ sosId, userId, message });

        const populated = await msg.populate("userId", "name role");

        // Emit via Socket.IO
        req.app.get("io").emit(`chat:${sosId}`, populated);

        res.json({ ok: true, message: populated });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

export default router;
