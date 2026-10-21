
import { supabase } from "../lib/supabase";

export interface AdminPendingEntry {
  entry_id: string;
  token_number: number | null;
  customer_name: string;
  joined_at: string;
}

export interface ManagedQueue {
  queue_id: string;
  service_name: string;
  queue_status: string;
  waiting_count: number;
  called_token: number | null;
  pending_entries?: AdminPendingEntry[];
  checkin_code?: string | null;
  checkin_expires_at?: string | null;
  no_show_grace_minutes?: number;
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

  return (data ?? []) as ManagedQueue[];
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




export interface QueueCheckinCode {
  checkin_code: string;
  expires_at: string;
}

export async function adminCreateQueueCheckinCode(
  queueId: string
): Promise<QueueCheckinCode> {
  const { data, error } = await supabase.rpc(
    "admin_create_queue_checkin_code",
    { p_queue_id: queueId }
  );
  if (error) throw new Error(error.message);

  const code = (data as QueueCheckinCode[] | null)?.[0];
  if (!code) throw new Error("The server did not return a check-in code.");
  return code;
}

export async function adminListPendingEntries(
  queueId: string
): Promise<AdminPendingEntry[]> {
  const { data, error } = await supabase.rpc(
    "admin_list_pending_entries",
    { p_queue_id: queueId }
  );
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminPendingEntry[];
}

export async function adminVerifyPendingEntry(entryId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_verify_pending_entry", {
    p_entry_id: entryId,
  });
  if (error) throw new Error(error.message);
}

export async function adminRejectPendingEntry(entryId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_reject_pending_entry", {
    p_entry_id: entryId,
  });
  if (error) throw new Error(error.message);
}

export async function adminMarkCurrentNoShow(
  queueId: string
): Promise<number> {
  const { data, error } = await supabase.rpc(
    "admin_mark_current_no_show",
    { p_queue_id: queueId }
  );
  if (error) throw new Error(error.message);
  if (typeof data !== "number") {
    throw new Error("No currently called token was returned.");
  }
  return data;
}

export async function adminExpireNoShows(queueId: string): Promise<number> {
  const { data, error } = await supabase.rpc("admin_expire_no_shows", {
    p_queue_id: queueId,
  });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}


export async function adminGetNoShowGrace(
  queueId: string
): Promise<number> {
  const { data, error } = await supabase.rpc("admin_get_no_show_grace", {
    p_queue_id: queueId,
  });
  if (error) throw new Error(error.message);
  return Number(data ?? 3);
}

export async function adminSetNoShowGrace(
  queueId: string,
  minutes: number
): Promise<number> {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 30) {
    throw new Error("Grace period must be between 1 and 30 minutes.");
  }

  const { data, error } = await supabase.rpc("admin_set_no_show_grace", {
    p_queue_id: queueId,
    p_minutes: minutes,
  });
  if (error) throw new Error(error.message);
  return Number(data);
}
