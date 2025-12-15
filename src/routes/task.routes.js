import express from "express";
// import { auth } from "../middleware/auth.middleware.js";
import {
  getTaskList,
  completeTask,
  undoTask,
  addTasksToList,
  createTaskList,
} from "../controllers/task.controllers.js";
import { auth } from "../middlewares/auth.middleare.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = express.Router();

// create all tasks (daily auto reset logic inside controller)
router.post("/tasks/createList", auth, createTaskList);

// get all tasks (daily auto reset logic inside controller)
router.get("/tasks/getTaskList", auth, getTaskList);

// complete single task
router.patch(
  "/tasks/:taskId/complete", auth, upload.single("image"), completeTask);

// undo single task
router.patch("/tasks/:taskId/undo", auth, undoTask);

// add new tasks to existing task list
router.post("/tasks/add", auth, addTasksToList);

export default router;
