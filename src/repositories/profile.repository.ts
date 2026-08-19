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

export const createProfile = async (
  supabase: SupabaseClient,
  profile: {
    id: string;
    username?: string | null;
  },
): Promise<Profile> => {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: profile.id,
      username: profile.username ?? null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
