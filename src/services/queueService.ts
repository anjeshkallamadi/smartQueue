export interface QueueEntry {
  userId: string;
  token: string;
  joinedAt: Date;
}

export interface QueueHistoryEntry extends QueueEntry {
  leftAt: Date;
}

const queue: QueueEntry[] = [];
const queueHistory: QueueHistoryEntry[] = [];

let nextTokenNumber = 1;

// Average time required to serve one person (in minutes)
const AVERAGE_SERVICE_TIME = 5;

/**
 * Generates a new token for the queue.
 */
export function generateToken(): string {
  const token = `A${String(nextTokenNumber).padStart(3, "0")}`;
  nextTokenNumber++;

  return token;
}

/**
 * Adds a user to the queue and assigns a token.
 */
export function joinQueue(userId: string): QueueEntry {
  const token = generateToken();

  const entry: QueueEntry = {
    userId,
    token,
    joinedAt: new Date(),
  };

  queue.push(entry);

  return entry;
}

/**
 * Returns the current queue.
 */
export function getQueue(): QueueEntry[] {
  return [...queue];
}

/**
 * Returns the number of people ahead of a user.
 */
export function getPeopleAhead(userId: string): number {
  const userIndex = queue.findIndex(
    (entry) => entry.userId === userId
  );

  if (userIndex === -1) {
    return 0;
  }

  return userIndex;
}

/**
 * Returns the estimated waiting time in minutes.
 */
export function getEstimatedWaitTime(userId: string): number {
  const peopleAhead = getPeopleAhead(userId);

  return peopleAhead * AVERAGE_SERVICE_TIME;
}

/**
 * Returns the current status of a user's queue.
 */
export function getQueueStatus(userId: string): string {
  const userIndex = queue.findIndex(
    (entry) => entry.userId === userId
  );

  if (userIndex === -1) {
    return "Not in queue";
  }

  if (userIndex === 0) {
    return "Now serving";
  }

  return "Waiting";
}

/**
 * Removes a user from the queue.
 */
export function leaveQueue(userId: string): boolean {
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
 * Returns the user's queue history.
 */
export function getQueueHistory(userId: string): QueueHistoryEntry[] {
  return queueHistory.filter(
    (entry) => entry.userId === userId
  );
}