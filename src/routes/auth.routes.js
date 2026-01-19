import express from "express";
import { registerUser, loginUser, verifyToken, updateKeysAndClearData } from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.middleare.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/update-keys", auth, updateKeysAndClearData);
router.get('/verify', auth, verifyToken);

export default router;
