import { Streak } from "../models/streak.model.js";
import { User } from "../models/user.model.js";

export const getUserRankOnly = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("weeklyPoints");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Count users who have MORE points than me
    // Index ki wajah se ye millisecond me ho jayega
    const rank = await User.countDocuments({ 
      weeklyPoints: { $gt: user.weeklyPoints } 
    });

    return res.status(200).json({
      success: true,
      rank: rank + 1, // Agar 0 log aage hain, to rank 1 hai
      weeklyPoints: user.weeklyPoints
    });

  } catch (error) {
    console.error("Rank Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const getWeeklyLeaderboard = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // 1. Get Top 100 Users sorted by weeklyPoints
    const topUsers = await User.find({})
      .select("name avatar weeklyPoints totalPoints") // Select only needed fields
      .sort({ weeklyPoints: -1 }) // Descending order (Highest first)
      .limit(100);

    // 2. Map data to cleaner format for Frontend
    const leaderboardData = topUsers.map((user, index) => ({
      userId: user._id,
      name: user.name,
      avatar: user.avatar?.url || "",
      points: user.weeklyPoints,
      rank: index + 1, // Rank is index + 1
    }));

    // 3. Find Current User's Rank
    // We count how many people have MORE points than the current user
    const currentUser = await User.findById(currentUserId);
    
    // Count users with strictly greater points
    const countBetterUsers = await User.countDocuments({ 
        weeklyPoints: { $gt: currentUser.weeklyPoints } 
    });

    const myRank = countBetterUsers + 1;

    // 4. Determine display logic for Rank (Show '-' if > 100)
    // The prompt requested: "user not in 100 then usre show -"
    // We send the actual rank number, frontend can display '-' if rank > 100.
    // Or we can send a string. Here I send the number for flexibility.

    return res.status(200).json({
      success: true,
      userRank: myRank, // e.g. 5, 101, 300
      userPoints: currentUser.weeklyPoints,
      leaderboardData: leaderboardData,
    });

  } catch (error) {
    console.error("Leaderboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching leaderboard",
    });
  }
};

// Ensure you have imported your models at the top
// import User from '../models/User';
// import Habit from '../models/Habit'; 

// Make sure to import your models at the top
// const User = require('../models/User');
// const Streak = require('../models/Streak'); 

// Ensure you have imported your models
// const User = require('../models/User');
// const Streak = require('../models/Streak'); 

export const getLeaderboardUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Find the specific user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2. Find the Streak for this user (CORRECTED SYNTAX)
    // We use findOne to find the streak document associated with this userId
    // Note: Verify if your Streak model uses 'userId' or 'user' as the field name
    // Your schema defines the field as 'user'
    const userStreak = await Streak.findOne({ user: userId });

    // 3. Fix Avatar (Prevent Frontend Crash)
    // If avatar is an object (from Cloudinary/Multer), extract the URL string
    let avatarUrl = user.avatar;
    if (user.avatar && typeof user.avatar === 'object') {
      avatarUrl = user.avatar.url || user.avatar.secure_url;
    }

    // 4. Construct the response object
    const profileData = {
      _id: user._id,
      name: user.name,
      avatar: avatarUrl, 
      gender: user.gender,
      

      currentStreak: userStreak?.currentStreak || 0,
      bestStreak: userStreak?.longestStreak || 0,
  
      totalPoints: user.totalPoints || 0,
      weeklyPoints: user.weeklyPoints || 0
    };

    return res.status(200).json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error("Error fetching leaderboard user profile:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};