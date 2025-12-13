import { Activity } from "../models/activityHeatmap.model.js";

/*
  GET /heatmap?months=3
  GET /heatmap?months=6
*/
export const getHeatmap = async (req, res) => {
  try {
    const userId = req.user._id;
    const months = parseInt(req.query.months) || 3;

    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

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
  completedTasks: aaj total completed tasks
*/
export const markDailyActivity = async (userId, completedTasks) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // date only

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
