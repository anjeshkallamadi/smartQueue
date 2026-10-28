
import { supabase } from "../lib/supabase";

export interface ManagedQueue {
  queue_id: string;
  service_id: string;
  service_name: string;
  queue_status: string;
  waiting_count: number;
  called_token: number | null;
}

export interface AdminCalledEntry {
  entry_id: string;
  token_number: number;
  entry_status: string;
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data: userData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !userData.user) {
    return false;
  }

  const { data, error } = await supabase.rpc(
    "is_queue_admin"
  );

  if (error) {
    throw new Error(error.message);
  }

  return data === true;
}

export async function getMyManagedQueues(): Promise<ManagedQueue[]> {
  const { data, error } = await supabase.rpc(
    "get_my_managed_queues"
  );

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Omit<ManagedQueue, "service_id">[];
  if (rows.length === 0) return [];

  // The dashboard RPC intentionally only returns owner-scoped queues.
  // Read their service IDs separately without changing that RPC's return type.
  const { data: records, error: lookupError } = await supabase
    .from("queues")
    .select("id, service_id")
    .in("id", rows.map((row) => row.queue_id));
  if (lookupError) {
    throw new Error(lookupError.message);
  }
  const serviceIds = new Map(
    (records ?? []).map((record) => [record.id, record.service_id])
  );
  return rows.map((row) => ({
    ...row,
    service_id: serviceIds.get(row.queue_id) ?? "",
  }));
}

export async function adminCallNext(
  queueId: string
): Promise<AdminCalledEntry | null> {
  const { data, error } = await supabase.rpc(
    "admin_call_next",
    { p_queue_id: queueId }
  );

  if (error) {
    throw new Error(error.message);
  }

  return (data as AdminCalledEntry[] | null)?.[0] ?? null;
}

export async function adminSkipCurrent(
  queueId: string
): Promise<number | null> {
  const { data, error } = await supabase.rpc(
    "admin_skip_current",
    { p_queue_id: queueId }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as number | null;
}


export async function adminPauseQueue(
  queueId: string
): Promise<string> {
  const { data, error } = await supabase.rpc(
    "admin_pause_queue",
    { p_queue_id: queueId }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}

export async function adminResumeQueue(
  queueId: string
): Promise<string> {
  const { data, error } = await supabase.rpc(
    "admin_resume_queue",
    { p_queue_id: queueId }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}


