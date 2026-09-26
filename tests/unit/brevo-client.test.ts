import { describe, it, expect, vi, afterEach } from 'vitest';
import { createBrevoClient } from '@/lib/email/brevo-client';

describe('createBrevoClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a request to the Brevo transactional email API with the expected shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);

    const client = createBrevoClient({
      apiKey: 'test-key',
      senderEmail: 'no-reply@example.com',
      senderName: 'EspaceCredit',
    });
    await client.send({
      to: [{ email: 'client@example.com', name: 'Ada Lovelace' }],
      subject: 'Hello',
      htmlContent: '<p>Hi</p>',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(options.method).toBe('POST');
    expect(options.headers['api-key']).toBe('test-key');
    expect(options.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(options.body);
    expect(body.sender).toEqual({ name: 'EspaceCredit', email: 'no-reply@example.com' });
    expect(body.to).toEqual([{ email: 'client@example.com', name: 'Ada Lovelace' }]);
    expect(body.subject).toBe('Hello');
    expect(body.htmlContent).toBe('<p>Hi</p>');
  });

  it('throws with the response body when Brevo rejects the send', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 401, text: async () => '{"message":"Unauthorized"}' });
    vi.stubGlobal('fetch', fetchMock);

    const client = createBrevoClient({
      apiKey: 'bad-key',
      senderEmail: 'no-reply@example.com',
      senderName: 'EspaceCredit',
    });

    await expect(
      client.send({ to: [{ email: 'client@example.com' }], subject: 'Hello', htmlContent: '<p>Hi</p>' })
    ).rejects.toThrow(/401/);
  });
});
