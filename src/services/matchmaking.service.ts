import type { SupabaseClient } from "@supabase/supabase-js";
import { hasBlockRelationshipService } from "./blocks.service";
import {
  canStartSession,
  createSessionWithParticipants,
  type CreatedSession,
} from "./session.service";

export interface WaitingUser {
  userId: string;
  socketId: string;
  joinedAt: number;
}

export interface MatchResult {
  userA: WaitingUser;
  userB: WaitingUser;
  session: CreatedSession;
}

const waitingUsers = new Map<string, WaitingUser>();
const matchingUsers = new Set<string>();

const requireUserId = (userId: string): void => {
  if (!userId?.trim()) throw new Error("User ID is required");
};

export const addToQueue = async (
  supabase: SupabaseClient,
  userId: string,
  socketId = userId,
): Promise<void> => {
  requireUserId(userId);
  requireUserId(socketId);
  if (!(await canStartSession(supabase, userId))) {
    throw new Error("Daily session limit reached");
  }
  if (!waitingUsers.has(userId)) {
    waitingUsers.set(userId, { userId, socketId, joinedAt: Date.now() });
  }
};

export const removeFromQueue = (userId: string): void => {
  requireUserId(userId);
  waitingUsers.delete(userId);
  matchingUsers.delete(userId);
};

export const isWaiting = (userId: string): boolean => {
  requireUserId(userId);
  return waitingUsers.has(userId);
};

export const getWaitingUsers = (): WaitingUser[] =>
  Array.from(waitingUsers.values()).sort((a, b) => a.joinedAt - b.joinedAt);

export const findMatch = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<MatchResult | null> => {
  requireUserId(userId);
  const user = waitingUsers.get(userId);
  if (!user || matchingUsers.has(userId)) return null;

  const candidates = getWaitingUsers().filter(
    (candidate) =>
      candidate.userId !== userId && !matchingUsers.has(candidate.userId),
  );

  for (const candidate of candidates) {
    matchingUsers.add(userId);
    matchingUsers.add(candidate.userId);
    try {
      const blocked = await hasBlockRelationshipService(
        supabase,
        userId,
        candidate.userId,
      );
      if (blocked) continue;

      const session = await createSessionWithParticipants(
        supabase,
        userId,
        candidate.userId,
      );
      waitingUsers.delete(userId);
      waitingUsers.delete(candidate.userId);
      return { userA: user, userB: candidate, session };
    } finally {
      matchingUsers.delete(userId);
      matchingUsers.delete(candidate.userId);
    }
  }
  return null;
};

export const clearQueue = (): void => {
  waitingUsers.clear();
  matchingUsers.clear();
};
