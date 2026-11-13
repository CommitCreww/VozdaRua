import type { AuthMailTransport } from '../services/auth-mail.js';

type Message = Parameters<AuthMailTransport['send']>[0];
type Result = Awaited<ReturnType<AuthMailTransport['send']>>;
export interface PostmarkOptions {
  serverToken: string;
  from: string;
  messageStream: string;
  timeoutMs: number;
  // Injection is mandatory: composition never selects a live transport implicitly.
  fetch: typeof globalThis.fetch;
  render(message: Message): { subject: string; textBody: string };
}
const mailbox = /^[^\s<>,;@]+@[^\s<>,;@]+\.[^\s<>,;@]+$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_RESPONSE_BYTES = 16_384; // Protocol resource bound, not an operational quota.

async function readReply(response: Response, signal: AbortSignal): Promise<unknown> {
  if (!response.body) return undefined;
  const reader = response.body.getReader();
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) cancel();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) throw new Error('Invalid mail response');
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } finally { signal.removeEventListener('abort', cancel); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

// DT 12.5 / D05 approves HTTPS. Real provider validation and operational gates remain pending.
export function createPostmarkTransport(options: PostmarkOptions): AuthMailTransport {
  if (!options || !options.serverToken || /\s/.test(options.serverToken) || !mailbox.test(options.from) ||
      !/^[a-zA-Z0-9_-]+$/.test(options.messageStream) || !Number.isSafeInteger(options.timeoutMs) || options.timeoutMs <= 0 ||
      typeof options.fetch !== 'function' || typeof options.render !== 'function') {
    throw new Error('Postmark configuration unavailable');
  }
  return {
    async send(message, signal): Promise<Result> {
      if (signal.aborted) return 'TEMPORARY';
      if (!mailbox.test(message.recipient) || !uuid.test(message.idempotencyKey)) return 'PERMANENT';
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      let onAbort: () => void = () => {};
      const interrupted = new Promise<Result>((resolve) => {
        onAbort = () => { controller.abort(); resolve('TEMPORARY'); };
        signal.addEventListener('abort', onAbort, { once: true });
        timer = setTimeout(onAbort, options.timeoutMs);
      });
      const request = async (): Promise<Result> => {
        const rendered = options.render(message);
        if (!rendered.subject || /[\r\n]/.test(rendered.subject) || !rendered.textBody) return 'PERMANENT';
        const response = await options.fetch('https://api.postmarkapp.com/email', {
          method: 'POST', redirect: 'error', signal: controller.signal,
          headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Postmark-Server-Token': options.serverToken },
          body: JSON.stringify({ From: options.from, To: message.recipient, Subject: rendered.subject,
            TextBody: rendered.textBody, MessageStream: options.messageStream, TrackOpens: false, TrackLinks: 'None',
            // Correlation only: Metadata is not a provider guarantee of idempotent delivery.
            Metadata: { auth_intent_id: message.idempotencyKey } })
        });
        if (response.status !== 200) {
          await response.body?.cancel().catch(() => {});
          return [401, 404, 413, 415, 422].includes(response.status) ? 'PERMANENT' : 'TEMPORARY';
        }
        const reply = await readReply(response, controller.signal);
        if (typeof reply !== 'object' || reply === null) return 'TEMPORARY';
        const value = reply as Record<string, unknown>;
        return value.ErrorCode === 0 && typeof value.MessageID === 'string' && uuid.test(value.MessageID) ? 'DELIVERED' : 'TEMPORARY';
      };
      try { return await Promise.race([request().catch((): Result => 'TEMPORARY'), interrupted]); }
      finally { clearTimeout(timer); signal.removeEventListener('abort', onAbort); }
    }
  };
}
