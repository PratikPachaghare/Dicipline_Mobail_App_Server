import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  getWeeklyProgress,
} from "../controllers/weekly.controller.js";

const router = express.Router();

// get last 7 days weekly progress (M T W T F S S)
router.get("/weekly", auth, getWeeklyProgress);

export default router;
