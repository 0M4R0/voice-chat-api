import { Router } from "express";
import { sendMessage, getMessages } from "../controllers/messages.controller";
import { protect } from "../middleware/auth";

const router: Router = Router();
router.use(protect);

router.post("/send-message", sendMessage);
router.get("/get-messages/:friendId", getMessages);

export default router;
