import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader: string | undefined = req.headers.authorization;
  const token: string | null = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: "Token required" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
