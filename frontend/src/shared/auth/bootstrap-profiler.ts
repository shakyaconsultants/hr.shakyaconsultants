export interface BootstrapTimingEntry {
  operation: string;
  elapsedMs: number;
  deltaMs: number;
}

export interface BootstrapReport {
  totalMs: number;
  targetMs: number;
  withinTarget: boolean;
  operations: BootstrapTimingEntry[];
}

const BOOTSTRAP_TARGET_MS = 300;

export class BootstrapProfiler {
  private readonly startedAt = performance.now();
  private lastMark = this.startedAt;
  private readonly operations: BootstrapTimingEntry[] = [];

  mark(operation: string): void {
    const now = performance.now();
    this.operations.push({
      operation,
      elapsedMs: Math.round(now - this.startedAt),
      deltaMs: Math.round(now - this.lastMark),
    });
    this.lastMark = now;
  }

  report(): BootstrapReport {
    const totalMs = Math.round(performance.now() - this.startedAt);
    const report: BootstrapReport = {
      totalMs,
      targetMs: BOOTSTRAP_TARGET_MS,
      withinTarget: totalMs <= BOOTSTRAP_TARGET_MS,
      operations: [...this.operations],
    };

    if (import.meta.env.DEV) {
      console.group(
        `[bootstrap] ${report.withinTarget ? '✓' : '⚠'} ${totalMs}ms (target ≤${BOOTSTRAP_TARGET_MS}ms)`,
      );
      for (const entry of report.operations) {
        console.log(`  ${entry.operation.padEnd(28)} +${String(entry.deltaMs).padStart(4)}ms  (${entry.elapsedMs}ms)`);
      }
      console.groupEnd();
    }

    return report;
  }
}
