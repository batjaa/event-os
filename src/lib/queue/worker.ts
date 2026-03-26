import type {
  QueueDriver,
  WorkerOptions,
  ClaimedJob,
  JobDefinition,
} from "./types";

type JobRegistry = Map<string, JobDefinition>;

const DEFAULT_OPTIONS: Required<WorkerOptions> = {
  queues: ["high", "default"],
  pollInterval: 1000,
  maxPollInterval: 10000,
  staleTimeout: 300,
};

/**
 * Queue worker — polls for jobs, executes handlers, manages retries.
 *
 * Adaptive polling: starts at pollInterval (1s), doubles on empty
 * polls up to maxPollInterval (10s), resets on job found.
 *
 * Graceful shutdown: SIGTERM/SIGINT set stopping flag, current
 * job finishes before exit.
 */
export class Worker {
  private stopping = false;
  private driver: QueueDriver;
  private registry: JobRegistry;
  private options: Required<WorkerOptions>;
  private staleTimer: ReturnType<typeof setInterval> | null = null;
  private shutdownHandler: (() => void) | null = null;

  constructor(
    driver: QueueDriver,
    registry: JobRegistry,
    options?: WorkerOptions
  ) {
    this.driver = driver;
    this.registry = registry;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async start(): Promise<void> {
    this.registerShutdownHandlers();
    this.startStaleRecovery();

    console.log(
      `[queue] Worker started. Queues: ${this.options.queues.join(", ")}. ` +
        `Poll: ${this.options.pollInterval}ms–${this.options.maxPollInterval}ms`
    );

    let currentInterval = this.options.pollInterval;

    while (!this.stopping) {
      const claimed = await this.driver.pop(this.options.queues);

      if (!claimed) {
        await sleep(currentInterval);
        currentInterval = Math.min(
          currentInterval * 2,
          this.options.maxPollInterval
        );
        continue;
      }

      currentInterval = this.options.pollInterval;
      await this.process(claimed);
    }

    this.cleanup();
    console.log("[queue] Worker stopped gracefully.");
  }

  /**
   * Process a single job — called by the poll loop or directly in tests.
   */
  async process(job: ClaimedJob): Promise<void> {
    const handler = this.registry.get(job.name);
    const logPrefix = `[queue] ${job.name} #${job.id.slice(0, 8)}`;

    if (!handler) {
      console.error(`${logPrefix} — unknown job type, burying`);
      await this.driver.bury(job.id, `Unknown job type: ${job.name}`);
      return;
    }

    const startTime = Date.now();
    const timeoutMs = (handler.timeoutSeconds ?? 60) * 1000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await Promise.race([
        handler.handle(job.payload, {
          attempt: job.attempts,
          jobId: job.id,
          logPrefix,
          signal: controller.signal,
        }),
        new Promise<never>((_, reject) => {
          const onAbort = () =>
            reject(new Error(`Job timed out after ${timeoutMs}ms`));
          if (controller.signal.aborted) {
            onAbort();
            return;
          }
          controller.signal.addEventListener("abort", onAbort, { once: true });
        }),
      ]);

      clearTimeout(timeout);
      await this.driver.complete(job.id);
      console.log(`${logPrefix} completed in ${Date.now() - startTime}ms`);
    } catch (err) {
      clearTimeout(timeout);
      controller.abort();
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (job.attempts >= job.maxAttempts) {
        await this.driver.bury(job.id, errorMessage);
        console.error(
          `${logPrefix} permanently failed after ${job.attempts} attempts: ${errorMessage}`
        );
      } else {
        const backoffSeconds = handler.backoffSeconds ?? 10;
        const delay = backoffSeconds * Math.pow(2, job.attempts - 1);
        const nextRetry = new Date(Date.now() + delay * 1000);
        await this.driver.fail(job.id, errorMessage, job.attempts, nextRetry);
        console.warn(
          `${logPrefix} attempt ${job.attempts}/${job.maxAttempts} failed, ` +
            `retry at ${nextRetry.toISOString()}: ${errorMessage}`
        );
      }
    }
  }

  /**
   * Signal the worker to stop after the current job finishes.
   */
  stop(): void {
    this.stopping = true;
  }

  private registerShutdownHandlers(): void {
    // Remove any previous handlers to prevent stacking on multiple start() calls
    if (this.shutdownHandler) {
      process.removeListener("SIGTERM", this.shutdownHandler);
      process.removeListener("SIGINT", this.shutdownHandler);
    }

    this.shutdownHandler = () => {
      console.log("[queue] Shutdown signal received, finishing current job...");
      this.stop();
    };
    process.on("SIGTERM", this.shutdownHandler);
    process.on("SIGINT", this.shutdownHandler);
  }

  private startStaleRecovery(): void {
    if (this.staleTimer) clearInterval(this.staleTimer);

    this.staleTimer = setInterval(async () => {
      try {
        const released = await this.driver.releaseStale(
          this.options.staleTimeout
        );
        if (released > 0) {
          console.log(`[queue] Released ${released} stale job(s)`);
        }
      } catch (err) {
        console.error("[queue] Stale recovery error:", err);
      }
    }, 60_000);
  }

  private cleanup(): void {
    if (this.staleTimer) {
      clearInterval(this.staleTimer);
      this.staleTimer = null;
    }
    if (this.shutdownHandler) {
      process.removeListener("SIGTERM", this.shutdownHandler);
      process.removeListener("SIGINT", this.shutdownHandler);
      this.shutdownHandler = null;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
