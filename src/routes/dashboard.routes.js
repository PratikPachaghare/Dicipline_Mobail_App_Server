import express from "express";
import { auth } from "../middlewares/auth.middleare.js";
import { getDashbordSummery } from "../controllers/dashboard.controllers.js";

const router = express.Router();

router.get("/summary", auth, getDashbordSummery);

export default router;