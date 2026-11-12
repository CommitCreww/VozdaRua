// Infrastructure smoke test only: SMTP capture through the local Mailpit service.
import assert from 'node:assert/strict';
import net from 'node:net';
import { randomUUID } from 'node:crypto';

const smtpPort = Number(process.env.P01_SMTP_PORT || 11025);
const httpPort = Number(process.env.P01_MAIL_HTTP_PORT || 18025);
const subject = `P01-${randomUUID()}`;
const steps = [
  [220, 'EHLO localhost\r\n'],
  [250, 'MAIL FROM:<p01-sender@example.invalid>\r\n'],
  [250, 'RCPT TO:<p01-recipient@example.invalid>\r\n'],
  [250, 'DATA\r\n'],
  [354, `From: p01-sender@example.invalid\r\nTo: p01-recipient@example.invalid\r\nSubject: ${subject}\r\nMessage-ID: <${randomUUID()}@example.invalid>\r\n\r\nLocal infrastructure validation only.\r\n.\r\n`],
  [250, 'QUIT\r\n'],
  [221, null],
];
await new Promise((resolve, reject) => {
  const socket = net.connect({ host: '127.0.0.1', port: smtpPort });
  let buffer = '';
  let index = 0;
  socket.setTimeout(15000, () => socket.destroy(new Error('SMTP timeout')));
  socket.on('error', reject);
  socket.on('data', chunk => {
    buffer += chunk.toString('utf8');
    while (buffer.includes('\r\n')) {
      const end = buffer.indexOf('\r\n');
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      if (!/^\d{3} /.test(line)) continue; // wait for final line of multiline SMTP reply
      const step = steps[index++];
      if (!step || Number(line.slice(0, 3)) !== step[0]) {
        socket.destroy(new Error(`Unexpected SMTP response code ${line.slice(0, 3)}`));
        return;
      }
      if (step[1]) socket.write(step[1]);
      else { socket.end(); resolve(); }
    }
  });
});
const response = await fetch(`http://127.0.0.1:${httpPort}/api/v1/messages`, { signal: AbortSignal.timeout(10000) });
assert.equal(response.status, 200);
const payload = await response.json();
const message = payload.messages.find(item => item.Subject === subject);
assert.ok(message, 'SMTP message was not captured by local Mailpit');
console.log(JSON.stringify({ captured: true, id: message.ID, subject, total: payload.total }));
