// =============================================================================
// JOB QUEUE - Scheduler stub for future AI automation
// =============================================================================
// Global queue of unassigned jobs. Future AI scheduler will pull from this
// queue and assign to idle colonists. For now, player-issued jobs bypass
// this and go directly to JobProcessor.

import type { Job } from "./types";

export class JobQueue {
  private queue: Job[] = [];

  /** Add a job to the queue */
  enqueue(job: Job): void {
    this.queue.push(job);
  }

  /** Remove and return the highest-priority job */
  dequeue(): Job | undefined {
    return this.queue.shift();
  }

  /** Peek at the next job without removing it */
  peek(): Job | undefined {
    return this.queue[0];
  }

  /** Remove a specific job by ID */
  remove(jobId: string): boolean {
    const index = this.queue.findIndex((j) => j.id === jobId);
    if (index === -1) return false;
    this.queue.splice(index, 1);
    return true;
  }

  /** Get all queued jobs (readonly) */
  getAll(): readonly Job[] {
    return this.queue;
  }

  get length(): number {
    return this.queue.length;
  }
}

export const jobQueue = new JobQueue();
