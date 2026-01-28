import mongoose from "mongoose";

const encryptedPayloadSchema = new mongoose.Schema(
  {
    encryptedMessage: { type: String, required: true },
    encryptedAESKey: { type: String, required: true },
  },
  { _id: false } // 👈 nested object me _id nahi chahiye
);

const messageSchema = new mongoose.Schema(
  {
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },

    /**
     * IMAGE:
     *  - content = image URL
     *
     * TEXT:
     *  - content empty rahega
     */
    content: {
      type: String,
      default: "",
    },

    /**
     * TEXT MESSAGE (HYBRID ENCRYPTED)
     */
    contentForReceiver: {
      type: encryptedPayloadSchema,
      default: null,
    },

    contentForSender: {
      type: encryptedPayloadSchema,
      default: null,
    },

    /**
     * READ / DELETE LOGIC
     */
    readBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],

    isRead: {
      type: Boolean,
      default: false,
    },

    deletedFor: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
  },
  { timestamps: true }
);

// 🔍 Helpful index
messageSchema.index({ chatRoom: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);