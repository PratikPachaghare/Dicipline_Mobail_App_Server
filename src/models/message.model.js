import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    messageType: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },

    text: {
      type: String,
      trim: true,
    },

    mediaUrl: {
      type: String, // Cloudinary / S3 URL
    },

    isSeen: {
      type: Boolean,
      default: false,
    },

    expireAt: {
      type: Date, // 👈 Snapchat style auto-delete
    },
  },
  { timestamps: true }
);

/* Auto delete snap messages */
messageSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const Message = mongoose.model("Message", messageSchema);
