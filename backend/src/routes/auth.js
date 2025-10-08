import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "sos_secret_key";

/**
 * REGISTER new user
 */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, location } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ ok: false, error: "All fields required" });

        const existing = await User.findOne({ email });
        if (existing)
            return res.status(400).json({ ok: false, error: "User already exists" });

        const hashed = await bcrypt.hash(password, 10);

        const userLocation =
            location && Array.isArray(location.coordinates)
                ? {
                    type: "Point",
                    coordinates: [
                        Number(location.coordinates[0]),
                        Number(location.coordinates[1]),
                    ],
                }
                : { type: "Point", coordinates: [0, 0] };

        const user = await User.create({
            name,
            email,
            password: hashed,
            location: userLocation,
        });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        res.json({
            ok: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                location: user.location,
            },
            token,
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * LOGIN existing user
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user)
            return res.status(404).json({ ok: false, error: "User not found" });

        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(401).json({ ok: false, error: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        res.json({
            ok: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                location: user.location,
            },
            token,
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * VERIFY TOKEN & RETURN USER INFO
 */
router.get("/me", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ ok: false, error: "No token" });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) return res.status(404).json({ ok: false, error: "User not found" });

        res.json({ ok: true, user });
    } catch (err) {
        res.status(401).json({ ok: false, error: "Invalid token" });
    }
});

export default router;
