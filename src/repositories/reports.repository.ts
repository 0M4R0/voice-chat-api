import type { SupabaseClient } from "@supabase/supabase-js";

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  session_id?: string | null;
  reason: string;
  created_at: string;
}

export type NewReport = Omit<Report, "id" | "created_at">;

export const createReport = async (
  supabase: SupabaseClient,
  report: NewReport,
): Promise<Report> => {
  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: report.reporter_id,
      reported_user_id: report.reported_user_id,
      session_id: report.session_id ?? null,
      reason: report.reason,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
