import mongoose from "mongoose";
const { Schema } = mongoose;

const SosSchema = new Schema({
    title: String,
    description: String,
    location: {
        type: { type: String, default: "Point" },
        coordinates: [Number], // [longitude, latitude]
    },
    status: { type: String, default: "pending" },
    created_at: { type: Date, default: Date.now }
});

SosSchema.index({ location: "2dsphere" });

export default mongoose.model("SosRequest", SosSchema);
