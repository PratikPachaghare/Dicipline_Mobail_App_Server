import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["text", "image"], default: "text" },
    content: { type: String, default: "" }, // Text message or Image URL
    contentForReceiver: { type: String }, // Friend ki key se lock
    contentForSender:   { type: String }, // Khud ki key se lock
    imageUrl: { type: String, default: "" }, // Specific field for images
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isRead: { 
    type: Boolean, 
    default: false 
    },
    deletedFor: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],
  },
  { timestamps: true }
);

messageSchema.index({ chatRoom: 1, sender: 1, isRead: 1 });

export const Message = mongoose.model("Message", messageSchema);