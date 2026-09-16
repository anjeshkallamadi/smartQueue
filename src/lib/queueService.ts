import { supabase } from "./supabase";

// Create a new queue
export const createQueue = async (
  serviceId: string,
  date: string,
  averageServiceTime: number = 10
) => {
  const { data, error } = await supabase
    .from("queues")
    .insert({
      service_id: serviceId,
      date,
      status: "waiting",
      current_token: 0,
      average_service_time: averageServiceTime,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Get all queues
export const getQueues = async () => {
  const { data, error } = await supabase
    .from("queues")
    .select(`
      id,
      service_id,
      date,
      status,
      current_token,
      average_service_time,
      services (
        name,
        description,
        category,
        location
      )
    `)
    .order("date", { ascending: true });

  if (error) throw error;

  return data;
};

// Join a queue
export const joinQueue = async (queueId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not logged in");
  }

  // Check queue status
  const { data: queue, error: queueError } = await supabase
    .from("queues")
    .select("status")
    .eq("id", queueId)
    .single();

  if (queueError) throw queueError;

  if (queue.status === "paused") {
    throw new Error("This queue is currently paused");
  }

  // Find the highest token number already used
  const { data: lastEntry, error: lastEntryError } = await supabase
    .from("queue_entries")
    .select("token_number")
    .eq("queue_id", queueId)
    .order("token_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastEntryError) throw lastEntryError;

  const nextToken = (lastEntry?.token_number ?? 0) + 1;

  // Create queue entry
  const { data, error } = await supabase
    .from("queue_entries")
    .insert({
      queue_id: queueId,
      user_id: user.id,
      token_number: nextToken,
      status: "waiting",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Call the next token
export const callNextToken = async (queueId: string) => {
  const { data: queue, error: queueError } = await supabase
    .from("queues")
    .select("current_token")
    .eq("id", queueId)
    .single();

  if (queueError) throw queueError;

  const nextToken = queue.current_token + 1;

  const { data, error } = await supabase
    .from("queues")
    .update({
      current_token: nextToken,
    })
    .eq("id", queueId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Skip the current token
export const skipToken = async (queueId: string) => {
  const { data: queue, error: queueError } = await supabase
    .from("queues")
    .select("current_token")
    .eq("id", queueId)
    .single();

  if (queueError) throw queueError;

  const currentToken = queue.current_token;

  if (currentToken === 0) {
    throw new Error("No token is currently being served");
  }

  // Mark current token as skipped
  const { error: entryError } = await supabase
    .from("queue_entries")
    .update({
      status: "skipped",
    })
    .eq("queue_id", queueId)
    .eq("token_number", currentToken);

  if (entryError) throw entryError;

  // Move to next token
  const { data, error } = await supabase
    .from("queues")
    .update({
      current_token: currentToken + 1,
    })
    .eq("id", queueId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Pause a queue
export const pauseQueue = async (queueId: string) => {
  const { data, error } = await supabase
    .from("queues")
    .update({
      status: "paused",
    })
    .eq("id", queueId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Resume a queue
export const resumeQueue = async (queueId: string) => {
  const { data, error } = await supabase
    .from("queues")
    .update({
      status: "waiting",
    })
    .eq("id", queueId)
    .select()
    .single();

  if (error) throw error;

  return data;
};