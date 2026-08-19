import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createReport,
  type NewReport,
  type Report,
} from "../repositories/reports.repository";
import { getSessionParticipants } from "../repositories/session-participants.repository";

export const createReportService = async (
  supabase: SupabaseClient,
  report: NewReport,
): Promise<Report> => {
  if (!report.reporter_id?.trim() || !report.reported_user_id?.trim()) {
    throw new Error("Reporter and reported user IDs are required");
  }
  if (report.reporter_id === report.reported_user_id) {
    throw new Error("Cannot report yourself");
  }

  const reason = report.reason?.trim();
  if (!reason || reason.length > 1000) {
    throw new Error("Report reason must be between 1 and 1000 characters");
  }

  if (report.session_id) {
    // Reports tied to a session must reference its actual participants.
    const participants = await getSessionParticipants(supabase, report.session_id);
    const participantIds = new Set(participants.map((participant) => participant.user_id));
    if (!participantIds.has(report.reporter_id) || !participantIds.has(report.reported_user_id)) {
      throw new Error("Users did not participate in this session");
    }
  }

  return createReport(supabase, { ...report, reason });
};
