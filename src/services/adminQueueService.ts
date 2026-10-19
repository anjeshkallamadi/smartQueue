
import { supabase } from "../lib/supabase";

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
