import { supabase } from "../lib/supabase";

export type AppNotification = {
  id: string;
  created_at: string;
  user_id: string | null;
  queue_entry_id: string | null;
  type: string | null;
  message: string | null;
  is_read: boolean | null;
};

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("User is not logged in.");
  return data.user.id;
}

export async function getMyNotifications(): Promise<AppNotification[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("notifications")
    .select("id,created_at,user_id,queue_entry_id,type,message,is_read")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AppNotification[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const userId = await getCurrentUserId();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .or("is_read.eq.false,is_read.is.null");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .or("is_read.eq.false,is_read.is.null");
  if (error) throw new Error(error.message);
}
