import type { Request, Response } from "express";
import {
  createBlockService,
  deleteBlockService,
  hasBlockRelationshipService,
} from "../services/blocks.service";
import { requireAuth } from "../helper/auth.helper";

const targetId = (req: Request): string => {
  const value = req.params.userId ?? req.body?.blockedId;
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

export const createBlockController = async (req: Request, res: Response) => {
  const { userId, supabase } = requireAuth(req);
  return res
    .status(201)
    .json(await createBlockService(supabase, userId, targetId(req)));
};

export const deleteBlockController = async (req: Request, res: Response) => {
  const { userId, supabase } = requireAuth(req);
  await deleteBlockService(supabase, userId, targetId(req));
  return res.status(204).send();
};

export const checkBlockController = async (req: Request, res: Response) => {
  const { userId, supabase } = requireAuth(req);
  const otherUserId = targetId(req);
  return res.json({
    blocked: await hasBlockRelationshipService(supabase, userId, otherUserId),
  });
};
