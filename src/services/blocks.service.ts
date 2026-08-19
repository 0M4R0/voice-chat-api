import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Block,
  createBlock,
  isBlocked,
  hasBlockRelationship,
  deleteBlock,
} from "../repositories/blocks.repository";
import { getProfile } from "../repositories/profile.repository";

// Helper function to require user IDs
const requireUserIds = (firstUserId: string, secondUserId: string): void => {
  if (!firstUserId?.trim() || !secondUserId?.trim()) {
    throw new Error("User ID is required");
  }
};

export const createBlockService = async (
  supabase: SupabaseClient,
  blockerId: string,
  blockedId: string,
): Promise<Block> => {
  requireUserIds(blockerId, blockedId);

  // Ensure that the blocker and blocked users are not the same
  if (blockedId === blockerId) {
    throw new Error("Cannot block yourself");
  }

  // Get profiles for the blocker and blocked users
  const [blocker, blocked] = await Promise.all([
    getProfile(supabase, blockerId),
    getProfile(supabase, blockedId),
  ]);

  // Ensure that both profiles are found
  if (!blocker) {
    throw new Error("Blocker profile not found");
  }

  if (!blocked) {
    throw new Error("User not found");
  }

  // Verify that the blocked user is not already blocked by the blocker
  if (await isBlocked(supabase, blockerId, blockedId)) {
    throw new Error("Already blocked");
  }

  return await createBlock(supabase, blockerId, blockedId);
};

export const isBlockedService = async (
  supabase: SupabaseClient,
  blockerId: string,
  blockedId: string,
): Promise<boolean> => {
  requireUserIds(blockerId, blockedId);

  // Check if the users are the same
  if (blockerId === blockedId) {
    return false;
  }

  return await isBlocked(supabase, blockerId, blockedId);
};

export const hasBlockRelationshipService = async (
  supabase: SupabaseClient,
  firstUserId: string,
  secondUserId: string,
): Promise<boolean> => {
  requireUserIds(firstUserId, secondUserId);

  // Check if the users are the same
  if (firstUserId === secondUserId) {
    return false;
  }

  return await hasBlockRelationship(supabase, firstUserId, secondUserId);
};

export const deleteBlockService = async (
  supabase: SupabaseClient,
  blockerId: string,
  blockedId: string,
): Promise<void> => {
  requireUserIds(blockerId, blockedId);

  // Check if the users are the same
  if (blockedId === blockerId) {
    throw new Error("Cannot unblock yourself");
  }

  if (!(await isBlocked(supabase, blockerId, blockedId))) {
    throw new Error("Block not found");
  }

  await deleteBlock(supabase, blockerId, blockedId);
};
