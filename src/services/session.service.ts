import type { SupabaseClient } from "@supabase/supabase-js";
import {
  countUserSessionsSince,
  addParticipant,
  getSessionParticipants,
  removeParticipant,
} from "../repositories/session-participants.repository";
import {
  createSession,
  endSession as endSessionRecord,
  getSession,
  startSession,
  type Session,
} from "../repositories/session.repository";

export const MAX_DAILY_SESSIONS = 5;

export type SessionEndReason =
  "completed" | "cancelled" | "disconnect" | "next" | "timeout" | "error";

export interface CreatedSession {
  session: Session;
  participants: Awaited<ReturnType<typeof addParticipant>>[];
}

const requireId = (value: string, name: string): void => {
  if (!value?.trim()) throw new Error(`${name} is required`);
};

const startOfToday = (now = new Date()): string => {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const toSessionStatus = (
  reason: SessionEndReason,
): "completed" | "cancelled" =>
  reason === "completed" || reason === "timeout" ? "completed" : "cancelled";

export const getDailySessionCount = async (
  supabase: SupabaseClient,
  userId: string,
  now?: Date,
): Promise<number> => {
  requireId(userId, "User ID");
  return countUserSessionsSince(supabase, userId, startOfToday(now));
};

export const canStartSession = async (
  supabase: SupabaseClient,
  userId: string,
  now?: Date,
): Promise<boolean> => {
  // Obtain the daily session count for the user
  const count = await getDailySessionCount(supabase, userId, now);

  // Check if the count is below the daily session limit
  return count < MAX_DAILY_SESSIONS;
};

export const createSessionWithParticipants = async (
  supabase: SupabaseClient,
  firstUserId: string,
  secondUserId: string,
): Promise<CreatedSession> => {
  requireId(firstUserId, "First user ID");
  requireId(secondUserId, "Second user ID");

  if (firstUserId === secondUserId) {
    throw new Error("A session requires two different users");
  }

  const [firstAllowed, secondAllowed] = await Promise.all([
    canStartSession(supabase, firstUserId),
    canStartSession(supabase, secondUserId),
  ]);

  if (!firstAllowed || !secondAllowed) {
    throw new Error("Daily session limit reached");
  }

  const session = await createSession(supabase);

  try {
    const participants = await Promise.all([
      addParticipant(supabase, session.id, firstUserId),
      addParticipant(supabase, session.id, secondUserId),
    ]);

    const activeSession = await startSession(supabase, session.id);
    return { session: activeSession, participants };
  } catch (error) {
    // A partially-created session must not remain in `waiting` forever.
    await endSessionRecord(supabase, session.id, "cancelled").catch(
      () => undefined,
    );
    throw error;
  }
};

export const getSessionById = async (
  supabase: SupabaseClient,
  sessionId: string,
): Promise<Session | null> => {
  requireId(sessionId, "Session ID");
  return getSession(supabase, sessionId);
};

export const getParticipants = async (
  supabase: SupabaseClient,
  sessionId: string,
) => {
  requireId(sessionId, "Session ID");

  return getSessionParticipants(supabase, sessionId);
};

export const leaveSession = async (
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
) => {
  requireId(sessionId, "Session ID");
  requireId(userId, "User ID");

  const session = await getSession(supabase, sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status !== "active") return null;

  return removeParticipant(supabase, sessionId, userId);
};

export const endSession = async (
  supabase: SupabaseClient,
  sessionId: string,
  reason: SessionEndReason = "completed",
): Promise<Session | null> => {
  requireId(sessionId, "Session ID");

  const session = await getSession(supabase, sessionId);
  if (!session) return null;
  if (session.status === "completed" || session.status === "cancelled") {
    return session;
  }

  const participants = await getSessionParticipants(supabase, sessionId);
  await Promise.all(
    participants
      .filter((participant) => participant.left_at === null)
      .map((participant) =>
        removeParticipant(supabase, sessionId, participant.user_id),
      ),
  );

  return endSessionRecord(supabase, sessionId, toSessionStatus(reason));
};
