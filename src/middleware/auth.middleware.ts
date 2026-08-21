import type { Request, Response, NextFunction } from "express";
import { createSupabaseUserClient, supabase } from "../config/supabase";
import { UnauthorizedError } from "../errors/AppError";
import { asyncHandler } from "./asyncHandler";

export const authMiddleware = asyncHandler(async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token not provided");
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new UnauthorizedError("Token invalid or expired");
  }

  req.user = data.user;
  req.userToken = token;
  req.supabaseUser = createSupabaseUserClient(token);
  next();
});
