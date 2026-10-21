import { supabase } from "../lib/supabase";

/** The database uses queue UUIDs, not frontend service names. */
export interface SecureQueueEntry {
  entry_id: string;
  queue_id: string;
  token_number: number | null;
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
  token_number: number | null;
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
    .in("status", ["pending_verification", "waiting", "called"])
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


export interface AvailableServiceQueue {
  queueId: string;
  serviceId: string;
  serviceName: string;
  description: string;
  status: string;
}

/**
 * Loads real services and their queues from Supabase.
 * Only active queues are shown as joinable services.
 */
export async function getAvailableServiceQueues():
  Promise<AvailableServiceQueue[]> {

  const { data: queues, error: queueError } = await supabase
    .from("queues")
    .select("id, service_id, status")
    .eq("status", "active");

  if (queueError) {
    throw new Error(queueError.message);
  }

  if (!queues?.length) {
    return [];
  }

  const serviceIds = [
    ...new Set(queues.map((queue) => queue.service_id)),
  ];

  const { data: services, error: serviceError } = await supabase
    .from("services")
    .select("id, name, description")
    .in("id", serviceIds);

  if (serviceError) {
    throw new Error(serviceError.message);
  }

  const serviceMap = new Map(
    (services ?? []).map((service) => [service.id, service])
  );

  return queues.flatMap((queue) => {
    const service = serviceMap.get(queue.service_id);

    if (!service) return [];

    return [{
      queueId: queue.id,
      serviceId: service.id,
      serviceName: service.name,
      description: service.description ?? "",
      status: queue.status,
    }];
  });
}


export interface MyQueuePosition {
  token_number: number;
  entry_status: string;
  people_ahead: number;
}

export async function getMyQueuePosition(
  queueId: string
): Promise<MyQueuePosition> {
  const { data, error } = await supabase.rpc(
    "get_my_queue_position",
    { p_queue_id: queueId }
  );

  if (error) {
    throw new Error(error.message);
  }

  const position = (data as MyQueuePosition[] | null)?.[0];

  if (!position) {
    throw new Error("Queue position not found.");
  }

  return position;
}


export async function getNowServingToken(
  queueId: string
): Promise<number | null> {
  const { data, error } = await supabase.rpc(
    "get_queue_now_serving",
    { p_queue_id: queueId }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as number | null;
}

export interface MyActiveQueue {
  queueId: string;
  serviceName: string;
  tokenNumber: number | null;
  status: string;
  peopleAhead: number | null;
  estimatedWaitMinutes: number | null;
}

/**
 * Gets every active queue entry belonging to the logged-in user.
 */
export async function getMyActiveQueues(): Promise<MyActiveQueue[]> {
  const { data: userData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !userData.user) {
    throw new Error("Please log in to view your active queues.");
  }

  const { data: entries, error: entriesError } = await supabase
    .from("queue_entries")
    .select("queue_id, token_number, status")
    .eq("user_id", userData.user.id)
    .in("status", ["pending_verification", "waiting", "called"]);

  if (entriesError) {
    throw new Error(entriesError.message);
  }

  if (!entries?.length) {
    return [];
  }

  const queueIds = [
    ...new Set(
      entries
        .map((entry) => entry.queue_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  if (!queueIds.length) {
    return [];
  }

  const { data: queues, error: queuesError } = await supabase
    .from("queues")
    .select("id, service_id, average_service_time")
    .in("id", queueIds);

  if (queuesError) {
    throw new Error(queuesError.message);
  }

  if (!queues?.length) {
    return [];
  }

  const serviceIds = [
    ...new Set(
      queues
        .map((queue) => queue.service_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const { data: services, error: servicesError } = serviceIds.length
    ? await supabase
        .from("services")
        .select("id, name")
        .in("id", serviceIds)
    : { data: [], error: null };

  if (servicesError) {
    throw new Error(servicesError.message);
  }

  const queueMap = new Map(
    queues.map((queue) => [queue.id, queue])
  );

  const serviceMap = new Map(
    (services ?? []).map((service) => [service.id, service])
  );

  const activeQueues: MyActiveQueue[] = [];

  for (const entry of entries) {
    if (!entry.queue_id) continue;

    const queue = queueMap.get(entry.queue_id);
    if (!queue) continue;

    const service = queue.service_id
      ? serviceMap.get(queue.service_id)
      : undefined;

    const averageMinutes = queue.average_service_time;

    // Pending requests appear on the Home screen but never count toward
    // waiting totals or estimated wait until arrival is verified.
    if (entry.status === "pending_verification") {
      activeQueues.push({
        queueId: entry.queue_id,
        serviceName: service?.name ?? "Service",
        tokenNumber: null,
        status: entry.status,
        peopleAhead: null,
        estimatedWaitMinutes: null,
      });
      continue;
    }

    let peopleAhead = 0;

    const { data: positionData, error: positionError } =
      await supabase.rpc("get_my_queue_position", {
        p_queue_id: entry.queue_id,
      });

    if (!positionError && positionData?.length) {
      peopleAhead = Number(positionData[0].people_ahead);
    }

    activeQueues.push({
      queueId: entry.queue_id,
      serviceName: service?.name ?? "Service",
      tokenNumber: entry.token_number,
      status: entry.status,
      peopleAhead,
      estimatedWaitMinutes:
        averageMinutes != null && averageMinutes > 0
          ? peopleAhead * averageMinutes
          : null,
    });
  }

  return activeQueues;
}


export interface MyQueueHistoryEntry {
  id: string;
  queueId: string;
  serviceName: string;
  tokenNumber: number;
  status: string;
  joinedAt: string;
  servedAt: string | null;
}

/**
 * Loads the signed-in user's previous queue entries from Supabase.
 * Entries still waiting or called are excluded from Queue History.
 */
export async function getMyQueueHistory(): Promise<MyQueueHistoryEntry[]> {
  const { data: userData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !userData.user) {
    throw new Error("Please log in to view your queue history.");
  }

  const { data: entries, error: entriesError } = await supabase
    .from("queue_entries")
    .select("id, queue_id, token_number, status, joined_at, served_at")
    .eq("user_id", userData.user.id)
    .order("joined_at", { ascending: false });

  if (entriesError) {
    throw new Error(entriesError.message);
  }

  // Do not show entries that are still active.
  const historyEntries = (entries ?? []).filter((entry) => {
    const status = String(entry.status ?? "").toLowerCase();
    return status !== "waiting" && status !== "called";
  });

  if (historyEntries.length === 0) {
    return [];
  }

  const queueIds = [
    ...new Set(
      historyEntries
        .map((entry) => entry.queue_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const { data: queues, error: queuesError } = queueIds.length
    ? await supabase
        .from("queues")
        .select("id, service_id")
        .in("id", queueIds)
    : { data: [], error: null };

  if (queuesError) {
    throw new Error(queuesError.message);
  }

  const serviceIds = [
    ...new Set(
      (queues ?? [])
        .map((queue) => queue.service_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const { data: services, error: servicesError } = serviceIds.length
    ? await supabase
        .from("services")
        .select("id, name")
        .in("id", serviceIds)
    : { data: [], error: null };

  if (servicesError) {
    throw new Error(servicesError.message);
  }

  const queueMap = new Map(
    (queues ?? []).map((queue) => [queue.id, queue])
  );

  const serviceMap = new Map(
    (services ?? []).map((service) => [service.id, service])
  );

  return historyEntries.map((entry) => {
    const queue = queueMap.get(entry.queue_id);
    const service = queue?.service_id
      ? serviceMap.get(queue.service_id)
      : undefined;

    return {
      id: entry.id,
      queueId: entry.queue_id,
      serviceName: service?.name ?? "Unknown service",
      tokenNumber: entry.token_number,
      status: String(entry.status ?? "unknown"),
      joinedAt: entry.joined_at,
      servedAt: entry.served_at ?? null,
    };
  });
}




export interface VerifiedQueueEntry extends SecureQueueEntry {}

/** Activate the signed-in user's pending queue request using an on-site QR code. */
export async function verifySupabaseQueueArrival(
  queueId: string,
  code: string
): Promise<VerifiedQueueEntry> {
  const { data: userData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !userData.user) {
    throw new Error("Please log in before verifying your arrival.");
  }

  const { data, error } = await supabase.rpc("verify_queue_arrival", {
    p_queue_id: queueId,
    p_code: code,
  });

  if (error) throw new Error(error.message);

  const entry = (data as VerifiedQueueEntry[] | null)?.[0];
  if (!entry) {
    throw new Error("The server did not return a verified queue entry.");
  }

  return entry;
}

/** Cancel the signed-in user's own pending or active entry through the secure RPC. */
export async function cancelMyQueueEntry(queueId: string): Promise<void> {
  const { data: userData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !userData.user) {
    throw new Error("Please log in before cancelling a queue entry.");
  }

  const { error } = await supabase.rpc("cancel_my_queue_entry", {
    p_queue_id: queueId,
  });

  if (error) throw new Error(error.message);
}
