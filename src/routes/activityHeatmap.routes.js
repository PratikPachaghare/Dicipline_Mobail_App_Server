import express from "express";
// import { auth } from "../middleware/auth.middleware.js";
import {
  getHeatmap,
} from "../controllers/activityHeatmap.controllers.js";
import { auth } from "../middlewares/auth.middleare.js";

const router = express.Router();

// ?months=3 OR ?months=6
router.get("/activity-heatmap",auth, getHeatmap);

export default router;
