import { User } from "../models/user.model.js";
import { ChatRoom } from "../models/chatRoom.model.js";

/*
  GET FRIEND INVITE LIST
  - App ke sab users
  - Exclude khud ko
  - Exclude jinke sath already chat room hai
*/

export const getInviteFriendList = async (req, res) => {
  try {
    const userId = req.user._id;

    // Already connected users
    const chatRooms = await ChatRoom.find({
      participants: userId,
    }).select("participants");

    const connectedUserIds = chatRooms
      .flatMap(room => room.participants)
      .map(id => id.toString());

    // Fetch users not yet connected
    const users = await User.find({
      _id: {
        $ne: userId,
        $nin: connectedUserIds,
      },
    }).select("name email avatar");

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
