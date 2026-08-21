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
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();
router.use(authMiddleware, apiAuthenticatedLimiter);

router.get("/daily", asyncHandler(getAmountOfDailySessions));
router.post("/", asyncHandler(createSessionController));
router.get("/:id/participants", asyncHandler(getSessionParticipantsController));
router.post("/:id/leave", asyncHandler(leaveSessionController));
router.post("/:id/end", asyncHandler(endSessionController));
router.get("/:id", asyncHandler(getSessionController));

export default router;
