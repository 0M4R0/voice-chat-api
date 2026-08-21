import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { apiAuthenticatedLimiter } from "../middleware/rate-limiter";
import {
  checkBlockController,
  createBlockController,
  deleteBlockController,
} from "../controllers/blocks.controller";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();
router.use(authMiddleware, apiAuthenticatedLimiter);

router.post("/:userId", asyncHandler(createBlockController));
router.delete("/:userId", asyncHandler(deleteBlockController));
router.get("/:userId", asyncHandler(checkBlockController));

export default router;
