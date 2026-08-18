import type { SupabaseClient } from "@supabase/supabase-js";

export interface SessionParticipant {
    session_id: string;
    user_id: string;
    joined_at: string;
    left_at: string | null;
}

export const addParticipant = async (
    supabase: SupabaseClient,
    sessionId: string,
    userId: string
): Promise<SessionParticipant> => {
    const { data, error } = await supabase
        .from("session_participants")
        .insert({
            session_id: sessionId,
            user_id: userId,
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const removeParticipant = async (
    supabase: SupabaseClient,
    sessionId: string,
    userId: string
): Promise<SessionParticipant> => {
    const { data, error } = await supabase
        .from("session_participants")
        .update({
            left_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .eq("user_id", userId)
        .is("left_at", null)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
};

export const getSessionParticipants = async (
    supabase: SupabaseClient,
    sessionId: string,
): Promise<SessionParticipant[]> => {
    const { data, error } = await supabase
        .from("session_participants")
        .select()
        .eq("session_id", sessionId)
        .order("joined_at", { ascending: true });

    if (error) throw error;

    return data;
};

export const countUserSessionsSince = async (
    supabase: SupabaseClient,
    userId: string,
    since: string,
): Promise<number> => {
    const { count, error } = await supabase
        .from("session_participants")
        .select("session_id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("joined_at", since);

    if (error) throw error;

    return count ?? 0;
};
