import { Router } from "express";
import {
  registerUser,
  loginUser,
  refreshTokenUser,
  logoutUser,
} from "../controllers/auth.controller";
import { loginLimiter } from "../middleware/rateLimiter";

const router = Router();

// Routes
router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/refresh-token", refreshTokenUser);
router.post("/logout", logoutUser);

export default router;
