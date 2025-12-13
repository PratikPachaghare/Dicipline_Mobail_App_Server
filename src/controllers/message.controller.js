import { Message } from "../models/message.model.js";
import { ChatRoom } from "../models/chatRoom.model.js";

/*
  Send message (text / image snap)
*/
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatRoomId, text, mediaUrl, messageType } = req.body;

    if (!chatRoomId) {
      return res.status(400).json({ message: "chatRoomId required" });
    }

    const message = await Message.create({
      chatRoom: chatRoomId,
      sender: userId,
      text,
      mediaUrl, // image snap url (Cloudinary/S3)
      messageType: messageType || "text",
      expireAt: messageType === "image"
        ? new Date(Date.now() + 24 * 60 * 60 * 1000) // snap auto delete
        : null,
    });

    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      lastMessage: message._id,
    });

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/*
  Get messages of a chat room
*/
export const getMessages = async (req, res) => {
  try {
    const { chatRoomId } = req.params;

    const messages = await Message.find({ chatRoom: chatRoomId })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
