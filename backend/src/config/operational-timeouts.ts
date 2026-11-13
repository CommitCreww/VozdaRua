// Human approval 2026-11-13, DT 12.6. Durations in milliseconds.
export const OPERATIONAL_TIMEOUTS = Object.freeze({
  postgresConnectMs: 5_000,
  postgresQueryMs: 10_000,
  mailLeaseMs: 60_000,
  postmarkRequestMs: 10_000,
  shutdownMs: 30_000
});
