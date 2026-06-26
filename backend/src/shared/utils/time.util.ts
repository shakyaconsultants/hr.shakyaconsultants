export function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 8);
}

export function minutesToMilliseconds(minutes: number): number {
  return minutes * 60 * 1000;
}

export function hoursToMilliseconds(hours: number): number {
  return hours * 60 * 60 * 1000;
}

export function diffInMinutes(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 60000);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
