import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { apiAuthenticatedLimiter } from "../middleware/rate-limiter";
import {
  checkBlockController,
  createBlockController,
  deleteBlockController,
} from "../controllers/blocks.controller";

const router = Router();
router.use(authMiddleware, apiAuthenticatedLimiter);

router.post("/:userId", createBlockController);
router.delete("/:userId", deleteBlockController);
router.get("/:userId", checkBlockController);

export default router;
