
import { Activity } from "../models/activityHeatmap.model.js";
import { Streak } from "../models/streak.model.js";
import { TaskList } from "../models/task.model.js";
import { User } from "../models/user.model.js";

export const getDashbordSummery = async (req, res) => {
  try {
    const userId = req.user._id;

    // --- 1. Common Date Setup (Consistent for all logic) ---
    const now = new Date();
    const todayIndex = now.getDay();
    const todayString = now.toDateString();
    
    // UTC Midnight for Streak & Weekly logic
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    // Start Date for Weekly (7 days ago)
    const weekStartDate = new Date(todayUTC);
    weekStartDate.setDate(todayUTC.getDate() - 6);

    // --- 2. Parallel Database Fetches (Optimized) ---
    // We fetch everything at once to save time
    const [taskList, streakRecord, activities, userRecord] = await Promise.all([
      // 1. Task List
      TaskList.findOne({ user: userId }),
      // 2. Streak Record
      Streak.findOne({ user: userId }),
      // 3. Activities (for Weekly)
      Activity.find({
        user: userId,
        date: { $gte: weekStartDate, $lte: todayUTC },
      }),
      // 4. User (for Rank calculation)
      User.findById(userId).select("weeklyPoints")
    ]);

    // --- 3. Process Task List Data ---
    let tasksToSend = [];
    if (taskList) {
      const filteredTasks = taskList.tasks.filter(task => {
        const freq = task.frequency || [0, 1, 2, 3, 4, 5, 6];
        return freq.includes(todayIndex);
      });

      tasksToSend = filteredTasks.map(task => {
        const isCompleted =
          task.lastCompletedDate &&
          task.lastCompletedDate.toDateString() === todayString;

        return {
          _id: task._id,
          title: task.title,
          description: task.description,
          icon: task.icon,
          time: task.time,
          isCustom: task.isCustom,
          frequency: task.frequency,
          isActive: task.isActive,
          isCompleted,
        };
      });
    }

    // --- 4. Process Streak Data ---
    let currentStreak = 0;
    let longestStreak = 0;

    if (streakRecord) {
      // Check for reset logic
      const lastDateUTC = streakRecord.lastEvaluatedDate
        ? new Date(streakRecord.lastEvaluatedDate)
        : null;

      let shouldReset = false;

      if (lastDateUTC) {
        lastDateUTC.setUTCHours(0, 0, 0, 0);
        const oneDayMs = 24 * 60 * 60 * 1000;
        const diffInTime = todayUTC.getTime() - lastDateUTC.getTime();
        
        // If gap is more than 1 day, reset
        if (diffInTime > oneDayMs) {
          shouldReset = true;
        }
      } else {
        shouldReset = true; // Record exists but no date
      }

      if (shouldReset) {
        streakRecord.currentStreak = 0;
        await streakRecord.save(); // Save the reset to DB
      }

      currentStreak = streakRecord.currentStreak;
      longestStreak = streakRecord.longestStreak;
    }

    // --- 5. Process Weekly Streak Data ---
    const activityMap = {};
    activities.forEach(a => {
      const dateKey = a.date.toISOString().split('T')[0];
      activityMap[dateKey] = true;
    });

    const weeklyStreak = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayUTC);
      d.setDate(todayUTC.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];

      weeklyStreak.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: dateKey,
        completed: !!activityMap[dateKey],
      });
    }

    // --- 6. Process Rank Data ---
    let rankData = { rank: 0, weeklyPoints: 0 };
    
    if (userRecord) {
      // Calculate rank (Count users with MORE points)
      const rankCount = await User.countDocuments({ 
        weeklyPoints: { $gt: userRecord.weeklyPoints } 
      });
      
      rankData = {
        rank: rankCount + 1,
        weeklyPoints: userRecord.weeklyPoints
      };
    }

    // --- 7. Final Response ---
    return res.status(200).json({
      success: true,
      data: {
        tasks: tasksToSend,
        streaks: {
            current: currentStreak,
            longest: longestStreak
        },
        weeklyStreak: weeklyStreak,
        rank: rankData
      }
    });

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching dashboard summary",
    });
  }
};