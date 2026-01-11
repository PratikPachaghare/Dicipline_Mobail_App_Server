import express from "express";
import { auth } from "../middlewares/auth.middleare.js";
import { getLeaderboardUserProfile, getUserRankOnly, getWeeklyLeaderboard } from "../controllers/leaderboard.controller.js";

const router = express.Router();

// GET /api/leaderboard/weekly
router.get("/my-rank", auth, getUserRankOnly);
router.get("/weeklyLeaderbord", auth, getWeeklyLeaderboard);
router.get('/leaderboard-profile/:userId', getLeaderboardUserProfile);

export default router;