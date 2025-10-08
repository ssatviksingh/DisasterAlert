import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: { type: String },
        email: { type: String, unique: true, sparse: true },
        password: { type: String }, // (optional if using auth)
        expoPushToken: { type: String },

        // NEW FIELD: user role
        role: {
            type: String,
            enum: ["admin", "responder", "citizen"],
            default: "citizen",
        },

        // GeoJSON for location
        location: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: { type: [Number], default: undefined }, // [lon, lat]
        },
    },
    { timestamps: true }
);

// Geo index for nearby queries
UserSchema.index({ location: "2dsphere" });

export default mongoose.model("User", UserSchema);
