import type { SupabaseClient } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string | null;
  active: boolean;
  created_at: string;
}

export const getProfile = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select()
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

