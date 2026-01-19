
import { ChatRoom } from "../models/chatRoom.model.js";
import { Message } from "../models/message.model.js";
import { uploadOnCloudinery } from "../utils/coudnary.js";

export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const myId = req.user._id.toString(); // Current User ID
    const { page = 1, limit = 30 } = req.query;

    const messages = await Message.find(
      { chatRoom: roomId, deletedFor: { $ne: myId }},
    )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit) 
      .limit(parseInt(limit))   
      .populate("sender", "name avatar");

    // 🔥 SMART LOGIC:
    // Frontend ko 'content' hi chahiye, to hum server par hi decide karenge
    // ki konsa content bhejna hai.
    
    const projectedMessages = messages.map(msg => {
        const msgObj = msg.toObject(); // Mongoose object ko JS object banaya
        const isMe = msgObj.sender._id.toString() === myId;

        // Agar Text hai, to sahi wala encrypted packet choose karo
        if (msgObj.type === 'text') {
            if (isMe) {
                // Maine bheja tha, to mere liye wala content dikhao
                msgObj.content = msgObj.contentForSender; 
            } else {
                // Dost ne bheja tha, to receiver wala content dikhao
                msgObj.content = msgObj.contentForReceiver;
            }
        }
        
        // Frontend ko confuse nahi karenge, 'content' field me hi data bhejenge
        return msgObj;
    });

    res.json(projectedMessages); 
    
  } catch (error) {
    res.status(500).json(error);
  }
};

// 2. SEND MESSAGE (Double Encryption Handling)
export const sendMessage = async (req, res) => {
  try {
    const roomId = req.params.roomId || req.body?.chatRoomId; 
    const senderId = req.user._id;
    
    // Frontend se ab 2 chize aayengi Text ke liye
    let { contentForReceiver, contentForSender, type = "text" } = req.body;
    
    // Image Handling (Same as before)
    // Note: Images ke liye hum abhi double encryption nahi kar rahe (URL hota hai)
    // Agar image hai to usse 'content' field me daal denge
    let finalContent = ""; 

    if (req.file) {
      const localFilePath = req.file.path;
      const cloudinaryResponse = await uploadOnCloudinery(localFilePath);
      if (cloudinaryResponse) {
        finalContent = cloudinaryResponse.secure_url; // Image URL
        type = "image";
      } else {
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    // Validation
    if (type === 'text' && (!contentForReceiver || !contentForSender)) {
        return res.status(400).json({ message: "Encrypted content missing" });
    }

    // Create Message
    const newMessage = await Message.create({
      chatRoom: roomId,
      sender: senderId,
      type: type,
      // Agar Image hai to 'content' me URL, agar text hai to niche wale fields
      content: type === 'image' ? finalContent : "", 
      contentForReceiver: type === 'text' ? contentForReceiver : "",
      contentForSender:   type === 'text' ? contentForSender : "",
    });

    await newMessage.populate("sender", "name avatar");

    // ChatRoom Update Logic (Same)
    const chatRoom = await ChatRoom.findById(roomId);
    if (chatRoom) {
        const receiverId = chatRoom.participants.find(
            (id) => id.toString() !== senderId.toString()
        );
        await ChatRoom.findByIdAndUpdate(roomId, {
            lastMessage: newMessage._id,
            $inc: { [`unreadCount.${receiverId}`]: 1 }, 
            updatedAt: new Date(),
        });
    }

    // Socket Emit
    // Socket par bhi same logic lagana padega frontend pe, 
    // isliye hum poora object bhej dete hain
    const io = req.app.get("io");
    if (io) {
        io.to(roomId).emit("receive_message", newMessage);
    }

    res.status(201).json(newMessage);

  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// 3. CLEAR CHAT
export const clearChatAll = async (req, res) => {
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

export const clearChat = async (req, res) => {
  try {
    const myId = req.user._id;
    const { friendId } = req.body; // Frontend se friend ki ID bhejo

    if (!friendId) return res.status(400).json({ message: "Friend ID required" });

    // 1. SOFT DELETE: Meri ID ko 'deletedFor' me add karo
    await Message.updateMany(
      {
        $or: [
          { sender: myId, receiver: friendId },
          { sender: friendId, receiver: myId }
        ]
      },
      {
        $addToSet: { deletedFor: myId } // Duplicate nahi hoga
      }
    );

    // --- 🚀 PRO TIP: GARBAGE COLLECTION (Space Saving) ---
    // Check karo: Aise messages jisme Sender aur Receiver DONO 'deletedFor' me hain?
    // Agar haan, to unhe Database se permanently uda do.
    
    await Message.deleteMany({
      $and: [
        { sender: { $in: [myId, friendId] } }, // Message in dono ke beech ka hai
        { receiver: { $in: [myId, friendId] } },
        { deletedFor: { $all: [myId, friendId] } } // Aur dono ne delete kar diya hai
      ]
    });

    res.status(200).json({ success: true, message: "Chat cleared successfully" });

  } catch (error) {
    console.error("Clear Chat Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const markAsRead = async (req, res) => {
  const { chatId } = req.body; // या params से लें
  const myId = req.user._id;

  await Message.updateMany(
    { chat: chatId, sender: { $ne: myId } }, // इस चैट के वो मैसेज जो मैंने नहीं भेजे
    { $set: { isRead: true } }               // उन्हें Read कर दो
  );
  
  res.status(200).send({ success: true });
};