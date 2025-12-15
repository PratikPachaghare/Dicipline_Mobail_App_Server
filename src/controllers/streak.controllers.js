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

    // Agar streak record hi nahi hai
    if (!streak) {
      return res.json({
        currentStreak: 0,
        longestStreak: 0,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = streak.lastCompletedDate
      ? new Date(streak.lastCompletedDate).setHours(0, 0, 0, 0)
      : null;

    // 🔴 Agar aaj koi task complete hi nahi hua
    if (!lastDate || today - lastDate > 24 * 60 * 60 * 1000) {
      // Streak broken
      streak.currentStreak = 0;
      await streak.save();
    }

    return res.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

