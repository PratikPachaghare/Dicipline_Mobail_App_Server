import { Activity } from "../models/activityHeatmap.model.js";

export const getWeeklyStreak = async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6); // last 7 days

    // last 7 days activity
    const activities = await Activity.find({
      user: userId,
      date: { $gte: startDate, $lte: today },
    });

    // map for fast lookup
    const activityMap = {};
    activities.forEach(a => {
      activityMap[a.date.toDateString()] = true;
    });

    // build weekly response (Mon → Sun)
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      week.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }), // M T W
        date: d.toDateString(),
        completed: !!activityMap[d.toDateString()],
      });
    }

    return res.json({ week });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
