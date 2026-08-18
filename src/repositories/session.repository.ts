import type { SupabaseClient } from "@supabase/supabase-js";

export type SessionStatus = "waiting" | "active" | "completed" | "cancelled";

export interface Session {
  id: string;
  started_at: string | null;
  ended_at: string | null;
  status: SessionStatus;
}

export const createSession = async (
  supabase: SupabaseClient,
): Promise<Session> => {
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      status: "waiting",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const startSession = async (
  supabase: SupabaseClient,
  sessionId: string,
): Promise<Session> => {
  const { data, error } = await supabase
    .from("sessions")
    .update({
      started_at: new Date().toISOString(),
      status: "active",
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const endSession = async (
  supabase: SupabaseClient,
  sessionId: string,
  status: "completed" | "cancelled",
): Promise<Session> => {
  const { data, error } = await supabase
    .from("sessions")
    .update({
      ended_at: new Date().toISOString(),
      status,
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const getSession = async (
  supabase: SupabaseClient,
  sessionId: string,
): Promise<Session | null> => {
  const { data, error } = await supabase
    .from("sessions")
    .select()
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;

  return data;
};
