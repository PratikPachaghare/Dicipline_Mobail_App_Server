import express from "express";
import {
  getOrCreateChatRoom,
  getChatList,
} from "../controllers/chatRoom.controller.js";
import {
  sendMessage,
  getMessages,
} from "../controllers/message.controller.js";
import { auth } from "../middlewares/auth.middleare.js";

const router = express.Router();

/* chat rooms */
router.post("/chat-room",auth, getOrCreateChatRoom);
router.get("/chat-list",auth, getChatList);

/* messages */
router.post("/message",auth, sendMessage);
router.get("/message/:chatRoomId",auth, getMessages);

export default router;
