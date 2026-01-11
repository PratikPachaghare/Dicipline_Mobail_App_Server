import { ChatRoom } from "../models/chatRoom.model.js";
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
  3. GET MY CHAT LIST (Only Accepted Chats)
*/
export const getChatList = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await ChatRoom.find({
      participants: userId,
      status: "accepted" // Only show active chats
    })
      .populate("participants", "name avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/*
  4. GET PENDING REQUESTS (Invitations received)
*/
export const getPendingRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find rooms where I am a participant, status is pending, but I DID NOT start it
        const requests = await ChatRoom.find({
            participants: userId,
            status: "pending",
            initiatedBy: { $ne: userId } 
        }).populate("participants", "name avatar");

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

/*

  5. GET SUGGESTIONS (Users not in any chat room with me)
  - Supports Pagination
  - Supports Search (Name)
*/
export const getInviteFriendList = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 1. Get Query Parameters (Default: page 1, 20 items)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || ""; // Search string (empty by default)

    // 2. Find all IDs I am already connected with (Pending OR Accepted)
    // We don't want to show people we are already chatting with
    const existingRooms = await ChatRoom.find({ participants: userId }).select("participants");
    
    const connectedIds = existingRooms
      .flatMap(r => r.participants)
      .map(id => id.toString());
    
    // Add myself to exclusion list
    connectedIds.push(userId.toString());

    // 3. Build the Filter Object
    const filter = {
      _id: { $nin: connectedIds } // Rule 1: Exclude existing friends
    };

    // Rule 2: If search text exists, filter by Name
    if (search) {
      filter.name = { $regex: search, $options: "i" }; // 'i' makes it case-insensitive
    }

    // 4. Fetch Users with Pagination
    const users = await User.find(filter)
      .select("name avatar email") // Only get necessary fields
      .skip((page - 1) * limit)    // Skip previous pages
      .limit(limit);               // Limit results

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