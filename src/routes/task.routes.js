import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  getTaskList,
  completeTask,
  undoTask,
  addTasksToList,
} from "../controllers/task.controller.js";

const router = express.Router();

// get all tasks (daily auto reset logic inside controller)
router.get("/tasks", auth, getTaskList);

// complete single task
router.patch("/tasks/:taskId/complete", auth, completeTask);

// undo single task
router.patch("/tasks/:taskId/undo", auth, undoTask);

// add new tasks to existing task list
router.post("/tasks/add", auth, addTasksToList);

export default router;
