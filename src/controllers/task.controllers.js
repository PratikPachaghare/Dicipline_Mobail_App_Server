import { TaskList } from "../models/taskList.model.js";

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
      tasks: tasks.map(task => ({
        title: task.title,
        description: task.description,
        icon: task.icon,
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
export const addTasksToTaskList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { tasks } = req.body; // new tasks array

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tasks array required",
      });
    }

    let taskList = await TaskList.findOne({ user: userId });

    // Agar first time task list nahi hai → create karo
    if (!taskList) {
      taskList = await TaskList.create({
        user: userId,
        tasks,
      });

      return res.status(201).json({
        success: true,
        message: "Task list created",
        tasks: taskList.tasks,
      });
    }

    // 🔥 Duplicate avoid (same title wale task add nahi honge)
    const existingTitles = new Set(
      taskList.tasks.map(t => t.title.toLowerCase())
    );

    const newTasks = tasks.filter(
      t => !existingTitles.has(t.title.toLowerCase())
    );

    if (newTasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No new tasks to add",
      });
    }

    taskList.tasks.push(...newTasks);
    await taskList.save();

    return res.status(200).json({
      success: true,
      message: "New tasks added",
      tasks: newTasks,
    });
  } catch (error) {
    console.error(error);
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
  MARK TASK AS COMPLETED
  - Sirf ek task update hoga
*/
export const completeTask = async (req, res) => {
  const userId = req.user._id;
  const { taskId } = req.params;

  const taskList = await TaskList.findOne({ user: userId });
  if (!taskList) return res.status(404).json({ message: "Task list not found" });

  const today = new Date().toDateString();
  // 🔁 Daily reset hold list todayComplet count
  if (
    !taskList.lastResetDate ||
    taskList.lastResetDate.toDateString() !== today
  ) {
    taskList.todayCompletedCount = 0;
    taskList.lastResetDate = new Date();
  }

  const task = taskList.tasks.id(taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });

  // ❌ Already completed today
  if (
    task.lastCompletedDate &&
    task.lastCompletedDate.toDateString() === today
  ) {
    return res.json({ message: "Task already completed" });
  }

  // ✅ Mark complete
  task.lastCompletedDate = new Date();
  taskList.todayCompletedCount += 1;

  // 🔥 LAST TASK COMPLETED → STREAK INCREASE
  if (taskList.todayCompletedCount === taskList.totalTasks) {
    taskList.streak += 1;
  }

  await taskList.save();

  return res.json({
    message: "Task completed",
    todayCompletedCount: taskList.todayCompletedCount,
    streak: taskList.streak,
  });
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
