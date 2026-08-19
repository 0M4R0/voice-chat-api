import type { Request, Response } from "express";
import {
  createBlockService,
  deleteBlockService,
  hasBlockRelationshipService,
} from "../services/blocks.service";

const auth = (req: Request) => {
  if (!req.user || !req.supabaseUser) throw new Error("Unauthorized");
  return { userId: req.user.id, supabase: req.supabaseUser };
};

const targetId = (req: Request): string => {
  const value = req.params.userId ?? req.body?.blockedId;
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

const handleError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "Request failed";
  return res
    .status(message === "Unauthorized" ? 401 : 400)
    .json({ error: message });
};

export const createBlockController = async (req: Request, res: Response) => {
  try {
    const { userId, supabase } = auth(req);
    return res
      .status(201)
      .json(await createBlockService(supabase, userId, targetId(req)));
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteBlockController = async (req: Request, res: Response) => {
  try {
    const { userId, supabase } = auth(req);
    await deleteBlockService(supabase, userId, targetId(req));
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
};

export const checkBlockController = async (req: Request, res: Response) => {
  try {
    const { userId, supabase } = auth(req);
    const otherUserId = targetId(req);
    return res.json({
      blocked: await hasBlockRelationshipService(supabase, userId, otherUserId),
    });
  } catch (error) {
    return handleError(res, error);
  }
};
