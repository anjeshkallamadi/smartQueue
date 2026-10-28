
import { supabase } from "../lib/supabase";

/** Queue entry returned by the secure join RPC. */
export interface SecureQueueEntry {
  entry_id: string;
  queue_id: string;
  token_number: number;
  entry_status: string;
  people_ahead: number;
}

/** Queue record stored in Supabase. */
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

/** Validate a Supabase UUID. */
function isValidQueueId(queueId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    queueId
  );
}

/** Atomically join a queue through the authenticated Supabase RPC. */
export async function joinSupabaseQueue(
  queueId: string
): Promise<SecureQueueEntry> {
  if (!isValidQueueId(queueId)) {
    throw new Error("A valid Supabase queue UUID is required.");
  }

  const { data: userData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !userData.user) {
    throw new Error("Please log in before joining a queue.");
  }

  const { data, error } = await supabase.rpc("join_queue_secure", {
    p_queue_id: queueId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const entry = (data as SecureQueueEntry[] | null)?.[0];

  if (!entry) {
    throw new Error("The server did not return a queue entry.");
  }

  return entry;
}

/** Read the authenticated user's active entry in a specific queue. */
export async function getMyActiveQueueEntry(
  queueId: string
): Promise<{
  id: string;
  queue_id: string;
  token_number: number;
  status: string;
  joined_at: string;
} | null> {
  if (!isValidQueueId(queueId)) {
    throw new Error("A valid Supabase queue UUID is required.");
  }

  const { data: userData, error: authError } =
    await supabase.auth.getUser();

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

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/** Read a queue by its Supabase UUID. */
export async function getSupabaseQueue(
  queueId: string
): Promise<QueueRecord> {
  if (!isValidQueueId(queueId)) {
    throw new Error("A valid Supabase queue UUID is required.");
  }

  const { data, error } = await supabase
    .from("queues")
    .select(
      "id, service_id, status, current_token, average_service_time"
    )
    .eq("id", queueId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as QueueRecord;
}

/** A service that currently has an active queue. */
export interface AvailableServiceQueue {
  queueId: string;
  serviceId: string;
  serviceName: string;
  description: string;
  status: string;
}

/**
 * Load real services and their active queues from Supabase.
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

    if (!service) {
      return [];
    }

    return [
      {
        queueId: queue.id,
        serviceId: service.id,
        serviceName: service.name,
        description: service.description ?? "",
        status: queue.status,
      },
    ];
  });
}

/** Position information returned by the queue-position RPC. */
export interface MyQueuePosition {
  token_number: number;
  entry_status: string;
  people_ahead: number;
}

/** Get the signed-in user's position in a specific queue. */
export async function getMyQueuePosition(
  queueId: string
): Promise<MyQueuePosition> {
  if (!isValidQueueId(queueId)) {
    throw new Error("A valid Supabase queue UUID is required.");
  }

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

/** Get the token currently being served, if available. */
export async function getNowServingToken(
  queueId: string
): Promise<number | null> {
  if (!isValidQueueId(queueId)) {
    throw new Error("A valid Supabase queue UUID is required.");
  }

  const { data, error } = await supabase.rpc(
    "get_queue_now_serving",
    { p_queue_id: queueId }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as number | null;
}

/** Active queue data used by the Home screen. */
export interface MyActiveQueue {
  queueId: string;
  serviceName: string;
  tokenNumber: number;
  status: string;
  peopleAhead: number | null;
  estimatedWaitMinutes: number | null;
}

/**
 * Load all active queue entries belonging to the signed-in user.
 *
 * If a position lookup fails, position and estimated wait remain null.
 * This prevents the UI from incorrectly displaying a zero-minute wait.
 */
export async function getMyActiveQueues(): Promise<MyActiveQueue[]> {
  const { data: userData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !userData.user) {
    throw new Error("Please log in to view your active queues.");
  }

  const { data: entries, error: entriesError } = await supabase
    .from("queue_entries")
    .select("queue_id, token_number, status, joined_at")
    .eq("user_id", userData.user.id)
    .in("status", ["waiting", "called"])
    .order("joined_at", { ascending: true });

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
    if (!entry.queue_id) {
      continue;
    }

    const queue = queueMap.get(entry.queue_id);

    if (!queue) {
      continue;
    }

    const service = queue.service_id
      ? serviceMap.get(queue.service_id)
      : undefined;

    let peopleAhead: number | null = null;

    try {
      const { data: positionData, error: positionError } =
        await supabase.rpc("get_my_queue_position", {
          p_queue_id: entry.queue_id,
        });

      if (!positionError && positionData?.length) {
        const parsedPeopleAhead = Number(
          positionData[0].people_ahead
        );

        if (
          Number.isFinite(parsedPeopleAhead) &&
          parsedPeopleAhead >= 0
        ) {
          peopleAhead = parsedPeopleAhead;
        }
      }
    } catch {
      // Keep position unavailable if the lookup fails.
      peopleAhead = null;
    }

    const averageMinutes = queue.average_service_time;

    const estimatedWaitMinutes =
      peopleAhead !== null &&
      averageMinutes !== null &&
      averageMinutes > 0
        ? peopleAhead * averageMinutes
        : null;

    activeQueues.push({
      queueId: entry.queue_id,
      serviceName: service?.name ?? "Service",
      tokenNumber: entry.token_number,
      status: entry.status,
      peopleAhead,
      estimatedWaitMinutes,
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


