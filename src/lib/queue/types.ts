// ─── Job Queue Type Definitions ─────────────────────────
//
//  Core interfaces for the queue system. The QueueDriver
//  interface enables swapping backends (database, Redis, SQS)
//  without changing job definitions or dispatch code.
//

/**
 * Defines a job type with its handler and retry configuration.
 * Each job is a plain object — no class inheritance needed.
 */
export interface JobDefinition<TPayload = unknown> {
  /** Unique job type name, e.g. "send-notification" */
  readonly name: string;
  /** Which named queue to run on. Default: "default" */
  readonly queue?: string;
  /** Max retry attempts before moving to failed_jobs. Default: 3 */
  readonly maxAttempts?: number;
  /** Base backoff in seconds (exponential: base * 2^attempt). Default: 10 */
  readonly backoffSeconds?: number;
  /** Execution timeout in seconds. AbortSignal fires after this. Default: 60 */
  readonly timeoutSeconds?: number;
  /** The handler — receives typed payload + context */
  handle(payload: TPayload, ctx: JobContext): Promise<void>;
}

/**
 * Context passed to job handlers during execution.
 */
export interface JobContext {
  /** Current attempt number (1-based) */
  attempt: number;
  /** The job row ID (for logging/debugging) */
  jobId: string;
  /** Pre-formatted log prefix: "[queue] job-name #id" */
  logPrefix: string;
  /** AbortSignal — fires after timeoutSeconds. Pass to fetch(), check in loops. */
  signal: AbortSignal;
}

// ─── Queue Driver Interface ─────────────────────────────

/**
 * Backend adapter for queue storage. Database driver is the
 * default; implement this interface for Redis/SQS/etc.
 */
export interface QueueDriver {
  /** Push a single job onto the queue. Returns the job row ID. */
  push(job: EnqueuedJob): Promise<string>;
  /** Push multiple jobs in a single bulk insert. Returns job IDs. */
  pushMany(jobs: EnqueuedJob[]): Promise<string[]>;
  /** Claim the next available job from the given queues. Returns null if empty. */
  pop(queues: string[]): Promise<ClaimedJob | null>;
  /** Mark a job as completed — deletes it from the queue. */
  complete(jobId: string): Promise<void>;
  /** Mark a job as failed — reset to pending with backoff delay. */
  fail(
    jobId: string,
    error: string,
    attempts: number,
    nextRetryAt: Date | null
  ): Promise<void>;
  /** Move a job to failed_jobs permanently (atomic transaction). */
  bury(jobId: string, error: string): Promise<void>;
  /** Release stale "processing" jobs back to "pending" (crash recovery). */
  releaseStale(timeoutSeconds: number): Promise<number>;
}

// ─── Data Transfer Types ────────────────────────────────

export interface EnqueuedJob {
  name: string;
  queue: string;
  payload: unknown;
  maxAttempts: number;
  organizationId?: string;
  uniqueKey?: string;
}

export interface ClaimedJob {
  id: string;
  name: string;
  queue: string;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
  organizationId: string | null;
}

// ─── Worker Configuration ───────────────────────────────

export interface WorkerOptions {
  /** Queues to process, in priority order. Default: ["high", "default"] */
  queues?: string[];
  /** Initial poll interval in ms when queue is empty. Default: 1000 */
  pollInterval?: number;
  /** Max poll interval in ms (adaptive backoff cap). Default: 10000 */
  maxPollInterval?: number;
  /** Seconds before a "processing" job is considered stale. Default: 300 */
  staleTimeout?: number;
}
