import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewReport, Report } from "../repositories/reports.repository";
import { createReport } from "../repositories/reports.repository";

// Helper function to require report fields
const requireReportFields = (report: NewReport): void => {
  if (!report.reporter_id?.trim()) {
    throw new Error("Reporter ID is required");
  }

  if (!report.reported_user_id?.trim()) {
    throw new Error("Reported user ID is required");
  }

  if (!report.session_id?.trim()) {
    throw new Error("Session ID is required");
  }

  if (!report.reason?.trim()) {
    throw new Error("Reason is required");
  }
};

export const createReportService = async (
  supabase: SupabaseClient,
  report: NewReport,
): Promise<Report> => {
  // Ensure report fields are valid
  requireReportFields(report);

  return await createReport(supabase, report);
};
