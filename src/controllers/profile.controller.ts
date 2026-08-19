import type { Request, Response } from "express";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  createProfileById,
  getOrCreateProfile,
  getProfileById,
} from "../services/profile.service";

class UnauthorizedError extends Error {}

// Require authentication
const requireAuth = (
  req: Request,
): {
  user: User;
  supabase: SupabaseClient;
} => {
  if (!req.user || !req.supabaseUser) {
    throw new UnauthorizedError("Unauthorized");
  }

  return {
    user: req.user,
    supabase: req.supabaseUser,
  };
};

const handleError = (res: Response, error: unknown): Response => {
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (error instanceof Error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: "Internal server error" });
};

const getProfileId = (req: Request): string => {
  const id = req.params.id;
  return Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
};

export const getProfileController = async (req: Request, res: Response) => {
  try {
    const { supabase } = requireAuth(req);

    // Get the profile of a user using their ID
    const profile = await getProfileById(supabase, getProfileId(req));

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.json(profile);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createProfileController = async (req: Request, res: Response) => {
  try {
    const { supabase, user } = requireAuth(req);

    // Create a profile for the user
    const profile = await createProfileById(supabase, {
      id: user.id,
      username: req.body?.username ?? null,
    });

    return res.status(201).json(profile);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getOrCreateProfileController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { supabase, user } = requireAuth(req);
    const profile = await getOrCreateProfile(supabase, {
      id: user.id,
      username: req.body?.username ?? null,
    });

    return res.json(profile);
  } catch (error) {
    return handleError(res, error);
  }
};
