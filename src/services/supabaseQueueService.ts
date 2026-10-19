import { supabase } from "../lib/supabase";

/** The database uses queue UUIDs, not frontend service names. */
export interface SecureQueueEntry {
  entry_id: string;
  queue_id: string;
  token_number: number;
  entry_status: string;
  people_ahead: number;
}

export interface QueueRecord {
  id: string;
  service_id: string;
  status: string;
  current_token: number | null;
  average_service_time: number | null;
}

export function formatQueueToken(tokenNumber: number): string {
  return `A${String(tokenNumber).padStart(3, "0")}`;
}

/** Atomically join a queue through the authenticated Supabase RPC. */
export async function joinSupabaseQueue(queueId: string): Promise<SecureQueueEntry> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(queueId)) {
    throw new Error("A valid Supabase queue UUID is required.");
  }

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    throw new Error("Please log in before joining a queue.");
  }

  const { data, error } = await supabase.rpc("join_queue_secure", {
    p_queue_id: queueId,
  });
  if (error) throw new Error(error.message);

  const entry = (data as SecureQueueEntry[] | null)?.[0];
  if (!entry) throw new Error("The server did not return a queue entry.");
  return entry;
}

/** Read the authenticated user's current active entry. */
export async function getMyActiveQueueEntry(queueId: string): Promise<{
  id: string;
  queue_id: string;
  token_number: number;
  status: string;
  joined_at: string;
} | null> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    throw new Error("Please log in to view your queue entry.");
  }

  const { data, error } = await supabase
    .from("queue_entries")
    .select("id, queue_id, token_number, status, joined_at")
    .eq("queue_id", queueId)
    .eq("user_id", userData.user.id)
    .in("status", ["waiting", "called"])
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/** Read a queue by its Supabase UUID. */
export async function getSupabaseQueue(queueId: string): Promise<QueueRecord> {
  const { data, error } = await supabase
    .from("queues")
    .select("id, service_id, status, current_token, average_service_time")
    .eq("id", queueId)
    .single();

  if (error) throw new Error(error.message);
  return data as QueueRecord;
}
