import { ChatRoom } from "../models/chatRoom.model.js";
import { Message } from "../models/message.model.js";
import { uploadOnCloudinery } from "../utils/coudnary.js";

/* =====================================================
   1️⃣ GET MESSAGES
===================================================== */
export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const myId = req.user._id.toString();
    const { page = 1, limit = 30 } = req.query;

    const messages = await Message.find({
      chatRoom: roomId,
      deletedFor: { $ne: myId }
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("sender", "name avatar");

    // 🔐 Decide content on server itself
    const projectedMessages = messages.map((msg) => {
      const obj = msg.toObject();
      const isMe = obj.sender._id.toString() === myId;

      if (obj.type === "text") {
        obj.content = isMe
          ? obj.contentForSender
          : obj.contentForReceiver;
      }

      return obj;
    });

    res.json(projectedMessages);
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   2️⃣ SEND MESSAGE (DOUBLE ENCRYPTION)
===================================================== */
export const sendMessage = async (req, res) => {
  try {
    const roomId = req.params.roomId || req.body.chatRoomId;
    const senderId = req.user._id;

    let { contentForReceiver, contentForSender, type = "text" } = req.body;
    let finalContent = "";

    // 🖼️ IMAGE HANDLING
    if (req.file) {
      const upload = await uploadOnCloudinery(req.file.path);
      if (!upload) {
        return res.status(500).json({ message: "Image upload failed" });
      }
      finalContent = upload.secure_url;
      type = "image";
    }

    // 🔴 VALIDATION
    if (
      type === "text" &&
      (!contentForReceiver || !contentForSender)
    ) {
      return res.status(400).json({ message: "Encrypted content missing" });
    }

    // 🧾 CREATE MESSAGE
    const newMessage = await Message.create({
      chatRoom: roomId,
      sender: senderId,
      type,
      content: type === "image" ? finalContent : "",
      contentForReceiver: type === "text" ? contentForReceiver : null,
      contentForSender: type === "text" ? contentForSender : null,
      deletedFor: [],
      isRead: false
    });

    await newMessage.populate("sender", "name avatar");

    // 🧠 UPDATE CHAT ROOM
    const chatRoom = await ChatRoom.findById(roomId);
    if (chatRoom) {
      const receiverId = chatRoom.participants.find(
        (id) => id.toString() !== senderId.toString()
      );

      await ChatRoom.findByIdAndUpdate(roomId, {
        lastMessage: newMessage._id,
        $inc: { [`unreadCount.${receiverId}`]: 1 },
        updatedAt: new Date()
      });
    }

    // 📡 SOCKET EMIT (FULL OBJECT)
    const io = req.app.get("io");
    if (io) {
      io.to(roomId).emit("receive_message", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   3️⃣ CLEAR CHAT FOR EVERYONE (HARD DELETE)
===================================================== */
export const clearChatAll = async (req, res) => {
  try {
    const { roomId } = req.params;

    await Message.deleteMany({ chatRoom: roomId });

    const io = req.app.get("io");
    if (io) io.to(roomId).emit("chat_cleared");

    res.json({ success: true, message: "Chat cleared for everyone" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   4️⃣ CLEAR CHAT FOR ME (SOFT DELETE)
===================================================== */
export const clearChat = async (req, res) => {
  try {
    const myId = req.user._id;
    const { roomId } = req.body;

    if (!roomId)
      return res.status(400).json({ message: "roomId required" });

    await Message.updateMany(
      { chatRoom: roomId },
      { $addToSet: { deletedFor: myId } }
    );

    // 🧹 GARBAGE COLLECTION
    await Message.deleteMany({
      chatRoom: roomId,
      deletedFor: { $size: 2 }
    });

    res.json({ success: true, message: "Chat cleared for you" });
  } catch (error) {
    console.error("clearChat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   5️⃣ MARK AS READ
===================================================== */
export const markAsRead = async (req, res) => {
  try {
    const { roomId } = req.body;
    const myId = req.user._id;

    await Message.updateMany(
      {
        chatRoom: roomId,
        sender: { $ne: myId }
      },
      { $set: { isRead: true } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
