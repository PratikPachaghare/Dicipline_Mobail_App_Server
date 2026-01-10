import { Activity } from "../models/activityHeatmap.model.js";

export const getWeeklyStreak = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. FIX: Generate 'Today' as UTC Midnight (Matches your save logic)
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // 2. FIX: Start Date (7 days ago in UTC)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6); 

    // 3. Query DB
    const activities = await Activity.find({
      user: userId,
      date: { $gte: startDate, $lte: today },
    });

    // 4. FIX: Use ISO String (YYYY-MM-DD) for keys to avoid timezone mess
    const activityMap = {};
    activities.forEach(a => {
      // .toISOString() returns "2026-01-10T00:00:00.000Z" -> we take "2026-01-10"
      const dateKey = a.date.toISOString().split('T')[0];
      activityMap[dateKey] = true;
    });

    // 5. Build weekly response
    const week = [];
    for (let i = 6; i >= 0; i--) {
      // Calculate date based on UTC 'today'
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      const dateKey = d.toISOString().split('T')[0];

      week.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }), // Mon, Tue...
        date: dateKey, 
        completed: !!activityMap[dateKey], // Check against ISO key
      });
    }

    return res.json({ week });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};