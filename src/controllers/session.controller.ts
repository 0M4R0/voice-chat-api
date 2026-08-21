import type { Request, Response } from "express";
import {
  getDailySessionCount,
  createSessionWithParticipants,
  getSessionById,
  getParticipants,
  leaveSession,
  endSession,
  MAX_DAILY_SESSIONS,
} from "../services/session.service";
import { NotFoundError } from "../errors/AppError";
import { requireAuth } from "../helper/auth.helper";

const param = (req: Request, name: string): string => {
  const value = req.params[name];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

// Return amount of daily sessions
export const getAmountOfDailySessions = async (req: Request, res: Response) => {
  const { userId, supabase } = requireAuth(req);

  const used = await getDailySessionCount(supabase, userId);

  return res.json({
    amount: used,
    remaining: Math.max(0, MAX_DAILY_SESSIONS - used),
    limit: MAX_DAILY_SESSIONS,
  });
};

export const createSessionController = async (req: Request, res: Response) => {
  const { userId, supabase } = requireAuth(req);
  const partnerId = req.body?.partnerId;

  const result = await createSessionWithParticipants(
    supabase,
    userId,
    typeof partnerId === "string" ? partnerId : "",
  );

  return res.status(201).json(result);
};

export const getSessionController = async (req: Request, res: Response) => {
  const { supabase } = requireAuth(req);
  const session = await getSessionById(supabase, param(req, "id"));

  if (!session) {
    throw new NotFoundError("Session not found");
  }

  return res.json(session);
};

export const getSessionParticipantsController = async (
  req: Request,
  res: Response,
) => {
  const { supabase } = requireAuth(req);
  return res.json(await getParticipants(supabase, param(req, "id")));
};

export const leaveSessionController = async (req: Request, res: Response) => {
  const { userId, supabase } = requireAuth(req);
  const participant = await leaveSession(supabase, param(req, "id"), userId);
  return res.json({ participant });
};

export const endSessionController = async (req: Request, res: Response) => {
  const { supabase } = requireAuth(req);
  // All termination paths use the service's centralized cleanup operation.
  const session = await endSession(
    supabase,
    param(req, "id"),
    req.body?.reason ?? "completed",
  );
  if (!session) {
    throw new NotFoundError("Session not found");
  }
  return res.json(session);
};
