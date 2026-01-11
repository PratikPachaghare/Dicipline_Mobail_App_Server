import { Activity } from "../models/activityHeatmap.model.js";

/*
  GET /heatmap?months=3
  GET /heatmap?months=6
*/
export const getHeatmap = async (req, res) => {
  try {
    const userId = req.user._id;
    const months = parseInt(req.query.months) || 3;

    // 1. FIX: Create End Date using UTC directly
    const now = new Date();
    const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    // 2. FIX: Create Start Date using UTC directly
    const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    startDate.setMonth(startDate.getMonth() - months);

    const data = await Activity.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    }).select("date level completedTasks -_id");

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
export const getHeatmapByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const months = parseInt(req.query.months) || 3;

    // 1. FIX: Create End Date using UTC directly
    const now = new Date();
    const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    // 2. FIX: Create Start Date using UTC directly
    const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    startDate.setMonth(startDate.getMonth() - months);

    const data = await Activity.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    }).select("date level completedTasks -_id");

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


/*
  userId: logged-in user
  completedTasks: total completed tasks for today
*/
export const markDailyActivity = async (userId, completedTasks) => {
  // 3. FIX: Create 'Today' using UTC components
  // This takes your local Year/Month/Day and forces it to 00:00:00 UTC
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const level =
    completedTasks >= 7 ? 4 :
    completedTasks >= 5 ? 3 :
    completedTasks >= 3 ? 2 :
    completedTasks >= 1 ? 1 : 0;

  await Activity.findOneAndUpdate(
    { user: userId, date: today },
    {
      completedTasks,
      level,
    },
    { upsert: true, new: true }
  );
};