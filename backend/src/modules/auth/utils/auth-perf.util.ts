import { logger } from '@logging/winston.logger.js';

export interface AuthPerfStep {
  step: string;
  durationMs: number;
}

export class AuthPerfTimer {
  private readonly label: string;
  private readonly startedAt = performance.now();
  private readonly steps: AuthPerfStep[] = [];
  private lastMark = this.startedAt;

  constructor(label: string) {
    this.label = label;
  }

  mark(step: string): void {
    const now = performance.now();
    this.steps.push({ step, durationMs: Math.round((now - this.lastMark) * 100) / 100 });
    this.lastMark = now;
  }

  finish(extra?: Record<string, unknown>): void {
    const totalMs = Math.round((performance.now() - this.startedAt) * 100) / 100;
    logger.info(`[auth-perf] ${this.label}`, {
      totalMs,
      steps: this.steps,
      ...extra,
    });
  }
}
