import { Streak } from "../models/streak.model.js";

export const checkStreakReset = async (userId) => {
  const streak = await Streak.findOne({ user: userId });
  if (!streak) return;

  const today = new Date().toDateString();
  const lastDate =
    streak.lastCompletedDate &&
    streak.lastCompletedDate.toDateString();

  if (lastDate !== today && streak.currentStreak > 0) {
    streak.currentStreak = 0;
    await streak.save();
  }
};

export const getCurrentStreak = async (req, res) => {
  try {
    const userId = req.user._id;

    let streak = await Streak.findOne({ user: userId });

    // 1. Agar streak record hi nahi hai
    if (!streak) {
      return res.json({
        currentStreak: 0,
        longestStreak: 0,
      });
    }

    // 2. Dates ko UTC Midnight par set karein (Consistency ke liye)
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // ✅ FIX: Use 'lastEvaluatedDate' (jo humne DB me save kiya tha)
    const lastDateUTC = streak.lastEvaluatedDate
      ? new Date(streak.lastEvaluatedDate)
      : null;

    if (lastDateUTC) {
      // Ensure DB date is also treated as UTC Midnight logic
      lastDateUTC.setUTCHours(0, 0, 0, 0);
      
      const oneDayMs = 24 * 60 * 60 * 1000;
      const diffInTime = todayUTC.getTime() - lastDateUTC.getTime(); 
      if (diffInTime > oneDayMs) {
        streak.currentStreak = 0; 
        // Note: Longest streak ko 0 nahi karte, wo record rehta hai
        await streak.save();
      }
    } else {
        // Agar date hi nahi hai par record hai (Rare case), reset to 0
        streak.currentStreak = 0;
        await streak.save();
    }

    // 3. Return Data
    return res.status(200).json({
      // ✅ FIX: Match Redux keys (currentStreak/longestStreak)
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
    });

  } catch (error) {
    console.error("Get Streak Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};