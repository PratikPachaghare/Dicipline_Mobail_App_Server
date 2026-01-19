import { Router } from 'express';
import { 
    getMessages, 
    sendMessage, 
    clearChat, 
    clearChatAll
} from "../controllers/message.controller.js"; // Adjust path if needed
import { auth } from '../middlewares/auth.middleare.js';
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

router.use(auth); // Protect all routes

// Existing chat routes (e.g. list chats)
// ✅ Add these Message Routeshn
router.route('/messages/:roomId').get(getMessages);
router.route('/messages/:roomId').post(upload.single("image"), sendMessage);
router.route('/clear/:roomId').post(clearChat);
router.route('/clearAll/:roomId').post(clearChatAll);

export default router;