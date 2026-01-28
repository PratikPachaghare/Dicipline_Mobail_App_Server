import { ChatRoom } from "../models/chatRoom.model.js";
import { Streak } from "../models/streak.model.js";
import { TaskList } from "../models/task.model.js";
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
      .select("name avatar gender weeklyPoints totalPoints") // Select only needed fields
      .sort({ weeklyPoints: -1 }) // Descending inorder (Highest first)
      .limit(100);

    // 2. Map data to cleaner format for Frontend
const leaderboardData = topUsers.map((user, index) => ({
  userId: user._id,
  name: user.name,
  avatar: user.avatar?.url || "",
  gender: user.gender,        // ✅ ADD THIS
  points: user.weeklyPoints,
  rank: index + 1,
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
    const myId = req.user._id;
    const { userId } = req.params;

    // 1. Find the specific user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2. Check Friendship Status
    const chatRoom = await ChatRoom.findOne({
      participants: { $all: [myId, userId] },
    });

    let friendStatus = 'none'; // Default: Not friends
    let roomId = null;

    if (chatRoom) {
      roomId = chatRoom._id;
      if (chatRoom.status === 'accepted') {
        friendStatus = 'friends';
      } else if (chatRoom.status === 'pending') {
        friendStatus = 'pending';
      }
    }

    // 3. Get Streak
    const userStreak = await Streak.findOne({ user: userId });
    let TaskLists = null;
    if(friendStatus==='friends'){
      TaskLists = await TaskList.findOne({ user: userId });
    }
    if(TaskLists){
      console.log("TaskLists found:", TaskLists);
      TaskLists = {
        totalTasks: TaskLists.totalTasks,
        todayCompletedCount: TaskLists.todayCompletedCount
      };
    }
    


    // 4. Fix Avatar
    let avatarUrl = user.avatar;
    if (user.avatar && typeof user.avatar === 'object') {
      avatarUrl = user.avatar.url || user.avatar.secure_url;
    }

    // 5. Construct Response
    const profileData = {
      _id: user._id,
      name: user.name,
      avatar: avatarUrl,
      gender: user.gender,
      totalTask: user.gender,
      TaskLists,
      friendStatus, 
      roomId,   
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


// --- GET USER'S TOTAL TASKS (Friendship Guarded) ---
export const getUserTotalTasksList = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    // 1. Privacy Check: If requesting someone else's data, check if friends
    if (myId.toString() !== userId) {
      const isFriend = await ChatRoom.exists({
        participants: { $all: [myId, userId] },
        status: 'accepted'
      });
      
      if (!isFriend) {
        return res.status(403).json({ success: false, message: "Access denied. Friends only." });
      }
    }

    // 2. Fetch Task List
    const taskList = await TaskList.findOne({ user: userId });

    if (!taskList) {
      return res.status(200).json({ success: true, tasks: [] });
    }

    const todayString = new Date().toDateString();

    // 3. Map Data (Include isCompleted status for better UI)
    const tasks = taskList.tasks.map(task => {
      const isCompleted = task.lastCompletedDate && 
                          new Date(task.lastCompletedDate).toDateString() === todayString;
      return {
        _id: task._id,
        title: task.title,
        icon: task.icon,
        description: task.description,
        frequency: task.frequency,
        isCompleted: !!isCompleted, 
        isCustom: task.isCustom
      };
    });

    return res.status(200).json({ success: true, tasks });

  } catch (error) {
    console.error("Get Total Tasks Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- GET USER'S COMPLETED TASKS TODAY (Friendship Guarded) ---
export const getUserTotalCompletedTasksList = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    // 1. Privacy Check
    if (myId.toString() !== userId) {
      const isFriend = await ChatRoom.exists({
        participants: { $all: [myId, userId] },
        status: 'accepted'
      });
      
      if (!isFriend) {
        return res.status(403).json({ success: false, message: "Access denied. Friends only." });
      }
    }

    // 2. Fetch Task List
    const taskList = await TaskList.findOne({ user: userId });

    if (!taskList) {
      return res.status(200).json({ success: true, tasks: [] });
    }

    // 3. Filter for Today's Date
    const todayString = new Date().toDateString();

    const completedTasks = taskList.tasks.filter(task => {
      return task.lastCompletedDate && 
             new Date(task.lastCompletedDate).toDateString() === todayString;
    }).map(task => ({
      _id: task._id,
      title: task.title,
      icon: task.icon,
      completedAt: task.lastCompletedDate // Useful if you want to show "Completed at 10:00 AM"
    }));

    return res.status(200).json({ success: true, tasks: completedTasks });

  } catch (error) {
    console.error("Get Completed Tasks Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};