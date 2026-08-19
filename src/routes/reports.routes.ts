import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { apiAuthenticatedLimiter } from "../middleware/rate-limiter";
import { createReportController } from "../controllers/reports.controller";

const router = Router();
router.use(authMiddleware, apiAuthenticatedLimiter);
router.post("/", createReportController);

export default router;
