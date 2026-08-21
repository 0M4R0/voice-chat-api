import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../repositories/profile.repository";
import { getProfile } from "../repositories/profile.repository";

const requireProfileId = (profileId: string): void => {
  if (!profileId.trim()) {
    throw new Error("Profile ID is required");
  }
};

export const getProfileById = async (
  supabase: SupabaseClient,
  profileId: string,
): Promise<Profile | null> => {
  requireProfileId(profileId);
  return await getProfile(supabase, profileId);
};
