import type { SupabaseClient } from "@supabase/supabase-js";

export interface Block {
  blocker_id: string;
  blocked_id: string;
}

export const createBlock = async (
  supabase: SupabaseClient,
  blockerId: string,
  blockedId: string,
) => {
  const { data, error } = await supabase
    .from("blocks")
    .insert({
      blocker_id: blockerId,
      blocked_id: blockedId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const isBlocked = async (
  supabase: SupabaseClient,
  blockerId: string,
  blockedId: string,
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
};

export const hasBlockRelationship = async (
  supabase: SupabaseClient,
  firstUserId: string,
  secondUserId: string,
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("blocks")
    .select("blocker_id")
    .or(
      `and(blocker_id.eq.${firstUserId},blocked_id.eq.${secondUserId}),and(blocker_id.eq.${secondUserId},blocked_id.eq.${firstUserId})`,
    )
    .limit(1);

  if (error) throw error;

  return data.length > 0;
};

export const deleteBlock = async (
  supabase: SupabaseClient,
  blockerId: string,
  blockedId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);

  if (error) throw error;
};
