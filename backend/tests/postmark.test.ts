import { describe, expect, it, vi } from 'vitest';
import { createPostmarkTransport, type PostmarkOptions } from '../src/integrations/postmark.js';

const message = { idempotencyKey: '12345678-1234-4234-8234-123456789012', recipient: 'synthetic@example.test', kind: 'PASSWORD_RESET' as const, token: 'synthetic-token-never-log' };
const signal = () => new AbortController().signal;
function setup(fetch: typeof globalThis.fetch, overrides: Partial<PostmarkOptions> = {}) {
  return createPostmarkTransport({ serverToken: 'synthetic-api-secret', from: 'sender@example.test', messageStream: 'outbound', timeoutMs: 30,
    fetch, render: (input) => ({ subject: 'Synthetic test', textBody: `Synthetic ${input.token}` }), ...overrides });
}
const accepted = () => Response.json({ ErrorCode: 0, MessageID: message.idempotencyKey, Message: 'OK' });

describe('Postmark HTTPS prototype (mock only)', () => {
  it('uses official fixed endpoint, explicit stream, no tracking and intent correlation', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => accepted());
    expect(await setup(fetch).send(message, signal())).toBe('DELIVERED');
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('https://api.postmarkapp.com/email');
    expect(init?.redirect).toBe('error'); expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ Accept: 'application/json', 'Content-Type': 'application/json', 'X-Postmark-Server-Token': 'synthetic-api-secret' });
    expect(JSON.parse(init!.body as string)).toEqual({ From: 'sender@example.test', To: message.recipient, Subject: 'Synthetic test',
      TextBody: `Synthetic ${message.token}`, MessageStream: 'outbound', TrackOpens: false, TrackLinks: 'None', Metadata: { auth_intent_id: message.idempotencyKey } });
    expect(init?.headers).not.toHaveProperty('Idempotency-Key');
  });
  it.each([429, 500, 503, 302, 418])('classifies HTTP %i safely as temporary', async (status) => {
    expect(await setup(async () => new Response('sensitive provider body', { status })).send(message, signal())).toBe('TEMPORARY');
  });
  it.each([401, 404, 413, 415, 422])('classifies HTTP %i as permanent without exposing provider content', async (status) => {
    expect(await setup(async () => new Response('sensitive provider body', { status })).send(message, signal())).toBe('PERMANENT');
  });
  it.each([{}, { ErrorCode: 0 }, { ErrorCode: 1, MessageID: message.idempotencyKey }, { ErrorCode: 0, MessageID: 'unexpected' }])('does not acknowledge unexpected JSON %j', async (reply) => {
    expect(await setup(async () => Response.json(reply)).send(message, signal())).toBe('TEMPORARY');
  });
  it('handles malformed and oversized replies', async () => {
    for (const body of ['not-json', 'x'.repeat(16_385)]) {
      expect(await setup(async () => new Response(body)).send(message, signal())).toBe('TEMPORARY');
    }
  });
  it('bounds hung fetch and propagates cancellation', async () => {
    let requestSignal: AbortSignal | undefined;
    const fetch: typeof globalThis.fetch = async (_url, init) => { requestSignal = init?.signal ?? undefined; return new Promise(() => {}); };
    expect(await setup(fetch, { timeoutMs: 5 }).send(message, signal())).toBe('TEMPORARY');
    expect(requestSignal?.aborted).toBe(true);
  });
  it('bounds a hung response stream', async () => {
    expect(await setup(async () => new Response(new ReadableStream({ start() {} })), { timeoutMs: 5 }).send(message, signal())).toBe('TEMPORARY');
  });
  it('cancels an active request from the worker', async () => {
    const controller = new AbortController();
    const fetch: typeof globalThis.fetch = async () => { controller.abort(); return new Promise(() => {}); };
    expect(await setup(fetch).send(message, controller.signal)).toBe('TEMPORARY');
  });
  it('never invokes fetch for cancelled/invalid messages or invalid rendered header', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => accepted());
    const controller = new AbortController(); controller.abort();
    expect(await setup(fetch).send(message, controller.signal)).toBe('TEMPORARY');
    expect(await setup(fetch).send({ ...message, recipient: 'bad\r\nBcc: other@example.test' }, signal())).toBe('PERMANENT');
    expect(await setup(fetch).send({ ...message, idempotencyKey: 'untrusted' }, signal())).toBe('PERMANENT');
    expect(await setup(fetch, { render: () => ({ subject: 'bad\nheader', textBody: 'text' }) }).send(message, signal())).toBe('PERMANENT');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('contains network/render exceptions, including secrets', async () => {
    expect(await setup(async () => { throw new Error('secret-token provider body'); }).send(message, signal())).toBe('TEMPORARY');
    expect(await setup(async () => accepted(), { render() { throw new Error('secret content'); } }).send(message, signal())).toBe('TEMPORARY');
  });
  it('rejects incomplete configuration with a constant error', () => {
    for (const override of [{ serverToken: '' }, { serverToken: 'bad\nsecret' }, { from: 'bad' }, { messageStream: '' }, { timeoutMs: 0 }]) {
      expect(() => setup(async () => accepted(), override)).toThrow('Postmark configuration unavailable');
    }
  });
});
