import type { Request, Response } from "express";
import { createReportService } from "../services/reports.service";
import { requireAuth } from "../helper/auth.helper";

export const createReportController = async (req: Request, res: Response) => {
  const { userId, supabase } = requireAuth(req);

  // Never accept reporter_id from the client; it comes from the verified JWT.
  const report = await createReportService(supabase, {
    reporter_id: userId,
    reported_user_id: req.body?.reportedUserId ?? "",
    session_id: req.body?.sessionId ?? null,
    reason: req.body?.reason ?? "",
  });
  return res.status(201).json(report);
};
