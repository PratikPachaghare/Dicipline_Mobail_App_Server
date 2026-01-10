import { Streak } from "../models/streak.model.js";
import { TaskList } from "../models/task.model.js";
import { validateTaskWithImage } from "../utils/geminiTaskValidator.js";
import { markDailyActivity } from "./activityHeatmap.controllers.js";
import fs from 'fs';

// first login createTakList  
export const createTaskList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { tasks } = req.body;


    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tasks array required",
      });
    }

    const existing = await TaskList.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Task list already exists",
      });
    }

    const taskList = await TaskList.create({
      user: userId,
      totalTasks:tasks.length,
      tasks: tasks.map(task => ({
        title: task.title,
        description: task.description,
        icon: task.icon,
        time:task.time,
        isCustom:task.isCustom
      })),
    });

    return res.status(201).json({
      success: true,
      message: "Task list created",
      taskList,
    });
  } catch (error) {
    console.error("createTaskList error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// add new tasks in tasklist
export const addTaskToList = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 1. Destructure the single task fields directly from req.body
    const { title, description, time, icon, isCustom } = req.body;

    // Validate Title
    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    // 2. Find the user's Task List
    let taskList = await TaskList.findOne({ user: userId });

    // 3. Create List if it doesn't exist (First time user)
    if (!taskList) {
      taskList = await TaskList.create({
        user: userId,
        tasks: [{ title, description, time, icon, isCustom }], // Create with this 1 task
      });

      return res.status(201).json({
        success: true,
        message: "Task added successfully",
        task: taskList.tasks[0], // Return the newly created task
      });
    }

    // 4. Duplicate Check (Case-insensitive)
    const exists = taskList.tasks.some(
        (t) => t.title.toLowerCase() === title.trim().toLowerCase()
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Task with this name already exists",
      });
    }

    // 5. Add the new task
    // push returns the new length, so we push first, then grab the last item
    taskList.tasks.push({ title, description, time, icon, isCustom });
    await taskList.save();

    // Get the task object that Mongoose just created (it has the _id now)
    const newTask = taskList.tasks[taskList.tasks.length - 1];

    return res.status(200).json({
      success: true,
      message: "Task added successfully",
      task: newTask, // ✅ Returns the single object your frontend expects
    });

  } catch (error) {
    console.error("Add Task Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateTaskToList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params; 
    
    // ✅ CORRECT: Destructure directly from req.body
    // (matches the taskData object sent from frontend)
    const { title, description, time, icon, isCustom } = req.body; 

    const taskList = await TaskList.findOne({ user: userId });

    if (!taskList) {
      return res.status(404).json({ success: false, message: "Task list not found" });
    }

    const task = taskList.tasks.id(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Update fields
    if (title) task.title = title;
    if (time) task.time = time;
    if (icon) task.icon = icon;
    
    // Explicit checks for description/isCustom
    if (description !== undefined) task.description = description;
    if (isCustom !== undefined) task.isCustom = isCustom;

    await taskList.save();

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: task, 
    });

  } catch (error) {
    console.error("Update Task Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteTaskFromList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params; // Expecting /task/delete/:taskId

    // 1. Find the user's TaskList
    const taskList = await TaskList.findOne({ user: userId });

    if (!taskList) {
      return res.status(404).json({
        success: false,
        message: "Task list not found",
      });
    }

    // 2. Find the specific task subdocument
    const task = taskList.tasks.id(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // 3. Remove the task
    // Mongoose subdocuments have a .deleteOne() method (or .remove() in older versions)
    // However, pull() is the most reliable way for arrays of subdocs
    taskList.tasks.pull(taskId);
    
    // 4. Save the changes to the parent document
    await taskList.save();

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      taskId: taskId // Return ID so frontend knows what to remove from state
    });

  } catch (error) {
    console.error("Delete Task Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
  GET USER TASK LIST
  - Daily auto-reset logic yahin hota hai
*/
export const getTaskList = async (req, res) => {
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
        isActive: task.isActive,
        isCompleted, // 🔥 yahin decide hota hai
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
/*
  GET USER TASK LIST
  - Daily auto-reset logic yahin hota hai
*/
// Backend Controller
export const getExistTask = async (req, res) => {
  try {
    const userId = req.user._id;

    // OPTIMIZED: We only count, we do not fetch the data.
    // fast and extremely low memory usage.
    const taskCount = await TaskList.countDocuments({ 
      user: userId,
      'tasks.0': { $exists: true } // Checks if the tasks array has at least 1 item
    });

    const hasTasks = taskCount > 0;

    return res.status(200).json({
      success: true,
      tasks: hasTasks, // True or False
    });

  } catch (error) {
    console.error("Check Task Error:", error);
    // If error, safer to assume false so they don't get stuck
    return res.status(500).json({
      success: false,
      tasks: false, 
    });
  }
};
/*
  MARK TASK AS COMPLETED
  - Sirf ek task update hoga
*/
export const completeTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;

    // 1. Check if image exists
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const imageBase64 = req.file.buffer ? req.file.buffer.toString("base64") : null;

    const taskList = await TaskList.findOne({ user: userId });
    if (!taskList) return res.status(404).json({ success: false, message: "Task list not found" });

    // ---------------------------------------------------------
    // FIX START: Consistent UTC Date Logic (Same as Heatmap)
    // ---------------------------------------------------------
    const now = new Date();
    // Ye 'today' variable ab exact wahi date hai jo heatmap me use ho rahi hai (UTC Midnight)
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // 2. Daily Reset Logic
    // Compare dates using .getTime() to be accurate
    if (
      !taskList.lastResetDate ||
      new Date(taskList.lastResetDate).setUTCHours(0,0,0,0) !== today.getTime()
    ) {
      taskList.todayCompletedCount = 0;
      taskList.lastResetDate = today; // Store UTC date
    }

    const task = taskList.tasks.id(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    // 3. Check if already completed
    // Compare logic: Check if lastCompletedDate matches 'today'
    if (task.lastCompletedDate) {
      const lastCompleted = new Date(task.lastCompletedDate);
      lastCompleted.setUTCHours(0, 0, 0, 0); // Convert stored date to UTC midnight

      if (lastCompleted.getTime() === today.getTime()) {
        return res.json({ 
          success: true, 
          message: "Task already completed today" 
        });
      }
    }
    // ---------------------------------------------------------
    // FIX END
    // ---------------------------------------------------------

    // 4. Validate with AI
    const isValid = await validateTaskWithImage({
      imageBase64,
      taskTitle: task.title,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false, 
        message: "Task validation failed (AI could not verify image)",
      });
    }

    // 5. Mark Complete
    task.lastCompletedDate = new Date(); // Current timestamp is fine here for record
    taskList.todayCompletedCount += 1;

    console.log("task completed");

    // streack logic 
   if (taskList.todayCompletedCount === taskList.totalTasks) {
      
      // A. Local TaskList streak (UI ke liye)
      taskList.streak += 1;

      // B. Global Streak Model Update (Profile/Stats ke liye)
      let globalStreak = await Streak.findOne({ user: userId });

      // Agar user ka streak record nahi hai, toh naya banao
      if (!globalStreak) {
        globalStreak = new Streak({
          user: userId,
          currentStreak: 0,
          longestStreak: 0,
          lastEvaluatedDate: null // Abhi tak evaluate nahi hua aaj ka
        });
      }

      // Check: Kya aaj ka streak pehle hi update ho chuka hai?
      // (Prevent double counting if user somehow triggers this twice)
      const lastEvalDate = globalStreak.lastEvaluatedDate 
          ? new Date(globalStreak.lastEvaluatedDate).getTime() 
          : 0;
      
      const isAlreadyUpdatedToday = lastEvalDate === today.getTime();

      if (!isAlreadyUpdatedToday) {
        // Increment Current Streak
        globalStreak.currentStreak += 1;
        
        // Update Longest Streak Logic
        if (globalStreak.currentStreak > globalStreak.longestStreak) {
          globalStreak.longestStreak = globalStreak.currentStreak;
        }

        // Aaj ki date set kar do taaki dubara update na ho aaj
        globalStreak.lastEvaluatedDate = today;
        
        await globalStreak.save();
        console.log("Global streak updated!");
      }
    }
    
    // Yahan ab sahi count jayega
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
    return res.status(500).json({ 
        success: false, 
        message: "Internal Server Error" 
    });
  }
};


export const undoTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;

    await TaskList.updateOne(
      { user: userId, "tasks._id": taskId },
      {
        $set: {
          "tasks.$.lastCompletedDate": null,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Task marked as incomplete",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to undo task",
    });
  }
};
