export interface QueueEntry {
  queueId: string;
  userId: string;
  token: string;
  joinedAt: Date;
}

export interface QueueHistoryEntry extends QueueEntry {
  leftAt: Date;
}

// Store active entries separately for each service queue.
const queues = new Map<string, QueueEntry[]>();

// Keep token numbers separate for each queue.
const nextTokenNumbers = new Map<string, number>();

const queueHistory: QueueHistoryEntry[] = [];

// Average service time per person, in minutes.
const AVERAGE_SERVICE_TIME = 5;

/**
 * Gets a queue or creates it if it doesn't exist.
 */
function getOrCreateQueue(queueId: string): QueueEntry[] {
  let queue = queues.get(queueId);

  if (!queue) {
    queue = [];
    queues.set(queueId, queue);
  }

  return queue;
}

/**
 * Generates a token within a specific queue.
 */
export function generateToken(queueId: string): string {
  const nextNumber = nextTokenNumbers.get(queueId) ?? 1;

  nextTokenNumbers.set(queueId, nextNumber + 1);

  return `A${String(nextNumber).padStart(3, "0")}`;
}

/**
 * Adds a user to a queue.
 * Prevents duplicate active entries for the same user and queue.
 */
export function joinQueue(
  queueId: string,
  userId: string
): QueueEntry {
  if (!queueId.trim() || !userId.trim()) {
    throw new Error("queueId and userId are required.");
  }

  const queue = getOrCreateQueue(queueId);

  const existingEntry = queue.find(
    (entry) => entry.userId === userId
  );

  if (existingEntry) {
    return { ...existingEntry };
  }

  const entry: QueueEntry = {
    queueId,
    userId,
    token: generateToken(queueId),
    joinedAt: new Date(),
  };

  queue.push(entry);

  return { ...entry };
}

/**
 * Returns the active entries for a specific queue.
 */
export function getQueue(queueId: string): QueueEntry[] {
  return (queues.get(queueId) ?? []).map(
    (entry) => ({ ...entry })
  );
}

/**
 * Returns the number of people ahead of a user.
 * Returns -1 if the user isn't in the queue.
 */
export function getPeopleAhead(
  queueId: string,
  userId: string
): number {
  const queue = queues.get(queueId) ?? [];

  return queue.findIndex(
    (entry) => entry.userId === userId
  );
}

/**
 * Estimates waiting time in minutes.
 */
export function getEstimatedWaitTime(
  queueId: string,
  userId: string
): number {
  const peopleAhead = getPeopleAhead(queueId, userId);

  if (peopleAhead === -1) {
    return 0;
  }

  return peopleAhead * AVERAGE_SERVICE_TIME;
}

/**
 * Returns the user's status in a specific queue.
 */
export function getQueueStatus(
  queueId: string,
  userId: string
): string {
  const peopleAhead = getPeopleAhead(queueId, userId);

  if (peopleAhead === -1) {
    return "Not in queue";
  }

  return peopleAhead === 0 ? "Now serving" : "Waiting";
}

/**
 * Removes a user from a specific queue and records their history.
 */
export function leaveQueue(
  queueId: string,
  userId: string
): boolean {
  const queue = queues.get(queueId);

  if (!queue) {
    return false;
  }

  const userIndex = queue.findIndex(
    (entry) => entry.userId === userId
  );

  if (userIndex === -1) {
    return false;
  }

  const [removedEntry] = queue.splice(userIndex, 1);

  queueHistory.push({
    ...removedEntry,
    leftAt: new Date(),
  });

  return true;
}

/**
 * Returns a user's queue history.
 * Optionally filters history by queue ID.
 */
export function getQueueHistory(
  userId: string,
  queueId?: string
): QueueHistoryEntry[] {
  return queueHistory
    .filter(
      (entry) =>
        entry.userId === userId &&
        (queueId === undefined || entry.queueId === queueId)
    )
    .map((entry) => ({ ...entry }));
}