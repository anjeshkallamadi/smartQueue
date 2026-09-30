export interface QueueEntry {
  userId: string;
  token: string;
  joinedAt: Date;
}

const queue: QueueEntry[] = [];

let nextTokenNumber = 1;

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