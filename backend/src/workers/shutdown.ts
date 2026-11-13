import { OPERATIONAL_TIMEOUTS } from '../config/operational-timeouts.js';

export function createShutdownDeadline(onExpired: () => void, milliseconds: number = OPERATIONAL_TIMEOUTS.shutdownMs) {
  if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0) throw new Error('Invalid shutdown deadline');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let reject!: (error: Error) => void;
  const expired = new Promise<never>((_resolve, fail) => { reject = fail; });
  return {
    expired,
    start() {
      if (timer) return;
      timer = setTimeout(() => {
        try { onExpired(); } catch {} finally { reject(new Error('Graceful shutdown deadline exceeded')); }
      }, milliseconds);
    },
    clear() { clearTimeout(timer); }
  };
}
