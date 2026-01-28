import { Router } from "express";
import { 
    getChatList, 
    getPendingRequests, 
    getInviteFriendList, 
    sendChatInvite, 
    acceptChatInvite, 
    removeFriend,
    getPendingRequestsCount
} from "../controllers/chatRoom.controller.js";
import { 
    getMessages, 
    sendMessage, 
    clearChat, 
    markAsRead
} from "../controllers/message.controller.js";
import { auth } from "../middlewares/auth.middleare.js";

const router = Router();


//  CHAT MANAGEMENT 
router.get("/list", auth, getChatList);
router.get("/pending", auth, getPendingRequests);
router.get("/pendingCount", auth, getPendingRequestsCount);
router.get("/suggestions", auth, getInviteFriendList);
router.post("/invite", auth, sendChatInvite);
router.post("/remove", auth, removeFriend);
router.post("/accept", auth, acceptChatInvite);

router.route("/messages/:roomId")
    .get(auth, getMessages)   // Fetch Chat History
    .post(auth, sendMessage); // Send Message

router.put("/message/read/:roomId", auth, markAsRead); 

router.post("/clear/:roomId", auth, clearChat); // Clear History

export default router;