import { ChatRoom } from "../models/chatRoom.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";

/*
  1. SEND INVITE (Create Room with status 'pending')
*/
export const sendChatInvite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.body;

    // Check if chat already exists
    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [userId, friendId] },
    });

    if (chatRoom) {
      return res.status(400).json({ message: "Chat or invite already exists" });
    }

    // Create new pending room
    chatRoom = await ChatRoom.create({
      participants: [userId, friendId],
      initiatedBy: userId,
      status: "pending"
    });

    res.status(200).json({ success: true, message: "Invite sent!", chatRoom });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


export const removeFriend = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.body; 

    // 1. Validation
    if (!friendId) {
      return res.status(400).json({ success: false, message: "Friend ID is required" });
    }

    // 2. Find the room first (we need to check status before deleting)
    const chatRoom = await ChatRoom.findOne({
      participants: { $all: [userId, friendId] }
    });

    if (!chatRoom) {
      return res.status(404).json({ 
        success: false, 
        message: "No connection found to remove or cancel" 
      });
    }

    // 3. Determine Message based on current status
    // If it was pending, we "Cancelled" it. If it was accepted, we "Removed" the friend.
    const message = chatRoom.status === 'pending' 
      ? "Friend request cancelled" 
      : "Friend removed successfully";

    // 4. Delete the Room from Database
    await ChatRoom.findByIdAndDelete(chatRoom._id);

    // 5. Return Success
    return res.status(200).json({ 
      success: true, 
      message: message 
    });

  } catch (err) {
    console.error("Error removing friend:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
/*
  2. ACCEPT INVITE
*/
export const acceptChatInvite = async (req, res) => {
    try {
        const { roomId } = req.body;
        
        const chatRoom = await ChatRoom.findByIdAndUpdate(
            roomId,
            { status: "accepted" },
            { new: true }
        );

        res.status(200).json({ success: true, message: "Invitation Accepted", chatRoom });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};


/*
  3. GET CHAT LIST
  ✅ UPDATED: Added 'gender' to populate
*/
export const getChatList = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get Chat Rooms
    const chats = await ChatRoom.find({
      participants: userId,
      status: "accepted" 
    })
      // 👇 Added 'gender' here
      .populate("participants", "name avatar publicKey gender")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });


    const chatsWithCount = await Promise.all(
      chats.map(async (chat) => {
        
        const count = await Message.countDocuments({
          chatRoom: chat._id,      
          sender: { $ne: userId },  
          isRead: false             
        });

        return { 
          ...chat.toObject(), 
          unreadCount: count 
        };
      })
    );

    res.json(chatsWithCount);

  } catch (err) {
    console.error("❌ Error in getChatList:", err); 
    res.status(500).json({ message: "Server error" });
  }
};


/*
  5. GET SUGGESTIONS (Invite Friend List)
  ✅ UPDATED: Added 'gender' to select
*/
export const getInviteFriendList = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 1. Get Query Parameters (Default: page 1, 20 items)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || ""; 

    // 2. Find all IDs I am already connected with (Pending OR Accepted)
    const existingRooms = await ChatRoom.find({ participants: userId }).select("participants");
    
    const connectedIds = existingRooms
      .flatMap(r => r.participants)
      .map(id => id.toString());
    
    // Add myself to exclusion list
    connectedIds.push(userId.toString());

    // 3. Build the Filter Object
    const filter = {
      _id: { $nin: connectedIds } 
    };

    // Rule 2: If search text exists, filter by Name
    if (search) {
      filter.name = { $regex: search, $options: "i" }; 
    }

    // 4. Fetch Users with Pagination
    const users = await User.find(filter)
      // 👇 Added 'gender' here
      .select("name avatar email gender") 
      .skip((page - 1) * limit)    
      .limit(limit);               

    // (Optional) Get total count for UI pagination logic
    const totalUsers = await User.countDocuments(filter);

    res.json({ 
      success: true, 
      users,
      pagination: {
        total: totalUsers,
        page: page,
        totalPages: Math.ceil(totalUsers / limit),
        hasMore: page * limit < totalUsers
      }
    });

  } catch (error) {
    console.error("Error in getInviteFriendList:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/*
  4. GET ALL PENDING REQUESTS (Sent & Received)
  ✅ UPDATED: Added 'gender' to populate
*/
export const getPendingRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const requests = await ChatRoom.find({
            participants: userId,
            status: "pending"
        })
        // 👇 Added 'gender' here
        .populate("participants", "name avatar gender");

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};