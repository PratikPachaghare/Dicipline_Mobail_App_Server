import { Router } from 'express';
import { 
    getMessages, 
    sendMessage, 
    clearChat 
} from "../controllers/message.controller.js"; // Adjust path if needed
import { auth } from '../middlewares/auth.middleare.js';

const router = Router();

router.use(auth); // Protect all routes

// Existing chat routes (e.g. list chats)
// ✅ Add these Message Routes
router.route('/messages/:roomId').get(getMessages);
router.route('/messages/:roomId').post(sendMessage);
router.route('/clear/:roomId').post(clearChat);

export default router;