import express from "express";
import SosModel from "../models/SosRequest.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { title, description, location } = req.body;
        const sos = await SosModel.create({ title, description, location });

        // emit real-time event
        req.app.get("io").emit("sos:new", sos);

        res.status(201).json({ ok: true, sos });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

export default router;
