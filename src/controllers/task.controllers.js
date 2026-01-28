import { Streak } from "../models/streak.model.js";
import { TaskList } from "../models/task.model.js";
import { User } from "../models/user.model.js";
import { validateTaskWithImage, verifyTaskWithAI } from "../utils/geminiTaskValidator.js";
import { markDailyActivity } from "./activityHeatmap.controllers.js";
import fs from 'fs';

// ... createTaskList and addTaskToList (Same as before, no changes needed there) ...
export const createTaskList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ success: false, message: "Tasks array required" });
    }

    const existing = await TaskList.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Task list already exists" });
    }

    const taskList = await TaskList.create({
      user: userId,
      totalTasks: tasks.length,
      tasks: tasks.map(task => ({
        title: task.title,
        description: task.description,
        icon: task.icon,
        time: task.time,
        isCustom: task.isCustom,
        frequency: task.frequency || [0, 1, 2, 3, 4, 5, 6] 
      })),
    });

    return res.status(201).json({ success: true, message: "Task list created",
      taskList: taskList.tasks.map(task => task._id)
      });
  } catch (error) {
    console.error("createTaskList error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addTaskToList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, description, time, icon, isCustom, frequency } = req.body;

    if (!title) return res.status(400).json({ success: false, message: "Title is required" });

    let taskList = await TaskList.findOne({ user: userId });

    if (!taskList) {
      taskList = await TaskList.create({
        user: userId,
        tasks: [{ 
            title, description, time, icon, isCustom,
            frequency: frequency || [0, 1, 2, 3, 4, 5, 6] 
        }],
      });
      return res.status(201).json({ success: true, message: "Task added successfully", task: taskList.tasks[0] });
    }

    const exists = taskList.tasks.some((t) => t.title.toLowerCase() === title.trim().toLowerCase());
    if (exists) return res.status(400).json({ success: false, message: "Task with this name already exists" });

    taskList.tasks.push({ 
        title, description, time, icon, isCustom,
        frequency: frequency || [0, 1, 2, 3, 4, 5, 6]
    });
    
    await taskList.save();
    return res.status(200).json({ success: true, message: "Task added successfully", task: taskList.tasks[taskList.tasks.length - 1] });
  } catch (error) {
    console.error("Add Task Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateTaskToList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params; 
    const { title, description, time, icon, isCustom, frequency } = req.body; 

    const taskList = await TaskList.findOne({ user: userId });
    if (!taskList) return res.status(404).json({ success: false, message: "Task list not found" });

    const task = taskList.tasks.id(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (title) task.title = title;
    if (time) task.time = time;
    if (icon) task.icon = icon;
    if (description !== undefined) task.description = description;
    if (isCustom !== undefined) task.isCustom = isCustom;
    if (frequency !== undefined) task.frequency = frequency;

    await taskList.save();
    return res.status(200).json({ success: true, message: "Task updated successfully", task: task });
  } catch (error) {
    console.error("Update Task Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteTaskFromList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;
    const taskList = await TaskList.findOne({ user: userId });
    if (!taskList) return res.status(404).json({ success: false, message: "Task list not found" });

    const task = taskList.tasks.id(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    taskList.tasks.pull(taskId);
    await taskList.save();

    return res.status(200).json({ success: true, message: "Task deleted successfully", taskId: taskId });
  } catch (error) {
    console.error("Delete Task Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


//  1. UPDATED GET TASK LIST (Filters by Frequency)

export const getTaskList = async (req, res) => {
  try {
    const userId = req.user._id;

    const taskList = await TaskList.findOne({ user: userId });

    if (!taskList) {
      return res.status(200).json({ success: true, tasks: [] });
    }

    // 1. Get Today's Day Index (0 = Sunday, 1 = Monday, etc.)
    const now = new Date();
    const todayIndex = now.getDay(); 
    const todayString = now.toDateString();

    // 2. Filter tasks: Include ONLY if todayIndex is in task.frequency
    const filteredTasks = taskList.tasks.filter(task => {
        // If frequency is missing, assume everyday logic (or check your default)
        const freq = task.frequency || [0,1,2,3,4,5,6];
        return freq.includes(todayIndex);
    });

    // 3. Map for Frontend
    const tasksToSend = filteredTasks.map(task => {
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

    return res.status(200).json({
      success: true,
      tasks: tasksToSend, // Sirf aaj ke tasks jayenge
    });
  } catch (error) {
    console.error("Get Task List Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch task list" });
  }
};

export const getExistTask = async (req, res) => {
  try {
    const userId = req.user._id;

    const taskCount = await TaskList.countDocuments({ 
      user: userId,
      'tasks.0': { $exists: true } 
    });
    return res.status(200).json({ success: true, tasks: taskCount > 0 });
  } catch (error) {
    console.error("Check Task Error:", error);
    return res.status(500).json({ success: false, tasks: false });
  }
};

// ------------------------------------------------------------------
//  2. UPDATED COMPLETE TASK (Dynamic Streak Logic)
// ------------------------------------------------------------------
// ------------------------------------------------------------------
//  2. UPDATED COMPLETE TASK (With Image Cleanup)
// ------------------------------------------------------------------
export const completeTask = async (req, res) => {
  // Helper to delete temp file
  const removeTempFile = (path) => {
    if (path) {
      fs.unlink(path, (err) => {
        if (err) console.error("❌ Failed to delete temp file:", err);
      });
    }
  };

  try {
    const userId = req.user._id;
    const { taskId } = req.params;

    if (!req.file) return res.status(400).json({ success: false, message: "Image is required" });
    const imagePath = req.file.path;

    const taskList = await TaskList.findOne({ user: userId });
    if (!taskList) {
      removeTempFile(imagePath);
      return res.status(404).json({ success: false, message: "Task list not found" });
    }

    // 1. Standardize "Today" (UTC Midnight)
    const now = new Date();
    const todayIndex = now.getDay(); 
    // Create a midnight timestamp for comparison
    const todayMidnight = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const task = taskList.tasks.id(taskId);
    if (!task) {
      removeTempFile(imagePath);
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // 2. Check if ALREADY Completed Today
    if (task.lastCompletedDate) {
      const lastCompleted = new Date(task.lastCompletedDate);
      lastCompleted.setUTCHours(0, 0, 0, 0); // Normalize to midnight
      if (lastCompleted.getTime() === todayMidnight.getTime()) {
        removeTempFile(imagePath);
        return res.json({ success: true, message: "Task already completed today" });
      }
    }

    // 3. AI Verification
    const isValid = await verifyTaskWithAI(imagePath, task.title, task.description);
    removeTempFile(imagePath); // Delete immediately after check

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Task validation failed" });
    }

    // --- 🔥 FIX STARTS HERE 🔥 ---

    // 4. Mark THIS Task as Complete
    task.lastCompletedDate = now; // Save exact time

    // 5. RECALCULATE Count (Don't just += 1)
    // This loops through ALL tasks and counts how many are done today.
    // This replaces your manual "Reset" logic and "Increment" logic.
    const actualCountToday = taskList.tasks.filter(t => {
        if (!t.lastCompletedDate) return false;
        const tDate = new Date(t.lastCompletedDate);
        tDate.setUTCHours(0, 0, 0, 0);
        return tDate.getTime() === todayMidnight.getTime();
    }).length;

    // Update the main counters based on calculation
    taskList.todayCompletedCount = actualCountToday;
    taskList.lastResetDate = todayMidnight; 

    // Points Update
    await User.findByIdAndUpdate(userId, { $inc: { totalPoints: 10, weeklyPoints: 10 } });

    // --- STREAK LOGIC ---
    
    // 6. Calculate Target for Streak
    // (Filter tasks that are scheduled for TODAY's day index)
    const todaysScheduledTasks = taskList.tasks.filter(t => {
       const freq = t.frequency || [0,1,2,3,4,5,6];
       return freq.includes(todayIndex);
    });
    
    const todaysTotalTarget = todaysScheduledTasks.length;

    // 7. Calculate how many SCHEDULED tasks are done
    // (Note: This might be different from actualCountToday if you have extra custom tasks)
    let scheduledCompletedCount = 0;
    todaysScheduledTasks.forEach(t => {
        if(t.lastCompletedDate) {
            const tDate = new Date(t.lastCompletedDate);
            tDate.setUTCHours(0,0,0,0);
            if(tDate.getTime() === todayMidnight.getTime()) {
                scheduledCompletedCount++;
            }
        }
    });

    // 8. Streak Update Condition
    if (scheduledCompletedCount >= todaysTotalTarget && todaysTotalTarget > 0) {
      
      taskList.streak += 1; // Local Streak

      // Global Streak Update
      let globalStreak = await Streak.findOne({ user: userId });
      if (!globalStreak) {
        globalStreak = new Streak({
          user: userId, currentStreak: 0, longestStreak: 0, lastEvaluatedDate: null
        });
      }

      const lastEvalDate = globalStreak.lastEvaluatedDate ? new Date(globalStreak.lastEvaluatedDate).getTime() : 0;
      
      // Only update global streak if not already updated today
      if (lastEvalDate !== todayMidnight.getTime()) {
        globalStreak.currentStreak += 1;
        if (globalStreak.currentStreak > globalStreak.longestStreak) {
          globalStreak.longestStreak = globalStreak.currentStreak;
        }
        globalStreak.lastEvaluatedDate = todayMidnight;
        await globalStreak.save();

        // Bonus Points
        await User.findByIdAndUpdate(userId, { $inc: { totalPoints: 20, weeklyPoints: 20 } });
      }
    }
    
    // 9. Update Heatmap
    await markDailyActivity(userId, taskList.todayCompletedCount);
    
    await taskList.save();

    return res.status(200).json({
      success: true,
      message: "Task verified and completed!",
      todayCompletedCount: taskList.todayCompletedCount,
      streak: taskList.streak,
    });

  } catch (error) {
    console.error("Complete Task Error:", error);
    if (req.file && req.file.path) removeTempFile(req.file.path);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const undoTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;

    const taskList = await TaskList.findOne({ user: userId });
    if (!taskList) return res.status(404).json({ success: false, message: "Not found" });

    const task = taskList.tasks.id(taskId);
    if(task) {
        task.lastCompletedDate = null;
        if(taskList.todayCompletedCount > 0) taskList.todayCompletedCount -= 1;
        await taskList.save();
    }

    return res.status(200).json({ success: true, message: "Task marked as incomplete" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to undo task" });
  }
};


export const getManageTaskList = async (req, res) => {
  try {
    const userId = req.user._id; // auth middleware se aayega

    const taskList = await TaskList.findOne({ user: userId });

    if (!taskList) {
      return res.status(200).json({
        success: true,
        tasks: [],
      });
    }

    const today = new Date().toDateString();

    const tasks = taskList.tasks.map(task => {
      const isCompleted =
        task.lastCompletedDate &&
        task.lastCompletedDate.toDateString() === today;

      return {
        _id: task._id,
        title: task.title,
        description: task.description,
        icon: task.icon,
        time:task.time,
        isCustom:task.isCustom,
        frequency: task.frequency,
        isActive: task.isActive,
        isCompleted, //  yahin decide hota hai
      };
    });

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Get Task List Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch task list",
    });
  }
};