import { Message } from "../models/Message.js";
import { ChatRoom } from "../models/ChatRoom.js"; // Ensure correct filename

// 1. GET MESSAGES (Load history)
export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ chatRoom: roomId })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 }); // Oldest first
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. SEND MESSAGE (Text or Image)
export const sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const senderId = req.user._id;
    const { content, type } = req.body; // type = 'text' or 'image'
    
    // If image, assume you uploaded it via middleware and got a URL
    // const imageUrl = req.file ? req.file.path : null; 

    const newMessage = await Message.create({
      chatRoom: roomId,
      sender: senderId,
      content: content,
      type: type || "text",
      // imageUrl: imageUrl // Uncomment if using image upload
    });

    // Populate sender info for real-time display
    await newMessage.populate("sender", "name avatar");

    // Update ChatRoom last message
    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: newMessage._id,
      $inc: { "unreadCount.otherUserId": 1 } // Logic needed to find 'other' user
    });

    // 🔥 REAL-TIME: Emit to Socket Room
    const io = req.app.get("io");
    io.to(roomId).emit("receive_message", newMessage);

    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// 3. CLEAR CHAT
export const clearChat = async (req, res) => {
  try {
    const { roomId } = req.params;
    // Hard delete for everyone (Snapchat style)
    await Message.deleteMany({ chatRoom: roomId });
    
    // Notify users via socket
    const io = req.app.get("io");
    io.to(roomId).emit("chat_cleared");

    res.json({ success: true, message: "Chat cleared" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};