import { Streak } from "../models/streak.model";

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
