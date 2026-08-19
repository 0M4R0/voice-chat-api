import type { Request, Response } from "express";
import { createReportService } from "../services/reports.service";

export const createReportController = async (req: Request, res: Response) => {
  if (!req.user || !req.supabaseUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Never accept reporter_id from the client; it comes from the verified JWT.
    const report = await createReportService(req.supabaseUser, {
      reporter_id: req.user.id,
      reported_user_id: req.body?.reportedUserId ?? "",
      session_id: req.body?.sessionId ?? null,
      reason: req.body?.reason ?? "",
    });
    return res.status(201).json(report);
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Request failed",
    });
  }
};
