import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Messages",
    },

    unreadCount: {
      type: Map,
      of: Number, // userId -> unread count
      default: {},
    },
  },
  { timestamps: true }
);

export const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);
