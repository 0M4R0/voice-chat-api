import type { Request, Response } from "express";
import { getProfileById } from "../services/profile.service";
import { NotFoundError } from "../errors/AppError";
import { requireAuth } from "../helper/auth.helper";

const getProfileId = (req: Request): string => {
  const id = req.params.id;
  return Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
};

export const getProfileController = async (req: Request, res: Response) => {
  const { supabase } = requireAuth(req);

  // Get the profile of a user using their ID
  const profile = await getProfileById(supabase, getProfileId(req));

  if (!profile) {
    throw new NotFoundError("Profile not found");
  }

  return res.json(profile);
};
