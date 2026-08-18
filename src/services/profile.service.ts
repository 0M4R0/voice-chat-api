import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../repositories/profile.repository";
import { getProfile, createProfile } from "../repositories/profile.repository";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;

const requireProfileId = (profileId: string): void => {
  if (!profileId?.trim()) {
    throw new Error("Profile ID is required");
  }
};

const normalizeUsername = (username?: string | null): string | null => {
  if (username == null) return null;

  const trimmed = username.trim();
  if (!trimmed) return null;

  if (
    trimmed.length < MIN_USERNAME_LENGTH ||
    trimmed.length > MAX_USERNAME_LENGTH
  ) {
    throw new Error("Username must be between 3 and 20 characters");
  }

  if (!USERNAME_PATTERN.test(trimmed)) {
    throw new Error(
      "Username can only contain letters, numbers and underscores",
    );
  }

  return trimmed;
};

export const getProfileById = async (
  supabase: SupabaseClient,
  profileId: string,
): Promise<Profile | null> => {
  requireProfileId(profileId);
  return await getProfile(supabase, profileId);
};

export const requireProfileById = async (
  supabase: SupabaseClient,
  profileId: string,
): Promise<Profile> => {
  const profile = await getProfileById(supabase, profileId);

  if (!profile) {
    throw new Error("Profile not found");
  }

  return profile;
};

export const createProfileById = async (
  supabase: SupabaseClient,
  profile: { id: string; username?: string | null },
): Promise<Profile> => {
  requireProfileId(profile.id);

  const existing = await getProfile(supabase, profile.id);
  if (existing) {
    throw new Error("Profile already exists");
  }

  return await createProfile(supabase, {
    id: profile.id,
    username: normalizeUsername(profile.username),
  });
};

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: unknown }).code === "23505";

export const getOrCreateProfile = async (
  supabase: SupabaseClient,
  profile: { id: string; username?: string | null },
): Promise<Profile> => {
  requireProfileId(profile.id);

  const existing = await getProfile(supabase, profile.id);
  if (existing) {
    return existing;
  }

  try {
    return await createProfile(supabase, {
      id: profile.id,
      username: normalizeUsername(profile.username),
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const winner = await getProfile(supabase, profile.id);
    if (winner) {
      return winner;
    }

    throw error;
  }
};
