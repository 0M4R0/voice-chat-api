import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { apiAuthenticatedLimiter } from "../middleware/rate-limiter";
import {
  createProfileController,
  getOrCreateProfileController,
  getProfileController,
} from "../controllers/profile.controller";

const router = Router();
router.use(authMiddleware, apiAuthenticatedLimiter);

router.get("/me", getOrCreateProfileController);
router.get("/:id", getProfileController);
router.post("/", createProfileController);

export default router;
