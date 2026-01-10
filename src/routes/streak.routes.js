import express from "express";
// import { auth } from "../middleware/auth.middleware.js";
import {
  getCurrentStreak,
} from "../controllers/streak.controllers.js";
import { auth } from "../middlewares/auth.middleare.js";

const router = express.Router();

// get current streak (auto reset handled in controller)
router.get("/streak-count",auth, getCurrentStreak);

export default router;
