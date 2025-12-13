import express from "express";
import { getTaskList, completeTask, undoTask } from "../controllers/task.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/tasks", auth, getTaskList);
router.patch("/tasks/:taskId/complete", auth, completeTask);
router.patch("/tasks/:taskId/undo", auth, undoTask);

export default router;
