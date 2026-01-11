import express from "express";
import { 
  getChatList,
  getPendingRequests,
  sendChatInvite,
  acceptChatInvite,
  getInviteFriendList

} from "../controllers/chatRoom.controller.js"; 
import { auth } from "../middlewares/auth.middleare.js";

// ✅ Corrected Middleware Import


const router = express.Router();

// --- GET ROUTES ---

// 1. Get Active Chat List
router.get("/list", auth, getChatList);

// 2. Get Pending Invitations
router.get("/pending", auth, getPendingRequests);

// 3. Get Suggestions
router.get("/suggestions", auth, getInviteFriendList);


// --- POST ROUTES ---

// 4. Send an Invitation
router.post("/invite", auth, sendChatInvite);

// 5. Accept an Invitation
router.post("/accept", auth, acceptChatInvite);

export default router;