import mongoose from "mongoose";
const { Schema } = mongoose;

const ChatMessageSchema = new Schema(
    {
        sosId: { type: mongoose.Schema.Types.ObjectId, ref: "SosRequest", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true },
    },
    { timestamps: true }
);

export default mongoose.model("ChatMessage", ChatMessageSchema);
