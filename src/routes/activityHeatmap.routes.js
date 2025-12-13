import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  getActivityHeatmap,
} from "../controllers/activity.controller.js";

const router = express.Router();

// ?months=3 OR ?months=6
router.get("/activity-heatmap", auth, getActivityHeatmap);

export default router;
