import { ChatRoom } from "../models/chatRoom.model.js";

/*
  Get or create 1-to-1 chat room
*/
export const getOrCreateChatRoom = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ message: "friendId required" });
    }

    // check existing room
    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [userId, friendId] },
      isGroup: false,
    });

    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        participants: [userId, friendId],
      });
    }

    res.json(chatRoom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/*
  Chat list (friend list)
*/
export const getChatList = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await ChatRoom.find({
      participants: userId,
    })
      .populate("participants", "name avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
