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

const requireAuth = (req: Request) => {
  if (!req.user || !req.supabaseUser) throw new Error("Unauthorized");

  return {
    userId: req.user.id,
    supabase: req.supabaseUser,
  };
};

const param = (req: Request, name: string): string => {
  const value = req.params[name];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

const errorResponse = (res: Response, error: unknown) => {
  if (error instanceof Error && error.message === "Unauthorized") {
    return res.status(401).json({ error: error.message });
  }
  if (error instanceof Error && /not found/i.test(error.message)) {
    return res.status(404).json({ error: error.message });
  }
  return res.status(400).json({
    error: error instanceof Error ? error.message : "Request failed",
  });
};

// Return amount of daily sessions
export const getAmountOfDailySessions = async (req: Request, res: Response) => {
  try {
    const { userId, supabase } = requireAuth(req);

    const used = await getDailySessionCount(supabase, userId);

    return res.json({
      amount: used,
      remaining: Math.max(0, MAX_DAILY_SESSIONS - used),
      limit: MAX_DAILY_SESSIONS
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

export const createSessionController = async (req: Request, res: Response) => {
  try {
    const { userId, supabase } = requireAuth(req);
    const partnerId = req.body?.partnerId;

    const result = await createSessionWithParticipants(
      supabase,
      userId,
      typeof partnerId === "string" ? partnerId : "",
    );

    return res.status(201).json(result);
  } catch (error) {
    return errorResponse(res, error);
  }
};

export const getSessionController = async (req: Request, res: Response) => {
  try {
    const { supabase } = requireAuth(req);
    const session = await getSessionById(supabase, param(req, "id"));
    if (!session) return res.status(404).json({ error: "Session not found" });

    return res.json(session);
  } catch (error) {
    return errorResponse(res, error);
  }
};

export const getSessionParticipantsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { supabase } = requireAuth(req);
    return res.json(await getParticipants(supabase, param(req, "id")));
  } catch (error) {
    return errorResponse(res, error);
  }
};

export const leaveSessionController = async (req: Request, res: Response) => {
  try {
    const { userId, supabase } = requireAuth(req);
    const participant = await leaveSession(supabase, param(req, "id"), userId);
    return res.json({ participant });
  } catch (error) {
    return errorResponse(res, error);
  }
};

export const endSessionController = async (req: Request, res: Response) => {
  try {
    const { supabase } = requireAuth(req);
    // All termination paths use the service's centralized cleanup operation.
    const session = await endSession(
      supabase,
      param(req, "id"),
      req.body?.reason ?? "completed",
    );
    if (!session) return res.status(404).json({ error: "Session not found" });
    return res.json(session);
  } catch (error) {
    return errorResponse(res, error);
  }
};
