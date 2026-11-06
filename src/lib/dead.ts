import type { FeedStatus } from "./types";

/** A feed is dead if it has not published in 90+ days, or its last 3 fetches failed. */
export function detectStatus(opts: {
  lastPublishedAt?: string;
  consecutiveFailures: number;
  now?: Date;
}): FeedStatus {
  const now = opts.now ?? new Date();
  if (opts.consecutiveFailures >= 3) return "dead";
  if (opts.lastPublishedAt) {
    const last = new Date(opts.lastPublishedAt).getTime();
    if (!Number.isNaN(last) && now.getTime() - last > 90 * 24 * 60 * 60 * 1000) {
      return "dead";
    }
    return "alive";
  }
  return "unknown";
}

export function daysSince(dateIso?: string, now = new Date()): number | null {
  if (!dateIso) return null;
  const t = new Date(dateIso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / (24 * 60 * 60 * 1000));
}
