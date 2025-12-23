import { Router } from "express";
import {
  sendRequest,
  getRequests,
  respondToRequest,
  getFriends,
  deleteFriend,
} from "../controllers/friends.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);

// Routes
router.post("/send-request", sendRequest);
router.get("/requests", getRequests);
router.post("/respond-to-request", respondToRequest);
router.get("/list", getFriends);
router.delete("/delete-friend/:friendId", deleteFriend);

export default router;
