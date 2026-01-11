import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["text", "image"], default: "text" },
    content: { type: String, default: "" }, // Text message or Image URL
    imageUrl: { type: String, default: "" }, // Specific field for images
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);