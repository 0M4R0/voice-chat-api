import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { apiAuthenticatedLimiter } from "../middleware/rate-limiter";
import { getProfileController } from "../controllers/profile.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();
router.use(authMiddleware, apiAuthenticatedLimiter);

router.get("/:id", asyncHandler(getProfileController));

export default router;
