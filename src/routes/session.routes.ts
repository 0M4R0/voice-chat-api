import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { apiAuthenticatedLimiter } from "../middleware/rate-limiter";
import {
  createSessionController,
  endSessionController,
  getAmountOfDailySessions,
  getSessionController,
  getSessionParticipantsController,
  leaveSessionController,
} from "../controllers/session.controller";

const router = Router();
router.use(authMiddleware, apiAuthenticatedLimiter);

router.get("/daily", getAmountOfDailySessions);
router.post("/", createSessionController);
router.get("/:id/participants", getSessionParticipantsController);
router.post("/:id/leave", leaveSessionController);
router.post("/:id/end", endSessionController);
router.get("/:id", getSessionController);

export default router;
