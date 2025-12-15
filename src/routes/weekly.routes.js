import express from "express";
import {
  getWeeklyStreak,
} from "../controllers/Weakly.controllers.js";
import { auth } from "../middlewares/auth.middleare.js";

const router = express.Router();

// get last 7 days weekly progress (M T W T F S S)
router.get("/weekly-data",auth, getWeeklyStreak);

export default router;
