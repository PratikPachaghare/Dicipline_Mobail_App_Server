import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  getCurrentStreak,
} from "../controllers/streak.controller.js";

const router = express.Router();

// get current streak (auto reset handled in controller)
router.get("/streak", auth, getCurrentStreak);

export default router;
