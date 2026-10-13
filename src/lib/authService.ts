import { supabase } from "./supabase";

/**
 * Returns the currently authenticated user's ID.
 * Returns null when no authenticated user exists.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}