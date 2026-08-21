import type { Request } from "express";
import { UnauthorizedError } from "../errors/AppError";

export const requireAuth = (req: Request) => {
  if (!req.user || !req.supabaseUser) {
    throw new UnauthorizedError();
  }
  return {
    userId: req.user.id,
    supabase: req.supabaseUser,
  };
};
