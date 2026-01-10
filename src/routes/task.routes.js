import express from "express";
// import { auth } from "../middleware/auth.middleware.js";
import {
  getTaskList,
  completeTask,
  undoTask,
  createTaskList,
  getExistTask,
  addTaskToList,
  updateTaskToList,
  deleteTaskFromList,
} from "../controllers/task.controllers.js";
import { auth } from "../middlewares/auth.middleare.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = express.Router();

// create all tasks (daily auto reset logic inside controller)
router.post("/tasks/createList", auth, createTaskList);

// get all tasks (daily auto reset logic inside controller)
router.get("/tasks/getTaskList", auth, getTaskList);

router.get("/tasks/getExistTask", auth, getExistTask);

// complete single task
router.post(
  "/tasks/:taskId/complete", auth, upload.single("image"), completeTask);

router.post("/tasks/add", auth, addTaskToList);

router.patch("/tasks/:taskId/update", auth, updateTaskToList);

router.delete("/tasks/:taskId/delete", auth, deleteTaskFromList);
// undo single task
router.patch("/tasks/:taskId/undo", auth, undoTask);

// add new tasks to existing task list

export default router;
