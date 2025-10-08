// backend/src/models/SosRequest.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const SosSchema = new Schema(
    {
        title: { type: String, default: "SOS Alert" },
        description: { type: String, default: "" },
        location: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: { type: [Number], required: true }, // [lon, lat]
        },
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
        status: { type: String, default: "pending" },
        severity: {
            type: String,
            enum: ["Critical", "High", "Medium", "Low"],
            default: "Medium",
        },

        // New fields to support scheduled reminders
        reminderCount: { type: Number, default: 0 },
        lastReminderAt: { type: Date, default: null },

        // Optional: user who raised the SOS
        userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true } // adds createdAt & updatedAt
);

SosSchema.index({ location: "2dsphere" });

export default mongoose.model("SosRequest", SosSchema);
